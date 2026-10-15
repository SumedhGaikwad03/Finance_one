import { Prisma } from "../../generated/prisma/client";
import prisma from "../../lib/prisma";
import { BadRequestError } from "../../error/AppError";
import { TransactionQuery } from "../types/transaction-query.types";

export interface TransactionExecutionResult {
    operation: "SUM" | "COUNT" | "LIST" | "MAX" | "MIN";
    data: any;
}

export class TransactionQueryService {
    async execute(
        query: TransactionQuery,
        userId: number
    ): Promise<any> {
        if (!userId || typeof userId !== "number" || userId <= 0) {
            throw new BadRequestError("Valid user ID is required to execute transaction queries");
        }

        if (query.startDate && query.endDate && query.startDate > query.endDate) {
            throw new BadRequestError("Start date cannot be after end date");
        }

        // Strict multi-tenant where clause: ALWAYS scoped to authenticated userId
        const where: Prisma.TransactionWhereInput = {
            userId,
            ...(query.category && { category: query.category }),
            ...((query.startDate || query.endDate) && {
                transactionDate: {
                    ...(query.startDate && { gte: query.startDate }),
                    ...(query.endDate && { lte: query.endDate }),
                },
            }),
        };

        switch (query.operation) {
            case "SUM": {
                const aggregate = await prisma.transaction.aggregate({
                    where,
                    _sum: { amount: true },
                    _count: { _all: true },
                });

                const totalAmount = aggregate._sum.amount
                    ? Number(Number(aggregate._sum.amount).toFixed(2))
                    : 0;

                return {
                    operation: "SUM",
                    total: totalAmount,
                    count: aggregate._count._all,
                    currency: "INR",
                    filters: {
                        category: query.category ?? null,
                        startDate: query.startDate ? query.startDate.toISOString() : null,
                        endDate: query.endDate ? query.endDate.toISOString() : null,
                    },
                };
            }

            case "COUNT": {
                const count = await prisma.transaction.count({ where });

                return {
                    operation: "COUNT",
                    count,
                    filters: {
                        category: query.category ?? null,
                        startDate: query.startDate ? query.startDate.toISOString() : null,
                        endDate: query.endDate ? query.endDate.toISOString() : null,
                    },
                };
            }

            case "LIST": {
                const transactions = await prisma.transaction.findMany({
                    where,
                    take: 50,
                    orderBy: { transactionDate: "desc" },
                });

                return {
                    operation: "LIST",
                    count: transactions.length,
                    transactions: transactions.map((t) => ({
                        id: t.id,
                        amount: Number(t.amount),
                        category: t.category,
                        priority: t.priority,
                        title: t.title,
                        notes: t.notes,
                        transactionDate: t.transactionDate.toISOString(),
                        createdAt: t.createdAt.toISOString(),
                    })),
                    filters: {
                        category: query.category ?? null,
                        startDate: query.startDate ? query.startDate.toISOString() : null,
                        endDate: query.endDate ? query.endDate.toISOString() : null,
                    },
                };
            }

            case "MAX": {
                const largest = await prisma.transaction.findFirst({
                    where,
                    orderBy: { amount: "desc" },
                });

                return {
                    operation: "MAX",
                    transaction: largest
                        ? {
                              id: largest.id,
                              amount: Number(largest.amount),
                              category: largest.category,
                              priority: largest.priority,
                              title: largest.title,
                              notes: largest.notes,
                              transactionDate: largest.transactionDate.toISOString(),
                          }
                        : null,
                    amount: largest ? Number(largest.amount) : 0,
                    currency: "INR",
                    filters: {
                        category: query.category ?? null,
                        startDate: query.startDate ? query.startDate.toISOString() : null,
                        endDate: query.endDate ? query.endDate.toISOString() : null,
                    },
                };
            }

            case "MIN": {
                const smallest = await prisma.transaction.findFirst({
                    where,
                    orderBy: { amount: "asc" },
                });

                return {
                    operation: "MIN",
                    transaction: smallest
                        ? {
                              id: smallest.id,
                              amount: Number(smallest.amount),
                              category: smallest.category,
                              priority: smallest.priority,
                              title: smallest.title,
                              notes: smallest.notes,
                              transactionDate: smallest.transactionDate.toISOString(),
                          }
                        : null,
                    amount: smallest ? Number(smallest.amount) : 0,
                    currency: "INR",
                    filters: {
                        category: query.category ?? null,
                        startDate: query.startDate ? query.startDate.toISOString() : null,
                        endDate: query.endDate ? query.endDate.toISOString() : null,
                    },
                };
            }

            default:
                throw new BadRequestError(`Unsupported transaction operation: ${query.operation}`);
        }
    }
}
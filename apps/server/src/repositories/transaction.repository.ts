import { Prisma, Transaction } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import { Category, Priority, TransactionSource } from "../generated/prisma/enums";
import { updateUserInput } from "../schemas/user.schema"; 
import * as transactionSchemas from  "../schemas/transaction.schema";

export type CreateTransactionData = {
    amount: Prisma.Decimal;
    category: Category;
    priority: Priority;
    title?: string | null;
    notes?: string | null;
    transactionDate: Date;
    userId: number;
    source?: TransactionSource;
    externalId?: string | null;
    sourceMetadata?: Prisma.InputJsonValue | null;
    tags?: string[];
};

export type TransactionFilters = {
    userId: number;
    category?: Category;
    startDate?: Date;
    endDate?: Date;
};

export const createTransaction = (transaction: CreateTransactionData) => {
    const { sourceMetadata, tags, ...rest } = transaction;
    const metadata = {
        ...((sourceMetadata as Record<string, unknown> | null) || {}),
        ...(tags && tags.length > 0 ? { tags } : {}),
    };

    return prisma.transaction.create({
        data: {
            ...rest,
            ...(Object.keys(metadata).length > 0
                ? { sourceMetadata: metadata as Prisma.InputJsonValue }
                : {}),
        },
    });
};

export const findTransactionByExternalId = (
    userId: number,
    source: TransactionSource,
    externalId: string
) => {
    return prisma.transaction.findFirst({
        where: {
            userId,
            source,
            externalId,
        },
    });
};

export const findPotentialDuplicates = (
    userId: number,
    amount: Prisma.Decimal,
    transactionDate: Date,
    toleranceDays: number = 1
) => {
    const startDate = new Date(transactionDate);
    startDate.setDate(startDate.getDate() - toleranceDays);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(transactionDate);
    endDate.setDate(endDate.getDate() + toleranceDays);
    endDate.setHours(23, 59, 59, 999);

    return prisma.transaction.findMany({
        where: {
            userId,
            amount,
            transactionDate: {
                gte: startDate,
                lte: endDate,
            },
        },
        orderBy: {
            transactionDate: "desc",
        },
    });
};

export const getMyTransactions = async (userId: number) => {
    return prisma.transaction.findMany({ where: { userId }, orderBy: { transactionDate: "desc" } });
};

export const findTransactionById = (id: number) => {
    return prisma.transaction.findUnique({ where: { id } });
};

export const updateTransaction = async (
    id: number,
    input: transactionSchemas.UpdateTransactionInput
) => {
    const { tags, ...rest } = input;

    // Fetch existing transaction to preserve existing sourceMetadata
    const existing = await findTransactionById(id);
    const existingMetadata =
        existing?.sourceMetadata && typeof existing.sourceMetadata === "object"
            ? (existing.sourceMetadata as Record<string, unknown>)
            : {};

    const isClassificationEdit = input.category !== undefined || input.priority !== undefined;

    const updatedMetadata = {
        ...existingMetadata,
        ...(tags !== undefined ? { tags } : {}),
        ...(isClassificationEdit
            ? {
                  userConfirmed: true,
                  classificationSource: "USER_EDIT",
                  classifiedAt: new Date().toISOString(),
              }
            : {}),
    };

    const data: Prisma.TransactionUpdateInput = {
        ...rest,
        ...(input.amount !== undefined && {
            amount: new Prisma.Decimal(input.amount),
        }),
        ...(input.transactionDate !== undefined && {
            transactionDate: new Date(input.transactionDate),
        }),
        sourceMetadata: updatedMetadata as Prisma.InputJsonValue,
    };

    return prisma.transaction.update({
        where: { id },
        data,
    });
};



export const deleteTransaction = async ( id:number ) => {

    return prisma.transaction.delete({where :{ id}  }); 

}

export const findTransactionsBetweenDates = (
    userId: number,
    startDate: Date,
    endDate: Date
) => {
return prisma.transaction.findMany({
    where: {
        userId,
        transactionDate: {
            gte: startDate,
            lte: endDate,
        },
    },
     orderBy: {
            transactionDate: "desc",
        },

        // take : 5 tis comes at a later part of the system 
});
} 

export const findTransactionsByFilters = (
    filters: TransactionFilters
) => {
    return prisma.transaction.findMany({
        where: {
            userId: filters.userId,

            ...(filters.category && {
                category: filters.category,
            }),

            ...((filters.startDate || filters.endDate) && {
                transactionDate: {
                    ...(filters.startDate && {
                        gte: filters.startDate,
                    }),

                    ...(filters.endDate && {
                        lte: filters.endDate,
                    }),
                },
            }),
        },

        orderBy: {
            transactionDate: "desc",
        },
    });
};

export const findTransactions = async (
    userId: number,
    query: transactionSchemas.TransactionQuery
): Promise<Transaction[]> => {
    const where: Prisma.TransactionWhereInput = {
        userId,
        ...(query.categories && query.categories.length > 0 && {
            category: { in: query.categories },
        }),
        ...(query.priorities && query.priorities.length > 0 && {
            priority: { in: query.priorities },
        }),
        ...((query.startDate || query.endDate) && {
            transactionDate: {
                ...(query.startDate && { gte: query.startDate }),
                ...(query.endDate && { lte: query.endDate }),
            },
        }),
        ...((query.minAmount !== undefined || query.maxAmount !== undefined) && {
            amount: {
                ...(query.minAmount !== undefined && { gte: new Prisma.Decimal(query.minAmount) }),
                ...(query.maxAmount !== undefined && { lte: new Prisma.Decimal(query.maxAmount) }),
            },
        }),
        ...(query.search && {
            OR: [
                { title: { contains: query.search, mode: "insensitive" } },
                { notes: { contains: query.search, mode: "insensitive" } },
            ],
        }),
    };

    return prisma.transaction.findMany({
        where,
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
        orderBy: {
            [query.sortBy ?? "transactionDate"]: query.sortDirection ?? "desc",
        },
    });
};


export const aggregateTotalSpent = async (
    where: Prisma.TransactionWhereInput
): Promise<Prisma.Decimal> => {
    const result = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where
    });
    return result._sum.amount ?? new Prisma.Decimal(0);
};

export const countTransactions = async (
    where: Prisma.TransactionWhereInput
): Promise<number> => {
    return prisma.transaction.count({ where });
};

export const groupCategoryTotals = async (
    where: Prisma.TransactionWhereInput
): Promise<Partial<Record<Category, Prisma.Decimal>>> => {
    const groups = await prisma.transaction.groupBy({
        by: ["category"],
        _sum: { amount: true },
        where
    });

    const categoryTotals: Partial<Record<Category, Prisma.Decimal>> = {};
    for (const group of groups) {
        categoryTotals[group.category] = group._sum.amount ?? new Prisma.Decimal(0);
    }
    return categoryTotals;
};

export const groupPriorityTotals = async (
    where: Prisma.TransactionWhereInput
): Promise<Partial<Record<Priority, Prisma.Decimal>>> => {
    const groups = await prisma.transaction.groupBy({
        by: ["priority"],
        _sum: { amount: true },
        where
    });

    const priorityTotals: Partial<Record<Priority, Prisma.Decimal>> = {};
    for (const group of groups) {
        priorityTotals[group.priority] = group._sum.amount ?? new Prisma.Decimal(0);
    }
    return priorityTotals;
};

export const findLargestTransaction = async (
    where: Prisma.TransactionWhereInput
): Promise<Transaction | null> => {
    return prisma.transaction.findFirst({
        where,
        orderBy: { amount: "desc" }
    });
};

export const findRecentTransactions = async (
    where: Prisma.TransactionWhereInput,
    take: number = 5
): Promise<Transaction[]> => {
    return prisma.transaction.findMany({
        where,
        orderBy: { transactionDate: "desc" },
        take
    });
};

export const aggregateAverageTransaction = async (
    where: Prisma.TransactionWhereInput
): Promise<Prisma.Decimal> => {
    const result = await prisma.transaction.aggregate({
        _avg: { amount: true },
        where
    });
    return result._avg.amount ? new Prisma.Decimal(result._avg.amount) : new Prisma.Decimal(0);
};

export const aggregateDailySpend = async (
    where: Prisma.TransactionWhereInput
): Promise<Prisma.Decimal> => {
    const [totalSpent, dateRange] = await Promise.all([
        aggregateTotalSpent(where),
        prisma.transaction.aggregate({
            _min: { transactionDate: true },
            _max: { transactionDate: true },
            where
        })
    ]);

    if (!dateRange._min.transactionDate || !dateRange._max.transactionDate) {
        return new Prisma.Decimal(0);
    }

    const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
    const totalDays =
        Math.floor(
            (dateRange._max.transactionDate.getTime() - dateRange._min.transactionDate.getTime()) /
                MILLISECONDS_PER_DAY
        ) + 1;

    return totalSpent.div(totalDays > 0 ? totalDays : 1);
};
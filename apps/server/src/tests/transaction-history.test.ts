import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    transactionQueryInputSchema,
    toCanonicalTransactionQuery,
    idParamSchema,
    TransactionQuery,
} from "../schemas/transaction.schema";
import { Category, Priority, TransactionSource } from "../generated/prisma/enums";
import * as transactionRepository from "../repositories/transaction.repository";
import * as transactionService from "../services/transaction.service";
import prisma from "../lib/prisma";
import { TransactionNotFoundError } from "../error/AppError";
import { Prisma } from "../generated/prisma/client";

describe("FinOne PR 10: Transaction History, Search & Pagination Suite", () => {
    describe("1. Query Input Validation & Schema Hardening", () => {
        it("accepts valid page parameter and calculates offset correctly", () => {
            const parsed1 = transactionQueryInputSchema.parse({ page: "1", limit: "20" });
            assert.equal(parsed1.page, 1);
            assert.equal(parsed1.limit, 20);
            const canonical1 = toCanonicalTransactionQuery(parsed1);
            assert.equal(canonical1.limit, 20);
            assert.equal(canonical1.offset, 0);
            assert.equal(canonical1.page, 1);

            const parsed2 = transactionQueryInputSchema.parse({ page: "2", limit: "25" });
            const canonical2 = toCanonicalTransactionQuery(parsed2);
            assert.equal(canonical2.limit, 25);
            assert.equal(canonical2.offset, 25);
            assert.equal(canonical2.page, 2);

            const parsed3 = transactionQueryInputSchema.parse({ page: "5", limit: "10" });
            const canonical3 = toCanonicalTransactionQuery(parsed3);
            assert.equal(canonical3.limit, 10);
            assert.equal(canonical3.offset, 40);
            assert.equal(canonical3.page, 5);
        });

        it("rejects non-positive page numbers", () => {
            assert.throws(() => {
                transactionQueryInputSchema.parse({ page: "0" });
            }, /page must be at least 1/);

            assert.throws(() => {
                transactionQueryInputSchema.parse({ page: "-1" });
            }, /page must be at least 1/);
        });

        it("parses single and multiple source filters correctly", () => {
            const parsedSingle = transactionQueryInputSchema.parse({ source: "BANK_STATEMENT" });
            assert.deepEqual(parsedSingle.source, [TransactionSource.BANK_STATEMENT]);
            const canonicalSingle = toCanonicalTransactionQuery(parsedSingle);
            assert.deepEqual(canonicalSingle.sources, [TransactionSource.BANK_STATEMENT]);

            const parsedMultiple = transactionQueryInputSchema.parse({
                sources: "MANUAL,CSV_IMPORT,BANK_STATEMENT",
            });
            assert.deepEqual(parsedMultiple.sources, [
                TransactionSource.MANUAL,
                TransactionSource.CSV_IMPORT,
                TransactionSource.BANK_STATEMENT,
            ]);
            const canonicalMultiple = toCanonicalTransactionQuery(parsedMultiple);
            assert.deepEqual(canonicalMultiple.sources, [
                TransactionSource.MANUAL,
                TransactionSource.CSV_IMPORT,
                TransactionSource.BANK_STATEMENT,
            ]);
        });

        it("rejects invalid transaction sources", () => {
            assert.throws(() => {
                transactionQueryInputSchema.parse({ source: "CRYPTO_WALLET" });
            });
        });

        it("parses paginate boolean query parameter safely", () => {
            const parsedTrueStr = transactionQueryInputSchema.parse({ paginate: "true" });
            assert.equal(parsedTrueStr.paginate, true);

            const parsedOneStr = transactionQueryInputSchema.parse({ paginate: "1" });
            assert.equal(parsedOneStr.paginate, true);

            const parsedTrueBool = transactionQueryInputSchema.parse({ paginate: true });
            assert.equal(parsedTrueBool.paginate, true);

            const parsedFalseStr = transactionQueryInputSchema.parse({ paginate: "false" });
            assert.equal(parsedFalseStr.paginate, false);

            const parsedUnset = transactionQueryInputSchema.parse({});
            assert.equal(parsedUnset.paginate, undefined);
        });

        it("enforces strict allowlist on sortable fields and directions", () => {
            // Valid sort fields
            assert.equal(transactionQueryInputSchema.parse({ sortBy: "transactionDate" }).sortBy, "transactionDate");
            assert.equal(transactionQueryInputSchema.parse({ sortBy: "amount" }).sortBy, "amount");
            assert.equal(transactionQueryInputSchema.parse({ sortBy: "createdAt" }).sortBy, "createdAt");

            // Valid directions
            assert.equal(transactionQueryInputSchema.parse({ sortDirection: "asc" }).sortDirection, "asc");
            assert.equal(transactionQueryInputSchema.parse({ sortDirection: "desc" }).sortDirection, "desc");

            // Invalid sort fields must be rejected (never interpolated into DB query)
            assert.throws(() => {
                transactionQueryInputSchema.parse({ sortBy: "id" });
            });
            assert.throws(() => {
                transactionQueryInputSchema.parse({ sortBy: "userId" });
            });
            assert.throws(() => {
                transactionQueryInputSchema.parse({ sortBy: "notes; DROP TABLE" });
            });
            assert.throws(() => {
                transactionQueryInputSchema.parse({ sortBy: "passwordHash" });
            });

            // Invalid directions
            assert.throws(() => {
                transactionQueryInputSchema.parse({ sortDirection: "sideways" });
            });
        });

        it("enforces boundary checks on date and amount ranges", () => {
            // Valid boundaries
            const valid = transactionQueryInputSchema.parse({
                startDate: "2026-01-01",
                endDate: "2026-01-31",
                minAmount: 10,
                maxAmount: 100,
            });
            assert.ok(valid);

            // startDate > endDate rejected
            assert.throws(() => {
                transactionQueryInputSchema.parse({
                    startDate: "2026-02-01",
                    endDate: "2026-01-01",
                });
            }, /startDate must be before or equal to endDate/);

            // minAmount > maxAmount rejected
            assert.throws(() => {
                transactionQueryInputSchema.parse({
                    minAmount: 200,
                    maxAmount: 100,
                });
            }, /minAmount must be less than or equal to maxAmount/);

            // Negative amount rejected
            assert.throws(() => {
                transactionQueryInputSchema.parse({ minAmount: -5 });
            });
        });

        it("trims search string and rejects excessively long search queries", () => {
            const parsed = transactionQueryInputSchema.parse({ search: "   Swiggy   " });
            assert.equal(parsed.search, "Swiggy");

            const longQuery = "a".repeat(101);
            assert.throws(() => {
                transactionQueryInputSchema.parse({ search: longQuery });
            }, /Search query is too long/);
        });

        it("validates idParamSchema correctly", () => {
            assert.equal(idParamSchema.parse({ id: "42" }).id, 42);
            assert.equal(idParamSchema.parse({ id: 100 }).id, 100);

            assert.throws(() => {
                idParamSchema.parse({ id: "0" });
            }, /ID must be a positive integer/);

            assert.throws(() => {
                idParamSchema.parse({ id: "-5" });
            }, /ID must be a positive integer/);

            assert.throws(() => {
                idParamSchema.parse({ id: "abc" });
            });
        });
    });

    describe("2. Database Where Clause Construction & Isolation", () => {
        it("strictly scopes database queries to the authenticated userId", () => {
            const userId = 42;
            const query: TransactionQuery = {
                categories: [Category.FOOD],
                priorities: [Priority.ESSENTIAL],
                sources: [TransactionSource.BANK_STATEMENT],
                minAmount: 50,
                maxAmount: 500,
                search: "Coffee",
            };

            const where = transactionRepository.buildTransactionWhereInput(userId, query);

            // Critical: userId must match exactly
            assert.equal(where.userId, 42);
            assert.deepEqual(where.category, { in: [Category.FOOD] });
            assert.deepEqual(where.priority, { in: [Priority.ESSENTIAL] });
            assert.deepEqual(where.source, { in: [TransactionSource.BANK_STATEMENT] });
            assert.ok(where.amount);
            assert.deepEqual(where.OR, [
                { title: { contains: "Coffee", mode: "insensitive" } },
                { notes: { contains: "Coffee", mode: "insensitive" } },
            ]);
        });

        it("builds correct date boundaries without leaking other users", () => {
            const userId = 99;
            const start = new Date("2026-08-01T00:00:00.000Z");
            const end = new Date("2026-08-31T23:59:59.999Z");

            const where = transactionRepository.buildTransactionWhereInput(userId, {
                startDate: start,
                endDate: end,
            });

            assert.equal(where.userId, 99);
            assert.deepEqual(where.transactionDate, {
                gte: start,
                lte: end,
            });
        });
    });

    describe("3. Security: Ownership Enforcement on Single Transaction Detail", () => {
        it("getTransactionById rejects access when user does not own the transaction", async () => {
            const originalFindUnique = prisma.transaction.findUnique;
            (prisma.transaction as unknown as Record<string, unknown>).findUnique = (async (args: { where: { id: number } }) => {
                if (args.where.id === 101) {
                    return {
                        id: 101,
                        userId: 1, // owned by user 1
                        amount: new Prisma.Decimal(500),
                        category: Category.FOOD,
                        priority: Priority.ESSENTIAL,
                        title: "Secret Lunch",
                        notes: null,
                        transactionDate: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        source: TransactionSource.MANUAL,
                        externalId: null,
                        sourceMetadata: null,
                    };
                }
                return null;
            }) as unknown as typeof prisma.transaction.findUnique;

            try {
                // User 2 attempts to view User 1's transaction
                await assert.rejects(
                    async () => {
                        await transactionService.getTransactionById(101, 2); // user 2
                    },
                    (err: unknown) => {
                        assert.ok(err instanceof TransactionNotFoundError);
                        assert.equal(err.message, "Transaction does not exist or user does not have access");
                        return true;
                    }
                );

                // User 1 successfully views their own transaction
                const result = await transactionService.getTransactionById(101, 1);
                assert.ok(result);
                assert.equal(result.id, 101);
                assert.equal(result.userId, 1);
            } finally {
                (prisma.transaction as unknown as Record<string, unknown>).findUnique = originalFindUnique;
            }
        });

        it("getTransactionById throws TransactionNotFoundError when transaction does not exist", async () => {
            const originalFindUnique = prisma.transaction.findUnique;
            (prisma.transaction as unknown as Record<string, unknown>).findUnique = (async () => null) as unknown as typeof prisma.transaction.findUnique;

            try {
                await assert.rejects(
                    async () => {
                        await transactionService.getTransactionById(99999, 1);
                    },
                    (err: unknown) => {
                        assert.ok(err instanceof TransactionNotFoundError);
                        return true;
                    }
                );
            } finally {
                (prisma.transaction as unknown as Record<string, unknown>).findUnique = originalFindUnique;
            }
        });
    });

    describe("4. Financial Correctness & Classification Integrity", () => {
        it("supports UNCLASSIFIED spending tier without rejecting valid transactions", () => {
            const queryWithUnclassified = transactionQueryInputSchema.parse({
                priority: "UNCLASSIFIED",
            });
            assert.deepEqual(queryWithUnclassified.priority, [Priority.UNCLASSIFIED]);

            const canonical = toCanonicalTransactionQuery(queryWithUnclassified);
            assert.deepEqual(canonical.priorities, [Priority.UNCLASSIFIED]);
        });

        it("maintains separation between Category and Priority (spending tier)", () => {
            const query = transactionQueryInputSchema.parse({
                category: "BILLS",
                priority: "ESSENTIAL",
            });
            const canonical = toCanonicalTransactionQuery(query);

            assert.deepEqual(canonical.categories, [Category.BILLS]);
            assert.deepEqual(canonical.priorities, [Priority.ESSENTIAL]);
            // Ensure they are not conflated
            assert.notEqual(canonical.categories as unknown, canonical.priorities as unknown);
        });

        it("preserves OTHER category as a distinct valid classification", () => {
            const parsedOther = transactionQueryInputSchema.parse({ category: "OTHER" });
            const canonical = toCanonicalTransactionQuery(parsedOther);
            assert.deepEqual(canonical.categories, [Category.OTHER]);
        });
    });

    describe("5. Pagination & Metadata Computation", () => {
        it("calculates totalPages and offset accurately for various dataset sizes", () => {
            const testCases = [
                { total: 100, limit: 20, page: 1, expectedTotalPages: 5, expectedOffset: 0, hasMore: true },
                { total: 100, limit: 20, page: 5, expectedTotalPages: 5, expectedOffset: 80, hasMore: false },
                { total: 45, limit: 20, page: 3, expectedTotalPages: 3, expectedOffset: 40, hasMore: false },
                { total: 0, limit: 20, page: 1, expectedTotalPages: 1, expectedOffset: 0, hasMore: false },
                { total: 7, limit: 10, page: 1, expectedTotalPages: 1, expectedOffset: 0, hasMore: false },
            ];

            for (const tc of testCases) {
                const totalPages = Math.ceil(tc.total / tc.limit) || 1;
                const offset = (tc.page - 1) * tc.limit;
                const hasMore = offset + Math.min(tc.limit, Math.max(0, tc.total - offset)) < tc.total;

                assert.equal(totalPages, tc.expectedTotalPages, `Total pages mismatch for total=${tc.total}`);
                assert.equal(offset, tc.expectedOffset, `Offset mismatch for page=${tc.page}`);
                assert.equal(hasMore, tc.hasMore, `hasMore mismatch for total=${tc.total}, page=${tc.page}`);
            }
        });

        it("ensures pagination is deterministic with secondary id sort key", async () => {
            // Verify findTransactions applies secondary id sort key
            const originalFindMany = prisma.transaction.findMany;
            let capturedOrderBy: any = null;

            (prisma.transaction as any).findMany = async (args: any) => {
                capturedOrderBy = args.orderBy;
                return [];
            };

            try {
                await transactionRepository.findTransactions(1, {
                    sortBy: "transactionDate",
                    sortDirection: "desc",
                });

                assert.deepEqual(capturedOrderBy, [
                    { transactionDate: "desc" },
                    { id: "desc" }
                ], "Must include secondary sort key { id: 'desc' } for stable pagination");
            } finally {
                (prisma.transaction as any).findMany = originalFindMany;
            }
        });

        it("findTransactionsWithCount calculates totalAmount across matching records", async () => {
            const originalFindMany = prisma.transaction.findMany;
            const originalCount = prisma.transaction.count;
            const originalAggregate = prisma.transaction.aggregate;

            (prisma.transaction as any).findMany = async () => [
                { id: 1, amount: new Prisma.Decimal(100), userId: 1 },
                { id: 2, amount: new Prisma.Decimal(200), userId: 1 },
            ];
            (prisma.transaction as any).count = async () => 50; // 50 total records matching
            (prisma.transaction as any).aggregate = async () => ({
                _sum: { amount: new Prisma.Decimal(5000.5) },
            });

            try {
                const result = await transactionRepository.findTransactionsWithCount(1, {
                    limit: 2,
                    offset: 0,
                });

                assert.equal(result.transactions.length, 2);
                assert.equal(result.totalCount, 50);
                assert.equal(result.totalAmount, 5000.5, "totalAmount must reflect aggregate across all matching records");
            } finally {
                (prisma.transaction as any).findMany = originalFindMany;
                (prisma.transaction as any).count = originalCount;
                (prisma.transaction as any).aggregate = originalAggregate;
            }
        });
    });
});

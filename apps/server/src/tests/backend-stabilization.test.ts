import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "../generated/prisma/client";
import { Category, Priority, BudgetPeriod, TransactionSource } from "../generated/prisma/enums";
import prisma from "../lib/prisma";

// Schemas
import {
    createTransactionSchema,
    updateTransactionSchema,
    idParamSchema,
    toCanonicalTransactionQuery,
    transactionQueryInputSchema
} from "../schemas/transaction.schema";
import {
    createBudgetSchema,
    updateBudgetSchema,
    idParamSchema as budgetIdParamSchema
} from "../schemas/budget.schema";

// Services & Utils
import * as transactionService from "../services/transaction.service";
import * as budgetService from "../services/budget.service";
import * as userService from "../services/user.service";
import * as analyticsService from "../services/analytics.services";
import { calculateEndDate, hasBudgetOverlap } from "../utils/budget.utils";

// Errors
import {
    TransactionNotFoundError,
    BudgetNotFoundError,
    BudgetLockedError,
    ForbiddenError,
    AppError
} from "../error/AppError";

describe("Phase 1: Backend Stabilization & Integrity Suite", () => {

    describe("1. Transaction Management & Validation", () => {
        it("accepts valid transaction creation payload", () => {
            const valid = createTransactionSchema.parse({
                amount: 450.50,
                category: Category.FOOD,
                priority: Priority.ESSENTIAL,
                title: "Groceries",
                notes: "Weekly fruits and veggies",
                transactionDate: "2026-08-15T10:30:00.000Z"
            });
            assert.equal(valid.amount, 450.50);
            assert.equal(valid.category, Category.FOOD);
            assert.equal(valid.priority, Priority.ESSENTIAL);
            assert.equal(valid.title, "Groceries");
        });

        it("rejects zero transaction amount", () => {
            assert.throws(() => {
                createTransactionSchema.parse({
                    amount: 0,
                    category: Category.FOOD,
                    priority: Priority.ESSENTIAL
                });
            }, /amount must be a positive number/);
        });

        it("rejects negative transaction amount", () => {
            assert.throws(() => {
                createTransactionSchema.parse({
                    amount: -150,
                    category: Category.FUEL,
                    priority: Priority.GOOD_TO_HAVE
                });
            }, /amount must be a positive number/);
        });

        it("rejects invalid transaction category", () => {
            assert.throws(() => {
                createTransactionSchema.parse({
                    amount: 200,
                    category: "NON_EXISTENT_CATEGORY" as any,
                    priority: Priority.ESSENTIAL
                });
            });
        });

        it("rejects invalid transaction priority", () => {
            assert.throws(() => {
                createTransactionSchema.parse({
                    amount: 200,
                    category: Category.FOOD,
                    priority: "SUPER_LUXURY" as any
                });
            });
        });

        it("rejects empty update transaction payload", () => {
            assert.throws(() => {
                updateTransactionSchema.parse({});
            }, /At least one field is required for an update/);
        });

        it("rejects negative amount in update transaction payload", () => {
            assert.throws(() => {
                updateTransactionSchema.parse({ amount: -50 });
            }, /amount must be a positive number/);
        });

        it("validates transaction ID parameters strictly (rejects NaN, zero, negatives)", () => {
            assert.equal(idParamSchema.parse({ id: "123" }).id, 123);
            assert.equal(idParamSchema.parse({ id: 45 }).id, 45);

            assert.throws(() => idParamSchema.parse({ id: "abc" }));
            assert.throws(() => idParamSchema.parse({ id: 0 }));
            assert.throws(() => idParamSchema.parse({ id: -10 }));
        });

        it("enforces cross-user isolation on transaction updates", async () => {
            const originalFind = prisma.transaction.findUnique;
            (prisma.transaction as any).findUnique = async ({ where }: any) => {
                if (where.id === 101) {
                    return {
                        id: 101,
                        amount: new Prisma.Decimal(100),
                        category: Category.FOOD,
                        priority: Priority.ESSENTIAL,
                        userId: 1, // owned by User 1
                    };
                }
                return null;
            };

            try {
                // User 2 attempts to update User 1's transaction
                await assert.rejects(
                    async () => {
                        await transactionService.updateTransaction(101, 2, { title: "Hacked Title" });
                    },
                    (err: any) => {
                        assert.ok(err instanceof TransactionNotFoundError);
                        return true;
                    }
                );
            } finally {
                prisma.transaction.findUnique = originalFind;
            }
        });

        it("enforces cross-user isolation on transaction deletion", async () => {
            const originalFind = prisma.transaction.findUnique;
            (prisma.transaction as any).findUnique = async ({ where }: any) => {
                if (where.id === 101) {
                    return {
                        id: 101,
                        amount: new Prisma.Decimal(100),
                        category: Category.FOOD,
                        priority: Priority.ESSENTIAL,
                        userId: 1, // owned by User 1
                    };
                }
                return null;
            };

            try {
                // User 2 attempts to delete User 1's transaction
                await assert.rejects(
                    async () => {
                        await transactionService.deleteTransaction(101, 2);
                    },
                    (err: any) => {
                        assert.ok(err instanceof TransactionNotFoundError);
                        return true;
                    }
                );
            } finally {
                prisma.transaction.findUnique = originalFind;
            }
        });
    });

    describe("2. Budget Domain & Calculation Rules", () => {
        it("validates valid budget creation payload", () => {
            const parsed = createBudgetSchema.parse({
                amount: 30000,
                periodType: BudgetPeriod.MONTHLY,
                startDate: "2026-09-01T00:00:00.000Z",
                isLocked: false
            });
            assert.equal(parsed.amount, 30000);
            assert.equal(parsed.periodType, BudgetPeriod.MONTHLY);
            assert.ok(parsed.startDate instanceof Date);
        });

        it("rejects zero or negative budget amounts", () => {
            assert.throws(() => {
                createBudgetSchema.parse({
                    amount: 0,
                    periodType: BudgetPeriod.MONTHLY,
                    startDate: "2026-09-01"
                });
            }, /Budget amount must be greater than 0/);

            assert.throws(() => {
                createBudgetSchema.parse({
                    amount: -5000,
                    periodType: BudgetPeriod.MONTHLY,
                    startDate: "2026-09-01"
                });
            }, /Budget amount must be greater than 0/);
        });

        it("permits consecutive adjacent budget periods without false overlap errors", () => {
            // August budget: Aug 1 to Sep 1
            const augustBudget = {
                id: 1,
                amount: new Prisma.Decimal(25000),
                periodType: BudgetPeriod.MONTHLY,
                startDate: new Date("2026-08-01T00:00:00.000Z"),
                isLocked: false,
                userId: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Attempt to add September budget: Sep 1 to Oct 1
            const overlap = hasBudgetOverlap(
                [augustBudget],
                new Date("2026-09-01T00:00:00.000Z"),
                BudgetPeriod.MONTHLY
            );
            assert.equal(overlap, false, "Adjacent monthly periods must NOT report an overlap");
        });

        it("detects genuine budget period overlaps correctly", () => {
            const augustBudget = {
                id: 1,
                amount: new Prisma.Decimal(25000),
                periodType: BudgetPeriod.MONTHLY,
                startDate: new Date("2026-08-01T00:00:00.000Z"),
                isLocked: false,
                userId: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Mid-August start date overlaps with August budget
            const overlap = hasBudgetOverlap(
                [augustBudget],
                new Date("2026-08-15T00:00:00.000Z"),
                BudgetPeriod.MONTHLY
            );
            assert.equal(overlap, true, "Partially overlapping budget must report an overlap");
        });

        it("excludes the current budget ID during update overlap check", () => {
            const currentBudget = {
                id: 5,
                amount: new Prisma.Decimal(20000),
                periodType: BudgetPeriod.MONTHLY,
                startDate: new Date("2026-08-01T00:00:00.000Z"),
                isLocked: false,
                userId: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Updating budget #5 with same dates should not report self-overlap
            const overlap = hasBudgetOverlap(
                [currentBudget],
                new Date("2026-08-01T00:00:00.000Z"),
                BudgetPeriod.MONTHLY,
                5 // exclude current budget ID
            );
            assert.equal(overlap, false, "Self-overlap during update must be excluded");
        });

        it("enforces that locked budgets cannot be updated or deleted", async () => {
            const originalFind = prisma.budget.findUnique;
            (prisma.budget as any).findUnique = async ({ where }: any) => {
                if (where.id === 50) {
                    return {
                        id: 50,
                        amount: new Prisma.Decimal(20000),
                        periodType: BudgetPeriod.MONTHLY,
                        startDate: new Date("2026-08-01T00:00:00.000Z"),
                        isLocked: true, // LOCKED
                        userId: 1,
                    };
                }
                return null;
            };

            try {
                // Attempt to update locked budget
                await assert.rejects(
                    async () => {
                        await budgetService.updateBudget(50, 1, { amount: 30000 });
                    },
                    (err: any) => {
                        assert.ok(err instanceof BudgetLockedError);
                        assert.equal(err.statusCode, 400);
                        return true;
                    }
                );

                // Attempt to delete locked budget
                await assert.rejects(
                    async () => {
                        await budgetService.deleteBudget(50, 1);
                    },
                    (err: any) => {
                        assert.ok(err instanceof BudgetLockedError);
                        assert.equal(err.statusCode, 400);
                        return true;
                    }
                );
            } finally {
                prisma.budget.findUnique = originalFind;
            }
        });

        it("enforces cross-user isolation on budget update, delete, and lock", async () => {
            const originalFind = prisma.budget.findUnique;
            (prisma.budget as any).findUnique = async ({ where }: any) => {
                if (where.id === 50) {
                    return {
                        id: 50,
                        amount: new Prisma.Decimal(20000),
                        periodType: BudgetPeriod.MONTHLY,
                        startDate: new Date("2026-08-01T00:00:00.000Z"),
                        isLocked: false,
                        userId: 1, // User 1 owns this
                    };
                }
                return null;
            };

            try {
                // User 2 attempts to update User 1's budget
                await assert.rejects(
                    async () => {
                        await budgetService.updateBudget(50, 2, { amount: 35000 });
                    },
                    (err: any) => {
                        assert.ok(err instanceof BudgetNotFoundError);
                        return true;
                    }
                );

                // User 2 attempts to delete User 1's budget
                await assert.rejects(
                    async () => {
                        await budgetService.deleteBudget(50, 2);
                    },
                    (err: any) => {
                        assert.ok(err instanceof BudgetNotFoundError);
                        return true;
                    }
                );

                // User 2 attempts to lock User 1's budget
                await assert.rejects(
                    async () => {
                        await budgetService.lockBudget(50, 2);
                    },
                    (err: any) => {
                        assert.ok(err instanceof BudgetNotFoundError);
                        return true;
                    }
                );
            } finally {
                prisma.budget.findUnique = originalFind;
            }
        });
    });

    describe("3. Financial Calculations & Decimal Precision", () => {
        it("calculates remaining budget preserving Decimal precision", () => {
            const budgetAmount = new Prisma.Decimal("10000.50");
            const totalSpent = new Prisma.Decimal("3450.25");

            const remaining = analyticsService.calculateRemainingBudget(budgetAmount, totalSpent);
            assert.equal(remaining.toString(), "6550.25");
            assert.ok(remaining instanceof Prisma.Decimal);
        });

        it("calculates negative remaining budget when budget is exceeded", () => {
            const budgetAmount = new Prisma.Decimal("5000.00");
            const totalSpent = new Prisma.Decimal("5250.75");

            const remaining = analyticsService.calculateRemainingBudget(budgetAmount, totalSpent);
            assert.equal(remaining.toString(), "-250.75");
        });

        it("calculates budget usage percentage accurately and handles zero budget", () => {
            const budgetAmount = new Prisma.Decimal("10000");
            const totalSpent = new Prisma.Decimal("5000");
            assert.equal(analyticsService.calculateBudgetUsage(budgetAmount, totalSpent), 50);

            // Zero budget edge case
            const zeroBudget = new Prisma.Decimal("0");
            assert.equal(analyticsService.calculateBudgetUsage(zeroBudget, totalSpent), 0);
        });

        it("calculates total spent across transactions with exact Decimal accumulation (no float drift)", () => {
            // In JavaScript floating point: 0.1 + 0.2 = 0.30000000000000004
            const mockTransactions = [
                { id: 1, amount: new Prisma.Decimal("0.10"), category: Category.FOOD, priority: Priority.ESSENTIAL, transactionDate: new Date(), createdAt: new Date(), updatedAt: new Date(), userId: 1, title: null, notes: null, source: TransactionSource.MANUAL, externalId: null, sourceMetadata: null },
                { id: 2, amount: new Prisma.Decimal("0.20"), category: Category.FOOD, priority: Priority.ESSENTIAL, transactionDate: new Date(), createdAt: new Date(), updatedAt: new Date(), userId: 1, title: null, notes: null, source: TransactionSource.MANUAL, externalId: null, sourceMetadata: null },
                { id: 3, amount: new Prisma.Decimal("100.33"), category: Category.SHOPPING, priority: Priority.LUXURY, transactionDate: new Date(), createdAt: new Date(), updatedAt: new Date(), userId: 1, title: null, notes: null, source: TransactionSource.MANUAL, externalId: null, sourceMetadata: null },
            ];

            const total = analyticsService.calculateTotalSpent(mockTransactions);
            assert.equal(total.toString(), "100.63", "Decimal arithmetic must avoid floating-point inaccuracies");
        });

        it("calculates category totals accurately across distinct categories", () => {
            const mockTransactions = [
                { id: 1, amount: new Prisma.Decimal("250.00"), category: Category.FOOD, priority: Priority.ESSENTIAL, transactionDate: new Date(), createdAt: new Date(), updatedAt: new Date(), userId: 1, title: null, notes: null, source: TransactionSource.MANUAL, externalId: null, sourceMetadata: null },
                { id: 2, amount: new Prisma.Decimal("150.50"), category: Category.FOOD, priority: Priority.GOOD_TO_HAVE, transactionDate: new Date(), createdAt: new Date(), updatedAt: new Date(), userId: 1, title: null, notes: null, source: TransactionSource.MANUAL, externalId: null, sourceMetadata: null },
                { id: 3, amount: new Prisma.Decimal("500.00"), category: Category.FUEL, priority: Priority.ESSENTIAL, transactionDate: new Date(), createdAt: new Date(), updatedAt: new Date(), userId: 1, title: null, notes: null, source: TransactionSource.MANUAL, externalId: null, sourceMetadata: null },
            ];

            const catTotals = analyticsService.calculateCategoryTotals(mockTransactions);
            assert.equal(catTotals[Category.FOOD]?.toString(), "400.5");
            assert.equal(catTotals[Category.FUEL]?.toString(), "500");
            assert.equal(catTotals[Category.SHOPPING], undefined);
        });

        it("calculates average transaction and average daily spend cleanly", () => {
            const d1 = new Date("2026-08-01T10:00:00.000Z");
            const d2 = new Date("2026-08-03T18:00:00.000Z");

            const mockTransactions = [
                { id: 1, amount: new Prisma.Decimal("300.00"), category: Category.FOOD, priority: Priority.ESSENTIAL, transactionDate: d1, createdAt: new Date(), updatedAt: new Date(), userId: 1, title: null, notes: null, source: TransactionSource.MANUAL, externalId: null, sourceMetadata: null },
                { id: 2, amount: new Prisma.Decimal("600.00"), category: Category.BILLS, priority: Priority.ESSENTIAL, transactionDate: d2, createdAt: new Date(), updatedAt: new Date(), userId: 1, title: null, notes: null, source: TransactionSource.MANUAL, externalId: null, sourceMetadata: null },
            ];

            const avgTx = analyticsService.calculateAverageTransaction(mockTransactions);
            assert.equal(avgTx.toString(), "450"); // 900 / 2

            // Total spent = 900 across 3 days (Aug 1, 2, 3) = 300 / day
            const dailySpend = analyticsService.calculateAverageDailySpend(mockTransactions);
            assert.equal(dailySpend.toString(), "300");

            // Empty transaction set handling
            assert.equal(analyticsService.calculateAverageTransaction([]).toString(), "0");
            assert.equal(analyticsService.calculateAverageDailySpend([]).toString(), "0");
        });
    });

    describe("4. Date Boundary Normalization & Query Precision", () => {
        it("normalizes YYYY-MM-DD end date to 23:59:59.999Z for comprehensive single-day queries", () => {
            const parsed = transactionQueryInputSchema.parse({
                startDate: "2026-08-15",
                endDate: "2026-08-15"
            });
            const canonical = toCanonicalTransactionQuery(parsed);

            assert.equal(canonical.startDate?.toISOString(), "2026-08-15T00:00:00.000Z");
            assert.equal(canonical.endDate?.toISOString(), "2026-08-15T23:59:59.999Z");
        });

        it("preserves explicit ISO timestamps with millisecond precision", () => {
            const parsed = transactionQueryInputSchema.parse({
                startDate: "2026-08-01T08:30:00.000Z",
                endDate: "2026-08-31T18:45:30.500Z"
            });
            const canonical = toCanonicalTransactionQuery(parsed);

            assert.equal(canonical.startDate?.toISOString(), "2026-08-01T08:30:00.000Z");
            assert.equal(canonical.endDate?.toISOString(), "2026-08-31T18:45:30.500Z");
        });
    });

    describe("5. User Privacy & Credential Leak Prevention", () => {
        it("never leaks passwordHash when fetching user by ID via service", async () => {
            const originalFind = prisma.user.findUnique;
            (prisma.user as any).findUnique = async ({ where }: any) => {
                if (where.id === 42) {
                    return {
                        id: 42,
                        name: "Secure User",
                        email: "user42@example.com",
                        passwordHash: "$2b$10$supersecretmockhashthatshouldneverleak",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                }
                return null;
            };

            try {
                const user = await userService.findUserbyId(42);
                assert.equal(user.id, 42);
                assert.equal(user.name, "Secure User");
                assert.equal(user.email, "user42@example.com");
                assert.equal((user as any).passwordHash, undefined, "passwordHash MUST NEVER be returned by findUserbyId");
            } finally {
                prisma.user.findUnique = originalFind;
            }
        });

        it("never leaks passwordHash when updating user via service", async () => {
            const originalFind = prisma.user.findUnique;
            const originalUpdate = prisma.user.update;

            (prisma.user as any).findUnique = async () => ({
                id: 42,
                name: "Old Name",
                email: "user42@example.com",
                passwordHash: "secret_hash"
            });
            (prisma.user as any).update = async ({ data }: any) => ({
                id: 42,
                name: data.name ?? "Old Name",
                email: data.email ?? "user42@example.com",
                passwordHash: "secret_hash",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            try {
                const updated = await userService.updateUser(42, { name: "Updated Name" });
                assert.equal(updated.name, "Updated Name");
                assert.equal((updated as any).passwordHash, undefined, "passwordHash MUST NEVER be returned by updateUser");
            } finally {
                prisma.user.findUnique = originalFind;
                prisma.user.update = originalUpdate;
            }
        });
    });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "../generated/prisma/client";
import { Category, Priority, TransactionSource } from "../generated/prisma/enums";
import prisma from "../lib/prisma";

// Ingestion Foundation Modules
import {
    normalizeAmount,
    normalizeTitle,
    normalizeNotes,
    normalizeTransactionDate,
    normalizeCategory,
    normalizePriority,
    computeTransactionFingerprint,
    normalizeTransactionInput,
} from "../ingestion/normalizers/transaction.normalizer";
import { validateTransactionCandidate } from "../ingestion/validators/transaction.validator";
import { detectDuplicate } from "../ingestion/duplicates/duplicate-detector";
import {
    ingestTransaction,
    ingestTransactionBatch,
} from "../ingestion/services/ingestion.service";
import * as transactionService from "../services/transaction.service";
import * as dashboardService from "../services/dashboard.service";
import { BadRequestError, ConflictError } from "../error/AppError";

describe("Phase 2: Canonical Ingestion Foundation Test Suite", () => {

    describe("1. Normalization & Sign Conventions", () => {
        it("normalizes description/title by collapsing redundant spaces and trimming", () => {
            assert.equal(normalizeTitle("   Starbucks   Coffee   "), "Starbucks Coffee");
            assert.equal(normalizeTitle("Swiggy\tOrder   "), "Swiggy Order");
            assert.equal(normalizeTitle(""), null);
            assert.equal(normalizeTitle(null), null);
            assert.equal(normalizeTitle(undefined), null);
        });

        it("normalizes notes cleanly", () => {
            assert.equal(normalizeNotes("  Expense for project lunch  "), "Expense for project lunch");
            assert.equal(normalizeNotes(""), null);
            assert.equal(normalizeNotes(null), null);
        });

        it("normalizes numeric and string amounts into positive Decimals", () => {
            const dec1 = normalizeAmount(450.5);
            assert.equal(dec1.toString(), "450.5");
            assert.ok(dec1 instanceof Prisma.Decimal);

            // Converts negative bank debits to positive expense amounts
            const decNegative = normalizeAmount(-250.75);
            assert.equal(decNegative.toString(), "250.75");

            // Strips currency symbols (₹, $, €, £) and formatting commas
            const decFormatted = normalizeAmount("₹ 1,500.50");
            assert.equal(decFormatted.toString(), "1500.5");

            const decDollar = normalizeAmount(" $ 99.99 ");
            assert.equal(decDollar.toString(), "99.99");
        });

        it("rejects non-numeric, infinite, or corrupted amount representations", () => {
            assert.throws(() => normalizeAmount("invalid-amount"), /Invalid monetary amount format/);
            assert.throws(() => normalizeAmount(Infinity), /Amount must be a finite number/);
            assert.throws(() => normalizeAmount(NaN), /Amount must be a finite number/);
            assert.throws(() => normalizeAmount({} as any), /Unsupported amount type/);
        });

        it("normalizes transaction dates across ISO strings, YYYY-MM-DD, and Date objects", () => {
            const dateObj = new Date("2026-08-15T10:00:00.000Z");
            assert.equal(normalizeTransactionDate(dateObj).toISOString(), "2026-08-15T10:00:00.000Z");

            const isoDate = normalizeTransactionDate("2026-08-15T10:00:00.000Z");
            assert.equal(isoDate.toISOString(), "2026-08-15T10:00:00.000Z");

            const ymdDate = normalizeTransactionDate("2026-08-15");
            assert.equal(ymdDate.toISOString(), "2026-08-15T00:00:00.000Z");

            assert.throws(() => normalizeTransactionDate("invalid-date-string"), /Invalid transaction date string/);
        });

        it("normalizes categories and priorities, falling back gracefully to sensible defaults", () => {
            assert.equal(normalizeCategory("food"), Category.FOOD);
            assert.equal(normalizeCategory("SHOPPING"), Category.SHOPPING);
            assert.equal(normalizeCategory("UNRECOGNIZED_CAT"), Category.OTHER);
            assert.equal(normalizeCategory(null), Category.OTHER);

            assert.equal(normalizePriority("essential"), Priority.ESSENTIAL);
            assert.equal(normalizePriority("LUXURY"), Priority.LUXURY);
            assert.equal(normalizePriority("UNRECOGNIZED_PRIO"), Priority.GOOD_TO_HAVE);
            assert.equal(normalizePriority(null), Priority.GOOD_TO_HAVE);
        });

        it("computes deterministic SHA-256 fingerprints across identical normalized fields", () => {
            const fp1 = computeTransactionFingerprint(
                new Prisma.Decimal("150.00"),
                new Date("2026-08-15T12:00:00.000Z"),
                "Uber Ride",
                TransactionSource.MANUAL
            );
            const fp2 = computeTransactionFingerprint(
                new Prisma.Decimal("150.00"),
                new Date("2026-08-15T12:00:00.000Z"),
                "Uber Ride",
                TransactionSource.MANUAL
            );
            const fpDifferentAmount = computeTransactionFingerprint(
                new Prisma.Decimal("150.01"),
                new Date("2026-08-15T12:00:00.000Z"),
                "Uber Ride",
                TransactionSource.MANUAL
            );

            assert.equal(fp1, fp2);
            assert.notEqual(fp1, fpDifferentAmount);
            assert.equal(fp1.length, 64, "SHA-256 fingerprint should be 64 hex characters");
        });
    });

    describe("2. Domain Validation & Invariant Enforcement", () => {
        it("accepts valid normalized candidate with authenticated user context", () => {
            const candidate = normalizeTransactionInput({
                amount: "500.00",
                category: Category.FOOD,
                priority: Priority.ESSENTIAL,
                title: "Grocery Shopping",
                notes: "Supermarket visit",
                transactionDate: "2026-08-15",
                source: TransactionSource.MANUAL,
            });

            const result = validateTransactionCandidate(candidate, 1);
            assert.equal(result.isValid, true);
            assert.equal(result.errors.length, 0);
            assert.ok(result.validated);
            assert.equal(result.validated.userId, 1);
        });

        it("rejects zero and negative amounts", () => {
            const candidateZero = normalizeTransactionInput({
                amount: 0,
                category: Category.FOOD,
                priority: Priority.ESSENTIAL,
            });
            const resultZero = validateTransactionCandidate(candidateZero, 1);
            assert.equal(resultZero.isValid, false);
            assert.ok(resultZero.errors.some((e) => e.code === "NON_POSITIVE_AMOUNT"));
        });

        it("rejects excessive decimal precision beyond 2 decimal places", () => {
            const candidate = normalizeTransactionInput({
                amount: "125.456",
                category: Category.FOOD,
                priority: Priority.ESSENTIAL,
            });
            const result = validateTransactionCandidate(candidate, 1);
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some((e) => e.code === "EXCESSIVE_DECIMAL_PRECISION"));
        });

        it("rejects dates outside supported historical (< 2000) or future (> 1 year) ranges", () => {
            const candidateOld = normalizeTransactionInput({
                amount: 100,
                transactionDate: "1995-05-10",
            });
            const resultOld = validateTransactionCandidate(candidateOld, 1);
            assert.equal(resultOld.isValid, false);
            assert.ok(resultOld.errors.some((e) => e.code === "DATE_TOO_EARLY"));

            const farFutureDate = new Date();
            farFutureDate.setFullYear(farFutureDate.getFullYear() + 3);
            const candidateFuture = normalizeTransactionInput({
                amount: 100,
                transactionDate: farFutureDate,
            });
            const resultFuture = validateTransactionCandidate(candidateFuture, 1);
            assert.equal(resultFuture.isValid, false);
            assert.ok(resultFuture.errors.some((e) => e.code === "DATE_TOO_FAR_FUTURE"));
        });

        it("enforces valid authenticated user ID", () => {
            const candidate = normalizeTransactionInput({
                amount: 100,
                category: Category.FOOD,
                priority: Priority.ESSENTIAL,
            });

            assert.equal(validateTransactionCandidate(candidate, 0).isValid, false);
            assert.equal(validateTransactionCandidate(candidate, -5).isValid, false);
            assert.equal(validateTransactionCandidate(candidate, NaN).isValid, false);
        });

        it("enforces string length constraints for title and notes", () => {
            const candidateLongTitle = normalizeTransactionInput({
                amount: 100,
                title: "A".repeat(101),
            });
            assert.equal(validateTransactionCandidate(candidateLongTitle, 1).isValid, false);

            const candidateLongNotes = normalizeTransactionInput({
                amount: 100,
                notes: "N".repeat(501),
            });
            assert.equal(validateTransactionCandidate(candidateLongNotes, 1).isValid, false);
        });
    });

    describe("3. Duplicate Detection & Idempotency", () => {
        it("confirms exact duplicates when matching stable externalId", async () => {
            const originalFindFirst = prisma.transaction.findFirst;

            // Mock existing transaction with externalId
            (prisma.transaction as any).findFirst = async ({ where }: any) => {
                if (where.userId === 1 && where.externalId === "TXN-BANK-9999") {
                    return {
                        id: 555,
                        amount: new Prisma.Decimal("1200.00"),
                        category: Category.BILLS,
                        priority: Priority.ESSENTIAL,
                        title: "Electricity Bill",
                        notes: null,
                        transactionDate: new Date("2026-08-10"),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        userId: 1,
                        source: TransactionSource.BANK_STATEMENT,
                        externalId: "TXN-BANK-9999",
                        sourceMetadata: null,
                    };
                }
                return null;
            };

            try {
                const candidate = normalizeTransactionInput({
                    amount: 1200,
                    category: Category.BILLS,
                    priority: Priority.ESSENTIAL,
                    title: "Electricity Bill",
                    transactionDate: "2026-08-10",
                    source: TransactionSource.BANK_STATEMENT,
                    externalId: "TXN-BANK-9999",
                });
                const validation = validateTransactionCandidate(candidate, 1);
                assert.ok(validation.validated);

                const check = await detectDuplicate(validation.validated);
                assert.equal(check.status, "CONFIRMED_DUPLICATE");
                assert.equal(check.matchedTransactionId, 555);
                assert.equal(check.confidence, 1.0);
            } finally {
                prisma.transaction.findFirst = originalFindFirst;
            }
        });

        it("flags potential duplicates when same amount, date, and title appear in statement imports", async () => {
            const originalFindMany = prisma.transaction.findMany;

            (prisma.transaction as any).findMany = async ({ where }: any) => {
                if (where.userId === 1 && where.amount.toString() === "450") {
                    return [
                        {
                            id: 888,
                            amount: new Prisma.Decimal("450.00"),
                            category: Category.FOOD,
                            priority: Priority.ESSENTIAL,
                            title: "Lunch Cafe",
                            notes: null,
                            transactionDate: new Date("2026-08-12T13:00:00.000Z"),
                            createdAt: new Date("2026-08-12T13:00:00.000Z"),
                            updatedAt: new Date(),
                            userId: 1,
                            source: TransactionSource.CSV_IMPORT,
                            externalId: null,
                            sourceMetadata: null,
                        },
                    ];
                }
                return [];
            };

            try {
                const candidate = normalizeTransactionInput({
                    amount: 450,
                    category: Category.FOOD,
                    priority: Priority.ESSENTIAL,
                    title: "Lunch Cafe",
                    transactionDate: "2026-08-12T14:30:00.000Z",
                    source: TransactionSource.CSV_IMPORT,
                });
                const validation = validateTransactionCandidate(candidate, 1);
                assert.ok(validation.validated);

                const check = await detectDuplicate(validation.validated);
                assert.equal(check.status, "POTENTIAL_DUPLICATE");
                assert.equal(check.matchedTransactionId, 888);
                assert.equal(check.confidence, 0.85);
            } finally {
                prisma.transaction.findMany = originalFindMany;
            }
        });

        it("detects rapid manual double-submission within 60 seconds", async () => {
            const originalFindMany = prisma.transaction.findMany;

            // Existing transaction created 10 seconds ago
            const justNow = new Date(Date.now() - 10 * 1000);

            (prisma.transaction as any).findMany = async ({ where }: any) => {
                if (where.userId === 1 && where.amount.toString() === "300") {
                    return [
                        {
                            id: 777,
                            amount: new Prisma.Decimal("300.00"),
                            category: Category.FUEL,
                            priority: Priority.ESSENTIAL,
                            title: "Petrol Shell",
                            notes: null,
                            transactionDate: new Date(),
                            createdAt: justNow,
                            updatedAt: new Date(),
                            userId: 1,
                            source: TransactionSource.MANUAL,
                            externalId: null,
                            sourceMetadata: null,
                        },
                    ];
                }
                return [];
            };

            try {
                const candidate = normalizeTransactionInput({
                    amount: 300,
                    category: Category.FUEL,
                    priority: Priority.ESSENTIAL,
                    title: "Petrol Shell",
                    source: TransactionSource.MANUAL,
                });
                const validation = validateTransactionCandidate(candidate, 1);
                assert.ok(validation.validated);

                const check = await detectDuplicate(validation.validated);
                assert.equal(check.status, "POTENTIAL_DUPLICATE");
                assert.equal(check.matchedTransactionId, 777);
                assert.equal(check.confidence, 0.95);
            } finally {
                prisma.transaction.findMany = originalFindMany;
            }
        });

        it("permits legitimate multiple manual purchases of the same amount on the same day if not rapid double-submit", async () => {
            const originalFindMany = prisma.transaction.findMany;

            // Existing coffee transaction created 4 hours ago
            const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

            (prisma.transaction as any).findMany = async () => {
                return [
                    {
                        id: 333,
                        amount: new Prisma.Decimal("120.00"),
                        category: Category.FOOD,
                        priority: Priority.ESSENTIAL,
                        title: "Coffee",
                        notes: null,
                        transactionDate: new Date(),
                        createdAt: fourHoursAgo,
                        updatedAt: new Date(),
                        userId: 1,
                        source: TransactionSource.MANUAL,
                        externalId: null,
                        sourceMetadata: null,
                    },
                ];
            };

            try {
                const candidate = normalizeTransactionInput({
                    amount: 120,
                    category: Category.FOOD,
                    priority: Priority.ESSENTIAL,
                    title: "Coffee",
                    source: TransactionSource.MANUAL,
                });
                const validation = validateTransactionCandidate(candidate, 1);
                assert.ok(validation.validated);

                const check = await detectDuplicate(validation.validated);
                // Should be eligible as NEW because human legitimately buys coffee again hours later
                assert.equal(check.status, "NEW");
            } finally {
                prisma.transaction.findMany = originalFindMany;
            }
        });
    });

    describe("4. Ingestion Orchestrator & Idempotent Persistence", () => {
        it("successfully accepts and persists a valid new candidate", async () => {
            const originalFindFirst = prisma.transaction.findFirst;
            const originalFindMany = prisma.transaction.findMany;
            const originalCreate = prisma.transaction.create;

            (prisma.transaction as any).findFirst = async () => null;
            (prisma.transaction as any).findMany = async () => [];
            (prisma.transaction as any).create = async ({ data }: any) => ({
                id: 1001,
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            try {
                const result = await ingestTransaction(
                    {
                        amount: "2500.00",
                        category: Category.SHOPPING,
                        priority: Priority.GOOD_TO_HAVE,
                        title: "New Headphones",
                        source: TransactionSource.CSV_IMPORT,
                        externalId: "CSV-ROW-101",
                        sourceMetadata: { rowNumber: 101, batchId: "batch-2026-08" },
                    },
                    { userId: 1 }
                );

                assert.equal(result.status, "ACCEPTED");
                assert.ok(result.transaction);
                assert.equal(result.transaction.id, 1001);
                assert.equal(result.transaction.amount.toString(), "2500");
                assert.equal(result.transaction.source, TransactionSource.CSV_IMPORT);
                assert.equal(result.transaction.externalId, "CSV-ROW-101");
            } finally {
                prisma.transaction.findFirst = originalFindFirst;
                prisma.transaction.findMany = originalFindMany;
                prisma.transaction.create = originalCreate;
            }
        });

        it("returns existing transaction idempotently on re-processing without duplicating", async () => {
            const originalFindFirst = prisma.transaction.findFirst;
            const originalFindUnique = prisma.transaction.findUnique;
            const originalCreate = prisma.transaction.create;

            let createCallCount = 0;
            (prisma.transaction as any).create = async () => {
                createCallCount++;
            };

            const existingTx = {
                id: 1001,
                amount: new Prisma.Decimal("2500.00"),
                category: Category.SHOPPING,
                priority: Priority.GOOD_TO_HAVE,
                title: "New Headphones",
                notes: null,
                transactionDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: 1,
                source: TransactionSource.CSV_IMPORT,
                externalId: "CSV-ROW-101",
                sourceMetadata: null,
            };

            (prisma.transaction as any).findFirst = async () => existingTx;
            (prisma.transaction as any).findUnique = async () => existingTx;

            try {
                const result = await ingestTransaction(
                    {
                        amount: "2500.00",
                        category: Category.SHOPPING,
                        title: "New Headphones",
                        source: TransactionSource.CSV_IMPORT,
                        externalId: "CSV-ROW-101",
                    },
                    { userId: 1 }
                );

                assert.equal(result.status, "CONFIRMED_DUPLICATE");
                assert.equal(result.transaction?.id, 1001);
                assert.equal(createCallCount, 0, "Must NOT call prisma.transaction.create for duplicate");
            } finally {
                prisma.transaction.findFirst = originalFindFirst;
                prisma.transaction.findUnique = originalFindUnique;
                prisma.transaction.create = originalCreate;
            }
        });

        it("unconfirmed potential duplicates are NOT written to the database", async () => {
            const originalFindMany = prisma.transaction.findMany;
            const originalCreate = prisma.transaction.create;

            let createCallCount = 0;
            (prisma.transaction as any).create = async () => {
                createCallCount++;
            };

            (prisma.transaction as any).findMany = async () => [
                {
                    id: 999,
                    amount: new Prisma.Decimal("500.00"),
                    category: Category.FOOD,
                    priority: Priority.ESSENTIAL,
                    title: "Dinner Buffet",
                    notes: null,
                    transactionDate: new Date("2026-08-15T00:00:00.000Z"),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    userId: 1,
                    source: TransactionSource.BANK_STATEMENT,
                    externalId: null,
                    sourceMetadata: null,
                },
            ];

            try {
                const result = await ingestTransaction(
                    {
                        amount: 500,
                        category: Category.FOOD,
                        title: "Dinner Buffet",
                        transactionDate: "2026-08-15",
                        source: TransactionSource.BANK_STATEMENT,
                        allowPotentialDuplicate: false, // Not confirmed yet
                    },
                    { userId: 1 }
                );

                assert.equal(result.status, "POTENTIAL_DUPLICATE");
                assert.equal(result.transaction, undefined);
                assert.equal(createCallCount, 0, "Unconfirmed candidate must NEVER be persisted to DB");
            } finally {
                prisma.transaction.findMany = originalFindMany;
                prisma.transaction.create = originalCreate;
            }
        });

        it("supports batch ingestion processing candidates independently", async () => {
            const originalFindFirst = prisma.transaction.findFirst;
            const originalFindMany = prisma.transaction.findMany;
            const originalCreate = prisma.transaction.create;

            (prisma.transaction as any).findFirst = async () => null;
            (prisma.transaction as any).findMany = async () => [];
            (prisma.transaction as any).create = async ({ data }: any) => ({
                id: Math.floor(Math.random() * 10000),
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            try {
                const batch = await ingestTransactionBatch(
                    [
                        { amount: 100, title: "Item 1", category: Category.FOOD },
                        { amount: -50, title: "Item 2 (Zero)", category: Category.FOOD }, // Will be positive 50
                        { amount: 0, title: "Item 3 (Invalid)", category: Category.FOOD }, // Validation fail
                        { amount: 250, title: "Item 4", category: Category.FUEL },
                    ],
                    { userId: 1 }
                );

                assert.equal(batch.total, 4);
                assert.equal(batch.accepted, 3);
                assert.equal(batch.failed, 1);
                assert.equal(batch.results[2].status, "VALIDATION_FAILED");
            } finally {
                prisma.transaction.findFirst = originalFindFirst;
                prisma.transaction.findMany = originalFindMany;
                prisma.transaction.create = originalCreate;
            }
        });
    });

    describe("5. Integration with Existing Manual Entry & Ledger APIs", () => {
        it("routes manual transactionService.createTransaction through the canonical pipeline", async () => {
            const originalFindFirst = prisma.transaction.findFirst;
            const originalFindMany = prisma.transaction.findMany;
            const originalCreate = prisma.transaction.create;

            let capturedSource: any = null;
            (prisma.transaction as any).findFirst = async () => null;
            (prisma.transaction as any).findMany = async () => [];
            (prisma.transaction as any).create = async ({ data }: any) => {
                capturedSource = data.source;
                return {
                    id: 2001,
                    ...data,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            };

            try {
                const created = await transactionService.createTransaction(
                    {
                        amount: 350,
                        category: Category.FOOD,
                        priority: Priority.ESSENTIAL,
                        title: "Manual Coffee & Snack",
                    },
                    1
                );

                assert.ok(created);
                assert.equal(created.id, 2001);
                assert.equal(capturedSource, TransactionSource.MANUAL, "Manual entry must have source = MANUAL");
            } finally {
                prisma.transaction.findFirst = originalFindFirst;
                prisma.transaction.findMany = originalFindMany;
                prisma.transaction.create = originalCreate;
            }
        });

        it("throws ConflictError on manual rapid double-click duplicate", async () => {
            const originalFindMany = prisma.transaction.findMany;
            const justNow = new Date(Date.now() - 5 * 1000); // 5 seconds ago

            (prisma.transaction as any).findMany = async () => [
                {
                    id: 2001,
                    amount: new Prisma.Decimal("350.00"),
                    category: Category.FOOD,
                    priority: Priority.ESSENTIAL,
                    title: "Manual Coffee & Snack",
                    notes: null,
                    transactionDate: new Date(),
                    createdAt: justNow,
                    updatedAt: new Date(),
                    userId: 1,
                    source: TransactionSource.MANUAL,
                    externalId: null,
                    sourceMetadata: null,
                },
            ];

            try {
                await assert.rejects(
                    async () => {
                        await transactionService.createTransaction(
                            {
                                amount: 350,
                                category: Category.FOOD,
                                priority: Priority.ESSENTIAL,
                                title: "Manual Coffee & Snack",
                            },
                            1
                        );
                    },
                    (err: any) => {
                        assert.ok(err instanceof ConflictError);
                        assert.match(err.message, /identical/i);
                        return true;
                    }
                );
            } finally {
                prisma.transaction.findMany = originalFindMany;
            }
        });

        it("preserves existing transaction update and deletion capabilities", async () => {
            const originalFindUnique = prisma.transaction.findUnique;
            const originalUpdate = prisma.transaction.update;
            const originalDelete = prisma.transaction.delete;

            (prisma.transaction as any).findUnique = async ({ where }: any) => {
                if (where.id === 501) {
                    return {
                        id: 501,
                        amount: new Prisma.Decimal("100"),
                        category: Category.FOOD,
                        priority: Priority.ESSENTIAL,
                        userId: 1,
                    };
                }
                return null;
            };

            let updatedTitle = "";
            (prisma.transaction as any).update = async ({ data }: any) => {
                updatedTitle = data.title;
                return { id: 501, title: updatedTitle };
            };

            let deletedId = 0;
            (prisma.transaction as any).delete = async ({ where }: any) => {
                deletedId = where.id;
                return { id: 501 };
            };

            try {
                const updated = await transactionService.updateTransaction(501, 1, { title: "Updated Grocery" });
                assert.equal(updatedTitle, "Updated Grocery");

                await transactionService.deleteTransaction(501, 1);
                assert.equal(deletedId, 501);
            } finally {
                prisma.transaction.findUnique = originalFindUnique;
                prisma.transaction.update = originalUpdate;
                prisma.transaction.delete = originalDelete;
            }
        });
    });
});

import "dotenv/config";
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import app from "../app";
import prisma from "../lib/prisma";
import { generateToken } from "../lib/jwt";
import { Category, Priority, Prisma, Transaction } from "../generated/prisma/client";
import { cleanNarration, normalizeMerchant } from "../recurring/merchant-normalizer";
import { analyzeCadence } from "../recurring/cadence-analyzer";
import { analyzeAmounts } from "../recurring/amount-analyzer";
import { recurringExpenseDetector } from "../recurring/recurring-detector";
import { recurringPreferenceStore } from "../recurring/recurring-preference.store";
import { recurringService } from "../services/recurring.service";

describe("FinOne | PR 11: Recurring Expense Detection Test Suite", () => {
    let server: Server;
    let baseUrl: string;
    let testUserId1: number;
    let testUserId2: number;
    let authToken1: string;
    let authToken2: string;

    const createdTransactionIds: number[] = [];

    before(async () => {
        // Start ephemeral HTTP server for API endpoint tests
        await new Promise<void>((resolve) => {
            server = app.listen(0, () => {
                const addr = server.address();
                if (addr && typeof addr === "object") {
                    baseUrl = `http://localhost:${addr.port}`;
                }
                resolve();
            });
        });

        // Create ephemeral test users
        const user1 = await prisma.user.create({
            data: {
                name: "Recurring User 1",
                email: `recurring_user1_${Date.now()}@test.com`,
                passwordHash: "dummy_hash_for_testing",
            },
        });
        testUserId1 = user1.id;
        authToken1 = generateToken(user1.id);

        const user2 = await prisma.user.create({
            data: {
                name: "Recurring User 2",
                email: `recurring_user2_${Date.now()}@test.com`,
                passwordHash: "dummy_hash_for_testing",
            },
        });
        testUserId2 = user2.id;
        authToken2 = generateToken(user2.id);
    });

    after(async () => {
        if (server) {
            await new Promise<void>((resolve) => server.close(() => resolve()));
        }

        // Clean up test transactions
        if (createdTransactionIds.length > 0) {
            await prisma.transaction.deleteMany({
                where: { id: { in: createdTransactionIds } },
            });
        }

        // Clean up test users
        if (testUserId1) {
            await prisma.user.deleteMany({ where: { id: testUserId1 } });
        }
        if (testUserId2) {
            await prisma.user.deleteMany({ where: { id: testUserId2 } });
        }

        recurringPreferenceStore.clearPreferences();
        await prisma.$disconnect();
    });

    beforeEach(() => {
        recurringPreferenceStore.clearPreferences();
    });

    // Helper to create synthetic transactions
    const createTx = (
        id: number,
        title: string,
        amount: number,
        dateStr: string,
        category: Category = Category.SUBSCRIPTION,
        userId: number = testUserId1,
        notes: string | null = null
    ): Transaction => ({
        id,
        userId,
        title,
        notes,
        amount: new Prisma.Decimal(amount),
        category,
        priority: Priority.ESSENTIAL,
        transactionDate: new Date(dateStr),
        createdAt: new Date(dateStr),
        updatedAt: new Date(dateStr),
        source: "BANK_STATEMENT",
        externalId: `ext_${id}`,
        sourceMetadata: null,
    });

    // =========================================================================
    // 1. UNIT TESTS: MERCHANT NORMALIZATION & CADENCE
    // =========================================================================
    describe("1. Merchant & Narration Normalization", () => {
        it("cleans noisy banking prefixes, reference IDs, and dates", () => {
            const raw1 = "UPI-NETFLIX-NETFLIX@HDFC-S4923306 15-OCT-2026 MUMBAI IN";
            const cleaned1 = cleanNarration(raw1);
            assert.ok(!cleaned1.includes("UPI-"));
            assert.ok(!cleaned1.includes("S4923306"));
            assert.ok(cleaned1.toLowerCase().includes("netflix"));

            const raw2 = "IB BILLPAY DR-HDFCPE-54593829-AIRTEL BROADBAND";
            const cleaned2 = cleanNarration(raw2);
            assert.ok(!cleaned2.includes("IB BILLPAY"));
            assert.ok(cleaned2.toLowerCase().includes("airtel broadband"));
        });

        it("normalizes known merchants to canonical subscription and bill names", () => {
            const norm1 = normalizeMerchant("NETFLIX ENTERTAINMENT SVCS MUMBAI", null);
            assert.equal(norm1.canonicalName, "Netflix");
            assert.equal(norm1.isKnownMerchant, true);
            assert.equal(norm1.knownDefinition?.defaultType, "SUBSCRIPTION");

            const norm2 = normalizeMerchant("BESCOM ELECTRICITY BANGALORE URBAN", null);
            assert.equal(norm2.canonicalName, "BESCOM Electricity");
            assert.equal(norm2.knownDefinition?.defaultType, "BILL_PAYMENT");
        });

        it("creates stable cluster keys for unfamiliar merchants", () => {
            const normA = normalizeMerchant("Downtown Roast Coffee Shop 1234", null);
            const normB = normalizeMerchant("Downtown Roast Coffee Shop 5678", null);
            assert.equal(normA.normalizedKey, normB.normalizedKey);
            assert.equal(normA.canonicalName, "Downtown Roast Coffee Shop");
        });
    });

    describe("2. Cadence & Amount Analysis", () => {
        it("accurately detects monthly frequency and regular intervals", () => {
            const dates = [
                new Date("2026-06-05"),
                new Date("2026-07-05"),
                new Date("2026-08-05"),
                new Date("2026-09-05"),
            ];

            const result = analyzeCadence(dates);
            assert.equal(result.frequency, "MONTHLY");
            assert.equal(result.intervalDaysMedian, 31);
            assert.ok(result.regularityScore >= 0.9);
            assert.equal(result.hasMissingIntervals, false);
            assert.ok(result.estimatedNextDate !== null);
        });

        it("accurately detects weekly frequency", () => {
            const dates = [
                new Date("2026-09-01"),
                new Date("2026-09-08"),
                new Date("2026-09-15"),
                new Date("2026-09-22"),
            ];

            const result = analyzeCadence(dates);
            assert.equal(result.frequency, "WEEKLY");
            assert.equal(result.intervalDaysMedian, 7);
            assert.ok(result.regularityScore >= 0.9);
        });

        it("detects missing cycles (e.g., missed 1 month)", () => {
            const dates = [
                new Date("2026-05-10"),
                new Date("2026-06-10"),
                // Missed July! (~62 days gap)
                new Date("2026-08-11"),
                new Date("2026-09-10"),
            ];

            const result = analyzeCadence(dates);
            assert.equal(result.frequency, "MONTHLY");
            assert.equal(result.hasMissingIntervals, true);
        });

        it("distinguishes fixed subscription amounts from variable utility bills", () => {
            // Fixed
            const fixed = analyzeAmounts([649, 649, 649, 649]);
            assert.equal(fixed.isVariableAmount, false);
            assert.equal(fixed.amountConsistencyScore, 1.0);
            assert.equal(fixed.averageAmount, 649);

            // Variable
            const variable = analyzeAmounts([1250, 1420, 1310, 1550]);
            assert.equal(variable.isVariableAmount, true);
            assert.ok(variable.amountConsistencyScore >= 0.65);
            assert.equal(variable.minAmount, 1250);
            assert.equal(variable.maxAmount, 1550);
        });
    });

    // =========================================================================
    // 3. CORE DETECTION ENGINE RULES & EVIDENCE
    // =========================================================================
    describe("3. Recurring Expense Detection Engine", () => {
        it("detects high-confidence monthly fixed subscription (e.g. Netflix)", () => {
            const txs = [
                createTx(1, "Netflix.com Mumbai", 649, "2026-06-10"),
                createTx(2, "Netflix.com Mumbai", 649, "2026-07-10"),
                createTx(3, "Netflix.com Mumbai", 649, "2026-08-10"),
                createTx(4, "Netflix.com Mumbai", 649, "2026-09-10"),
            ];

            const res = recurringExpenseDetector.detect(txs, testUserId1);
            assert.equal(res.patterns.length, 1);

            const pattern = res.patterns[0];
            assert.equal(pattern.merchantName, "Netflix");
            assert.equal(pattern.frequency, "MONTHLY");
            assert.equal(pattern.type, "SUBSCRIPTION");
            assert.equal(pattern.isVariableAmount, false);
            assert.equal(pattern.averageAmount, 649);
            assert.equal(pattern.confidenceLevel, "HIGH");
            assert.ok(pattern.confidence >= 0.85);
            assert.equal(pattern.transactionCount, 4);
            assert.ok(pattern.estimatedNextDate !== null);
            assert.ok(pattern.evidence.explanation.includes("Paid 4 times"));
        });

        it("detects variable monthly utility bill (e.g. Tata Power electricity)", () => {
            const txs = [
                createTx(11, "Tata Power Electricity Bill", 1450.5, "2026-06-03", Category.BILLS),
                createTx(12, "Tata Power Electricity Bill", 1680.0, "2026-07-04", Category.BILLS),
                createTx(13, "Tata Power Electricity Bill", 1520.0, "2026-08-03", Category.BILLS),
            ];

            const res = recurringExpenseDetector.detect(txs, testUserId1);
            assert.equal(res.patterns.length, 1);

            const pattern = res.patterns[0];
            assert.equal(pattern.merchantName, "Tata Power");
            assert.equal(pattern.frequency, "MONTHLY");
            assert.equal(pattern.type, "BILL_PAYMENT");
            assert.equal(pattern.isVariableAmount, true);
            assert.ok(pattern.amountVariancePercentage > 0);
            assert.ok(pattern.confidenceLevel === "HIGH" || pattern.confidenceLevel === "MEDIUM");
            assert.ok(pattern.evidence.explanation.includes("variable amounts"));
        });

        it("detects quarterly payment pattern", () => {
            const txs = [
                createTx(21, "HDFC Life Insurance Premium", 7500, "2026-01-15", Category.BILLS),
                createTx(22, "HDFC Life Insurance Premium", 7500, "2026-04-15", Category.BILLS),
                createTx(23, "HDFC Life Insurance Premium", 7500, "2026-07-15", Category.BILLS),
            ];

            const res = recurringExpenseDetector.detect(txs, testUserId1);
            assert.equal(res.patterns.length, 1);
            assert.equal(res.patterns[0].frequency, "QUARTERLY");
            assert.equal(res.patterns[0].averageAmount, 7500);
        });

        it("detects annual renewal pattern", () => {
            const txs = [
                createTx(31, "Amazon Prime Annual Membership", 1499, "2025-05-20", Category.SUBSCRIPTION),
                createTx(32, "Amazon Prime Annual Membership", 1499, "2026-05-20", Category.SUBSCRIPTION),
            ];

            const res = recurringExpenseDetector.detect(txs, testUserId1);
            assert.equal(res.patterns.length, 1);
            assert.equal(res.patterns[0].frequency, "ANNUAL");
            assert.equal(res.patterns[0].averageAmount, 1499);
        });

        it("handles missing interval conservatively without discarding pattern", () => {
            const txs = [
                createTx(41, "Airtel Broadband", 1178, "2026-04-02", Category.BILLS),
                createTx(42, "Airtel Broadband", 1178, "2026-05-02", Category.BILLS),
                // June missed!
                createTx(43, "Airtel Broadband", 1178, "2026-07-03", Category.BILLS),
                createTx(44, "Airtel Broadband", 1178, "2026-08-02", Category.BILLS),
            ];

            const res = recurringExpenseDetector.detect(txs, testUserId1);
            assert.equal(res.patterns.length, 1);
            assert.equal(res.patterns[0].frequency, "MONTHLY");
            assert.equal(res.patterns[0].evidence.signals.hasMissingIntervals, true);
        });

        it("never infers certainty from a single transaction (insufficient history)", () => {
            const txs = [
                createTx(51, "One-off Big Purchase Croma Electronics", 45000, "2026-08-15", Category.SHOPPING),
                createTx(52, "Random Restaurant Dinner", 1200, "2026-08-16", Category.FOOD),
            ];

            const res = recurringExpenseDetector.detect(txs, testUserId1);
            assert.equal(res.patterns.length, 0);
        });
    });

    // =========================================================================
    // 4. FINANCIAL INTEGRITY & INVARIANTS
    // =========================================================================
    describe("4. Financial Invariants & Exclusions", () => {
        it("strictly excludes monthly salary and income credits from recurring expense detection", () => {
            const txs = [
                // Monthly salary credits
                createTx(61, "SALARY CREDIT - TECH CORP ACME", 95000, "2026-06-01", Category.OTHER),
                createTx(62, "SALARY CREDIT - TECH CORP ACME", 95000, "2026-07-01", Category.OTHER),
                createTx(63, "SALARY CREDIT - TECH CORP ACME", 95000, "2026-08-01", Category.OTHER),
                // Valid monthly recurring expense
                createTx(64, "Cult.fit Monthly Membership", 1850, "2026-06-05", Category.HEALTH),
                createTx(65, "Cult.fit Monthly Membership", 1850, "2026-07-05", Category.HEALTH),
                createTx(66, "Cult.fit Monthly Membership", 1850, "2026-08-05", Category.HEALTH),
            ];

            const res = recurringExpenseDetector.detect(txs, testUserId1);
            // Must contain Cult.fit, but NEVER the salary credits
            assert.equal(res.patterns.length, 1);
            assert.equal(res.patterns[0].merchantName, "Cult.fit");
            assert.ok(!res.patterns.some((p) => p.merchantName.toLowerCase().includes("salary")));
        });

        it("strictly excludes internal account transfers and balance summaries", () => {
            const txs = [
                // Recurring fund transfer to own account / RD
                createTx(71, "TRF TO OWN ACCOUNT SAVINGS-5928", 20000, "2026-05-10", Category.OTHER),
                createTx(72, "TRF TO OWN ACCOUNT SAVINGS-5928", 20000, "2026-06-10", Category.OTHER),
                createTx(73, "TRF TO OWN ACCOUNT SAVINGS-5928", 20000, "2026-07-10", Category.OTHER),
                // Statement balance summaries
                createTx(74, "OPENING BALANCE B/F", 50000, "2026-05-01", Category.OTHER),
                createTx(75, "CLOSING BALANCE C/F", 45000, "2026-05-31", Category.OTHER),
            ];

            const res = recurringExpenseDetector.detect(txs, testUserId1);
            assert.equal(res.patterns.length, 0);
        });

        it("enforces tenant isolation across multiple users", () => {
            const txsUser1 = [
                createTx(81, "Spotify Premium", 119, "2026-07-01", Category.SUBSCRIPTION, testUserId1),
                createTx(82, "Spotify Premium", 119, "2026-08-01", Category.SUBSCRIPTION, testUserId1),
            ];

            const txsUser2 = [
                createTx(83, "Disney+ Hotstar", 299, "2026-07-10", Category.SUBSCRIPTION, testUserId2),
                createTx(84, "Disney+ Hotstar", 299, "2026-08-10", Category.SUBSCRIPTION, testUserId2),
            ];

            // Evaluate for User 1
            const res1 = recurringExpenseDetector.detect([...txsUser1, ...txsUser2], testUserId1);
            assert.equal(res1.patterns.length, 1);
            assert.equal(res1.patterns[0].merchantName, "Spotify");

            // Evaluate for User 2
            const res2 = recurringExpenseDetector.detect([...txsUser1, ...txsUser2], testUserId2);
            assert.equal(res2.patterns.length, 1);
            assert.equal(res2.patterns[0].merchantName, "Disney+ Hotstar");
        });
    });

    // =========================================================================
    // 5. USER PREFERENCES: CONFIRMATION & DISMISSAL
    // =========================================================================
    describe("5. User Preferences Lifecycle", () => {
        it("allows user to confirm a possible recurring pattern and sets confidence to 1.0", () => {
            const txs = [
                createTx(91, "Cult.fit Membership", 1750, "2026-07-12", Category.HEALTH),
                createTx(92, "Cult.fit Membership", 1750, "2026-08-12", Category.HEALTH),
            ];

            // Step 1: Detect initially as POSSIBLE
            const initial = recurringExpenseDetector.detect(txs, testUserId1);
            assert.equal(initial.patterns[0].status, "POSSIBLE");
            const patternId = initial.patterns[0].id;

            // Step 2: Confirm pattern
            recurringPreferenceStore.confirmPattern(testUserId1, patternId, "My personal gym membership");

            // Step 3: Re-detect
            const recheck = recurringExpenseDetector.detect(txs, testUserId1);
            assert.equal(recheck.patterns[0].status, "CONFIRMED");
            assert.equal(recheck.patterns[0].userConfirmed, true);
            assert.equal(recheck.patterns[0].confidence, 1.0);
            assert.equal(recheck.patterns[0].userNotes, "My personal gym membership");
        });

        it("allows user to dismiss a pattern, hiding it from default view unless includeDismissed=true", () => {
            const txs = [
                createTx(101, "Local Gym Monthly Fee", 2500, "2026-07-01", Category.HEALTH),
                createTx(102, "Local Gym Monthly Fee", 2500, "2026-08-01", Category.HEALTH),
            ];

            const initial = recurringExpenseDetector.detect(txs, testUserId1);
            const patternId = initial.patterns[0].id;

            // Dismiss
            recurringPreferenceStore.dismissPattern(testUserId1, patternId);

            // Default check excludes dismissed
            const activeRes = recurringExpenseDetector.detect(txs, testUserId1, { includeDismissed: false });
            assert.equal(activeRes.patterns.length, 0);

            // Explicit includeDismissed check returns it
            const dismissedRes = recurringExpenseDetector.detect(txs, testUserId1, { includeDismissed: true });
            assert.equal(dismissedRes.patterns.length, 1);
            assert.equal(dismissedRes.patterns[0].status, "DISMISSED");
            assert.equal(dismissedRes.patterns[0].userDismissed, true);
        });

        it("resets a confirmed or dismissed pattern back to POSSIBLE", () => {
            const txs = [
                createTx(111, "Spotify Premium", 119, "2026-07-01"),
                createTx(112, "Spotify Premium", 119, "2026-08-01"),
            ];

            const initial = recurringExpenseDetector.detect(txs, testUserId1);
            const patternId = initial.patterns[0].id;

            recurringPreferenceStore.confirmPattern(testUserId1, patternId);
            assert.equal(recurringExpenseDetector.detect(txs, testUserId1).patterns[0].status, "CONFIRMED");

            recurringPreferenceStore.resetPattern(testUserId1, patternId);
            assert.equal(recurringExpenseDetector.detect(txs, testUserId1).patterns[0].status, "POSSIBLE");
        });
    });

    // =========================================================================
    // 6. END-TO-END HTTP API ENDPOINTS
    // =========================================================================
    describe("6. HTTP API Endpoints (/api/recurring)", () => {
        before(async () => {
            // Persist test transactions in real PostgreSQL database for API endpoints
            const dbTxs = await prisma.transaction.createManyAndReturn({
                data: [
                    {
                        userId: testUserId1,
                        title: "Netflix Subscription",
                        amount: new Prisma.Decimal(649),
                        category: Category.SUBSCRIPTION,
                        priority: Priority.ESSENTIAL,
                        transactionDate: new Date("2026-06-15"),
                        source: "BANK_STATEMENT",
                    },
                    {
                        userId: testUserId1,
                        title: "Netflix Subscription",
                        amount: new Prisma.Decimal(649),
                        category: Category.SUBSCRIPTION,
                        priority: Priority.ESSENTIAL,
                        transactionDate: new Date("2026-07-15"),
                        source: "BANK_STATEMENT",
                    },
                    {
                        userId: testUserId1,
                        title: "Netflix Subscription",
                        amount: new Prisma.Decimal(649),
                        category: Category.SUBSCRIPTION,
                        priority: Priority.ESSENTIAL,
                        transactionDate: new Date("2026-08-15"),
                        source: "BANK_STATEMENT",
                    },
                ],
            });

            for (const t of dbTxs) {
                createdTransactionIds.push(t.id);
            }
        });

        it("GET /api/recurring returns 200 with detected patterns and summary", async () => {
            const res = await fetch(`${baseUrl}/api/recurring`, {
                headers: { Authorization: `Bearer ${authToken1}` },
            });

            assert.equal(res.status, 200);
            const body = await res.json();
            assert.ok(Array.isArray(body.patterns));
            assert.ok(body.patterns.length >= 1);
            assert.equal(body.patterns[0].merchantName, "Netflix");
            assert.equal(body.patterns[0].frequency, "MONTHLY");
            assert.ok(body.summary.totalDetected >= 1);
            assert.ok(body.summary.estimatedMonthlyOutflow > 0);
        });

        it("GET /api/recurring/:id returns 200 with detailed pattern and evidence", async () => {
            // Get pattern ID first
            const listRes = await fetch(`${baseUrl}/api/recurring`, {
                headers: { Authorization: `Bearer ${authToken1}` },
            });
            const listBody = await listRes.json();
            const patternId = listBody.patterns[0].id;

            const res = await fetch(`${baseUrl}/api/recurring/${patternId}`, {
                headers: { Authorization: `Bearer ${authToken1}` },
            });

            assert.equal(res.status, 200);
            const pattern = await res.json();
            assert.equal(pattern.id, patternId);
            assert.ok(pattern.evidence.matchedTransactions.length >= 3);
        });

        it("POST /api/recurring/:id/confirm sets status to CONFIRMED", async () => {
            const listRes = await fetch(`${baseUrl}/api/recurring`, {
                headers: { Authorization: `Bearer ${authToken1}` },
            });
            const patternId = (await listRes.json()).patterns[0].id;

            const confirmRes = await fetch(`${baseUrl}/api/recurring/${patternId}/confirm`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${authToken1}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ notes: "Family 4K plan" }),
            });

            assert.equal(confirmRes.status, 200);
            const updated = await confirmRes.json();
            assert.equal(updated.status, "CONFIRMED");
            assert.equal(updated.userNotes, "Family 4K plan");
        });

        it("POST /api/recurring/:id/dismiss sets status to DISMISSED", async () => {
            const listRes = await fetch(`${baseUrl}/api/recurring?includeDismissed=true`, {
                headers: { Authorization: `Bearer ${authToken1}` },
            });
            const patternId = (await listRes.json()).patterns[0].id;

            const dismissRes = await fetch(`${baseUrl}/api/recurring/${patternId}/dismiss`, {
                method: "POST",
                headers: { Authorization: `Bearer ${authToken1}` },
            });

            assert.equal(dismissRes.status, 200);
            const updated = await dismissRes.json();
            assert.equal(updated.status, "DISMISSED");

            // Verify it disappears from default list
            const defaultList = await (
                await fetch(`${baseUrl}/api/recurring`, {
                    headers: { Authorization: `Bearer ${authToken1}` },
                })
            ).json();
            assert.ok(!defaultList.patterns.some((p: any) => p.id === patternId));
        });

        it("POST /api/recurring/:id/reset reverts status to POSSIBLE", async () => {
            const listRes = await fetch(`${baseUrl}/api/recurring?includeDismissed=true`, {
                headers: { Authorization: `Bearer ${authToken1}` },
            });
            const patternId = (await listRes.json()).patterns[0].id;

            const resetRes = await fetch(`${baseUrl}/api/recurring/${patternId}/reset`, {
                method: "POST",
                headers: { Authorization: `Bearer ${authToken1}` },
            });

            assert.equal(resetRes.status, 200);
            const updated = await resetRes.json();
            assert.equal(updated.status, "POSSIBLE");
        });

        it("enforces tenant isolation: user 2 receives 404 for user 1's pattern", async () => {
            const listRes = await fetch(`${baseUrl}/api/recurring`, {
                headers: { Authorization: `Bearer ${authToken1}` },
            });
            const patternId = (await listRes.json()).patterns[0].id;

            const user2Res = await fetch(`${baseUrl}/api/recurring/${patternId}`, {
                headers: { Authorization: `Bearer ${authToken2}` },
            });

            assert.equal(user2Res.status, 404);
        });

        it("rejects unauthenticated requests with 401 Unauthorized", async () => {
            const res = await fetch(`${baseUrl}/api/recurring`);
            assert.equal(res.status, 401);
        });
    });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import { monthlyInsightsQuerySchema } from "../schemas/insights.schema";
import {
    parseMonthQuery,
    getMonthDateBoundaries,
    formatMonthLabel,
    getMonthlyInsights,
} from "../services/insights.service";
import { Category, Priority } from "../generated/prisma/enums";

describe("FinOne Monthly Financial Insights: Date & Query Parsing", () => {
    it("validates valid month formats", () => {
        const validMonths = ["2026-01", "2026-08", "2026-12", "2024-02"];
        for (const month of validMonths) {
            const parsed = monthlyInsightsQuerySchema.parse({ month });
            assert.equal(parsed.month, month);
        }
    });

    it("rejects invalid month formats", () => {
        const invalidMonths = [
            "2026-13",
            "2026-00",
            "2026-8",
            "26-08",
            "2026/08",
            "August 2026",
            "2026-August",
        ];
        for (const month of invalidMonths) {
            assert.throws(() => {
                monthlyInsightsQuerySchema.parse({ month });
            });
        }
    });

    it("parses explicit month query into year, monthIndex, and previous month", () => {
        const result = parseMonthQuery("2026-08");
        assert.equal(result.year, 2026);
        assert.equal(result.monthIndex, 7); // 0-based: August = 7
        assert.equal(result.selectedMonthString, "2026-08");
        assert.equal(result.prevYear, 2026);
        assert.equal(result.prevMonthIndex, 6); // July = 6
        assert.equal(result.prevMonthString, "2026-07");
    });

    it("handles year rollover for January to previous December", () => {
        const result = parseMonthQuery("2026-01");
        assert.equal(result.year, 2026);
        assert.equal(result.monthIndex, 0); // January = 0
        assert.equal(result.prevYear, 2025);
        assert.equal(result.prevMonthIndex, 11); // December = 11
        assert.equal(result.prevMonthString, "2025-12");
    });

    it("computes exact UTC month boundaries", () => {
        const august = getMonthDateBoundaries(2026, 7); // August 2026
        assert.equal(august.startDate.toISOString(), "2026-08-01T00:00:00.000Z");
        assert.equal(august.endDate.toISOString(), "2026-08-31T23:59:59.999Z");
        assert.equal(august.daysInMonth, 31);

        const febLeap = getMonthDateBoundaries(2024, 1); // Feb 2024 (Leap year)
        assert.equal(febLeap.startDate.toISOString(), "2024-02-01T00:00:00.000Z");
        assert.equal(febLeap.endDate.toISOString(), "2024-02-29T23:59:59.999Z");
        assert.equal(febLeap.daysInMonth, 29);

        const febNonLeap = getMonthDateBoundaries(2026, 1); // Feb 2026
        assert.equal(febNonLeap.startDate.toISOString(), "2026-02-01T00:00:00.000Z");
        assert.equal(febNonLeap.endDate.toISOString(), "2026-02-28T23:59:59.999Z");
        assert.equal(febNonLeap.daysInMonth, 28);
    });

    it("formats human-readable month labels", () => {
        assert.equal(formatMonthLabel(2026, 7), "August 2026");
        assert.equal(formatMonthLabel(2025, 11), "December 2025");
        assert.equal(formatMonthLabel(2026, 0), "January 2026");
    });
});

describe("FinOne Monthly Financial Insights: Deterministic Service Operations", () => {
    it("generates comprehensive monthly insights for normal multi-month user", async () => {
        const origAggregate = prisma.transaction.aggregate;
        const origCount = prisma.transaction.count;
        const origGroupBy = prisma.transaction.groupBy;
        const origFindMany = prisma.transaction.findMany;

        try {
            // Mock DB queries for August 2026 vs July 2026
            (prisma.transaction as any).aggregate = async ({ where }: any) => {
                const isAugust = where.transactionDate.gte.toISOString().includes("2026-08-01");
                return {
                    _sum: {
                        amount: isAugust ? new Prisma.Decimal("1200.00") : new Prisma.Decimal("1000.00"),
                    },
                };
            };

            (prisma.transaction as any).count = async ({ where }: any) => {
                const isAugust = where.transactionDate.gte.toISOString().includes("2026-08-01");
                return isAugust ? 24 : 18;
            };

            (prisma.transaction as any).groupBy = async ({ by, where }: any) => {
                const isAugust = where.transactionDate.gte.toISOString().includes("2026-08-01");
                if (by.includes("category")) {
                    if (isAugust) {
                        return [
                            { category: Category.FOOD, _sum: { amount: new Prisma.Decimal("500.00") }, _count: { id: 10 } },
                            { category: Category.BILLS, _sum: { amount: new Prisma.Decimal("300.00") }, _count: { id: 3 } },
                            { category: Category.SUBSCRIPTION, _sum: { amount: new Prisma.Decimal("100.00") }, _count: { id: 4 } },
                            { category: Category.SHOPPING, _sum: { amount: new Prisma.Decimal("200.00") }, _count: { id: 5 } },
                            { category: Category.ENTERTAINMENT, _sum: { amount: new Prisma.Decimal("100.00") }, _count: { id: 2 } },
                        ];
                    } else {
                        return [
                            { category: Category.FOOD, _sum: { amount: new Prisma.Decimal("400.00") }, _count: { id: 8 } },
                            { category: Category.BILLS, _sum: { amount: new Prisma.Decimal("300.00") }, _count: { id: 3 } },
                            { category: Category.SUBSCRIPTION, _sum: { amount: new Prisma.Decimal("80.00") }, _count: { id: 3 } },
                            { category: Category.SHOPPING, _sum: { amount: new Prisma.Decimal("120.00") }, _count: { id: 3 } },
                            { category: Category.ENTERTAINMENT, _sum: { amount: new Prisma.Decimal("100.00") }, _count: { id: 1 } },
                        ];
                    }
                }
                if (by.includes("priority")) {
                    if (isAugust) {
                        return [
                            { priority: Priority.ESSENTIAL, _sum: { amount: new Prisma.Decimal("800.00") }, _count: { id: 13 } },
                            { priority: Priority.GOOD_TO_HAVE, _sum: { amount: new Prisma.Decimal("200.00") }, _count: { id: 5 } },
                            { priority: Priority.LUXURY, _sum: { amount: new Prisma.Decimal("150.00") }, _count: { id: 4 } },
                            { priority: Priority.UNCLASSIFIED, _sum: { amount: new Prisma.Decimal("50.00") }, _count: { id: 2 } },
                        ];
                    } else {
                        return [
                            { priority: Priority.ESSENTIAL, _sum: { amount: new Prisma.Decimal("700.00") }, _count: { id: 11 } },
                            { priority: Priority.GOOD_TO_HAVE, _sum: { amount: new Prisma.Decimal("200.00") }, _count: { id: 5 } },
                            { priority: Priority.LUXURY, _sum: { amount: new Prisma.Decimal("100.00") }, _count: { id: 2 } },
                        ];
                    }
                }
                return [];
            };

            (prisma.transaction as any).findMany = async () => {
                return [
                    {
                        id: 101,
                        title: "Monthly Rent & Utilities",
                        amount: new Prisma.Decimal("300.00"),
                        category: Category.BILLS,
                        priority: Priority.ESSENTIAL,
                        transactionDate: new Date("2026-08-02T10:00:00.000Z"),
                    },
                    {
                        id: 102,
                        title: "Designer Jacket",
                        amount: new Prisma.Decimal("150.00"),
                        category: Category.SHOPPING,
                        priority: Priority.LUXURY,
                        transactionDate: new Date("2026-08-15T15:30:00.000Z"),
                    },
                ];
            };

            const insights = await getMonthlyInsights(42, { month: "2026-08" });

            // 1. Period verification
            assert.equal(insights.period.selectedMonth, "2026-08");
            assert.equal(insights.period.monthLabel, "August 2026");
            assert.equal(insights.comparisonPeriod.selectedMonth, "2026-07");
            assert.equal(insights.comparisonPeriod.monthLabel, "July 2026");
            assert.equal(insights.hasData, true);
            assert.equal(insights.hasComparisonData, true);

            // 2. Summary verification
            assert.equal(insights.summary.totalSpent, 1200);
            assert.equal(insights.summary.transactionCount, 24);
            assert.equal(insights.summary.averageTransactionAmount, 50); // 1200 / 24

            // 3. MoM Comparison verification
            assert.equal(insights.momComparison.currentTotal, 1200);
            assert.equal(insights.momComparison.previousTotal, 1000);
            assert.equal(insights.momComparison.deltaAmount, 200);
            assert.equal(insights.momComparison.percentageChange, 20.0);
            assert.equal(insights.momComparison.direction, "INCREASED");
            assert.ok(insights.momComparison.explanation.includes("increased by $200.00 (+20%)"));

            // 4. Category ranking & deltas verification
            assert.equal(insights.categoryInsights.topCategories[0].category, Category.FOOD);
            assert.equal(insights.categoryInsights.topCategories[0].amount, 500);

            // Increases: FOOD (+100), SHOPPING (+80), SUBSCRIPTION (+20)
            const increases = insights.categoryInsights.categoryDeltas.increases;
            assert.equal(increases.length, 3);
            assert.equal(increases[0].category, Category.FOOD);
            assert.equal(increases[0].deltaAmount, 100);
            assert.equal(increases[1].category, Category.SHOPPING);
            assert.equal(increases[1].deltaAmount, 80);

            // 5. Tier breakdown verification & strict UNCLASSIFIED isolation
            assert.equal(insights.tierBreakdown.essential.amount, 800);
            assert.equal(insights.tierBreakdown.discretionary.totalAmount, 350); // 200 + 150
            assert.equal(insights.tierBreakdown.discretionary.goodToHaveAmount, 200);
            assert.equal(insights.tierBreakdown.discretionary.luxuryAmount, 150);
            assert.equal(insights.tierBreakdown.unclassified.amount, 50);

            // Invariant: sum of all three tiers equals total spent
            assert.equal(
                insights.tierBreakdown.essential.amount +
                insights.tierBreakdown.discretionary.totalAmount +
                insights.tierBreakdown.unclassified.amount,
                1200
            );

            // Ratio: 350 / 800 = 0.44
            assert.equal(insights.tierBreakdown.discretionaryToEssentialRatio, 0.44);

            // 6. Largest transactions verification
            assert.equal(insights.largestTransactions.length, 2);
            assert.equal(insights.largestTransactions[0].id, 101);
            assert.equal(insights.largestTransactions[0].amount, 300);
            assert.equal(insights.largestTransactions[0].percentageOfTotal, 25.0); // 300 / 1200 = 25%

            // 7. Savings opportunities verification
            assert.ok(insights.savingsOpportunities.length >= 3);
            const subOpp = insights.savingsOpportunities.find((o) => o.type === "SUBSCRIPTION");
            assert.ok(subOpp);
            assert.ok(subOpp.fact.includes("Spent $100.00 across 4 recurring subscription transaction(s)"));
            assert.equal(subOpp.potentialSavings, 20.0);

            const largeTxOpp = insights.savingsOpportunities.find((o) => o.type === "HIGH_CONCENTRATION");
            assert.ok(largeTxOpp);
            assert.ok(largeTxOpp.fact.includes("25% of total spend"));

            const unclassOpp = insights.savingsOpportunities.find((o) => o.type === "UNCLASSIFIED_REVIEW");
            assert.ok(unclassOpp);
            assert.ok(unclassOpp.fact.includes("$50.00 across 2 transaction(s)"));

            // 8. Provenance verification
            assert.equal(insights.provenance.source, "Finance One Ledger");
            assert.deepEqual(insights.provenance.recordTypesIncluded, ["EXPENSE"]);
            assert.deepEqual(insights.provenance.recordTypesExcluded, ["INCOME", "TRANSFER", "BALANCE_SUMMARY"]);
        } finally {
            prisma.transaction.aggregate = origAggregate;
            prisma.transaction.count = origCount;
            prisma.transaction.groupBy = origGroupBy;
            prisma.transaction.findMany = origFindMany;
        }
    });

    it("handles brand new user with zero transactions gracefully (empty state)", async () => {
        const origAggregate = prisma.transaction.aggregate;
        const origCount = prisma.transaction.count;
        const origGroupBy = prisma.transaction.groupBy;
        const origFindMany = prisma.transaction.findMany;

        try {
            (prisma.transaction as any).aggregate = async () => ({ _sum: { amount: null } });
            (prisma.transaction as any).count = async () => 0;
            (prisma.transaction as any).groupBy = async () => [];
            (prisma.transaction as any).findMany = async () => [];

            const insights = await getMonthlyInsights(99, { month: "2026-05" });

            assert.equal(insights.hasData, false);
            assert.equal(insights.hasComparisonData, false);
            assert.equal(insights.summary.totalSpent, 0);
            assert.equal(insights.summary.transactionCount, 0);
            assert.equal(insights.summary.averageTransactionAmount, 0);
            assert.equal(insights.momComparison.direction, "UNCHANGED");
            assert.equal(insights.momComparison.percentageChange, null);
            assert.equal(insights.categoryInsights.topCategories.length, 0);
            assert.equal(insights.largestTransactions.length, 0);
            assert.equal(insights.savingsOpportunities.length, 0);
            assert.ok(insights.momComparison.explanation.includes("No expense transactions recorded"));
        } finally {
            prisma.transaction.aggregate = origAggregate;
            prisma.transaction.count = origCount;
            prisma.transaction.groupBy = origGroupBy;
            prisma.transaction.findMany = origFindMany;
        }
    });

    it("handles first month user with no comparison data (zero prior history)", async () => {
        const origAggregate = prisma.transaction.aggregate;
        const origCount = prisma.transaction.count;
        const origGroupBy = prisma.transaction.groupBy;
        const origFindMany = prisma.transaction.findMany;

        try {
            (prisma.transaction as any).aggregate = async ({ where }: any) => {
                const isCurrent = where.transactionDate.gte.toISOString().includes("2026-09-01");
                return {
                    _sum: {
                        amount: isCurrent ? new Prisma.Decimal("600.00") : null,
                    },
                };
            };
            (prisma.transaction as any).count = async ({ where }: any) => {
                const isCurrent = where.transactionDate.gte.toISOString().includes("2026-09-01");
                return isCurrent ? 12 : 0;
            };
            (prisma.transaction as any).groupBy = async ({ by, where }: any) => {
                const isCurrent = where.transactionDate.gte.toISOString().includes("2026-09-01");
                if (!isCurrent) return [];
                if (by.includes("category")) {
                    return [{ category: Category.FOOD, _sum: { amount: new Prisma.Decimal("600.00") }, _count: { id: 12 } }];
                }
                if (by.includes("priority")) {
                    return [{ priority: Priority.ESSENTIAL, _sum: { amount: new Prisma.Decimal("600.00") }, _count: { id: 12 } }];
                }
                return [];
            };
            (prisma.transaction as any).findMany = async () => [];

            const insights = await getMonthlyInsights(77, { month: "2026-09" });

            assert.equal(insights.hasData, true);
            assert.equal(insights.hasComparisonData, false);
            assert.equal(insights.summary.totalSpent, 600);
            assert.equal(insights.momComparison.direction, "NO_PREVIOUS_DATA");
            assert.equal(insights.momComparison.percentageChange, null);
            assert.ok(insights.momComparison.explanation.includes("First recorded month"));
        } finally {
            prisma.transaction.aggregate = origAggregate;
            prisma.transaction.count = origCount;
            prisma.transaction.groupBy = origGroupBy;
            prisma.transaction.findMany = origFindMany;
        }
    });
});

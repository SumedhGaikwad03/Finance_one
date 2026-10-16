import { Prisma } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import { Category, Priority } from "../generated/prisma/enums";
import {
    MonthlyInsightsQuery,
    MonthlyInsightsQueryInput,
    monthlyInsightsQuerySchema,
    MonthlyInsightsResponse,
    CategorySpendSummary,
    CategoryDeltaSummary,
    TopTransactionItem,
    SavingsOpportunity,
} from "../schemas/insights.schema";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const CATEGORY_DISPLAY_NAMES: Record<Category, string> = {
    FOOD: "Food & Dining",
    SHOPPING: "Shopping",
    FUEL: "Fuel & Transport",
    BILLS: "Bills & Utilities",
    ENTERTAINMENT: "Entertainment",
    HEALTH: "Health & Care",
    TRAVEL: "Travel & Vacations",
    EDUCATION: "Education",
    SUBSCRIPTION: "Subscriptions",
    GIFT: "Gifts & Donations",
    OTHER: "Other / Misc",
};

const round2 = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;
const round1 = (num: number): number => Math.round((num + Number.EPSILON) * 10) / 10;

export const formatMonthLabel = (year: number, monthZeroIndexed: number): string => {
    return `${MONTH_NAMES[monthZeroIndexed]} ${year}`;
};

export const getMonthDateBoundaries = (
    year: number,
    monthZeroIndexed: number
): { startDate: Date; endDate: Date; daysInMonth: number } => {
    const startDate = new Date(Date.UTC(year, monthZeroIndexed, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthZeroIndexed + 1, 0, 23, 59, 59, 999));
    const daysInMonth = new Date(Date.UTC(year, monthZeroIndexed + 1, 0)).getUTCDate();
    return { startDate, endDate, daysInMonth };
};

export const parseMonthQuery = (
    monthQuery?: string
): {
    year: number;
    monthIndex: number;
    selectedMonthString: string;
    prevYear: number;
    prevMonthIndex: number;
    prevMonthString: string;
} => {
    const now = new Date();
    let year = now.getUTCFullYear();
    let monthIndex = now.getUTCMonth();

    if (monthQuery && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthQuery)) {
        const [yStr, mStr] = monthQuery.split("-");
        year = parseInt(yStr, 10);
        monthIndex = parseInt(mStr, 10) - 1;
    }

    const selectedMonthString = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevMonthString = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, "0")}`;

    return {
        year,
        monthIndex,
        selectedMonthString,
        prevYear,
        prevMonthIndex,
        prevMonthString,
    };
};

export const getMonthlyInsights = async (
    userId: number,
    rawQuery: Partial<MonthlyInsightsQueryInput> = {}
): Promise<MonthlyInsightsResponse> => {
    const query = monthlyInsightsQuerySchema.parse(rawQuery);
    const {
        year,
        monthIndex,
        selectedMonthString,
        prevYear,
        prevMonthIndex,
        prevMonthString,
    } = parseMonthQuery(query.month);

    const { startDate, endDate, daysInMonth } = getMonthDateBoundaries(year, monthIndex);
    const {
        startDate: prevStartDate,
        endDate: prevEndDate,
        daysInMonth: prevDaysInMonth,
    } = getMonthDateBoundaries(prevYear, prevMonthIndex);

    const now = new Date();
    const isCurrentMonth = now.getUTCFullYear() === year && now.getUTCMonth() === monthIndex;
    const daysElapsed = isCurrentMonth ? Math.min(now.getUTCDate(), daysInMonth) : daysInMonth;

    const monthLabel = formatMonthLabel(year, monthIndex);
    const prevMonthLabel = formatMonthLabel(prevYear, prevMonthIndex);

    const currentWhere: Prisma.TransactionWhereInput = {
        userId,
        transactionDate: {
            gte: startDate,
            lte: endDate,
        },
    };

    const prevWhere: Prisma.TransactionWhereInput = {
        userId,
        transactionDate: {
            gte: prevStartDate,
            lte: prevEndDate,
        },
    };

    // Parallel deterministic queries to PostgreSQL
    const [
        currentSumResult,
        currentCount,
        currentCategoryGroups,
        currentPriorityGroups,
        largestTransactionsRaw,
        prevSumResult,
        prevCount,
        prevCategoryGroups,
        prevPriorityGroups,
    ] = await Promise.all([
        prisma.transaction.aggregate({
            _sum: { amount: true },
            where: currentWhere,
        }),
        prisma.transaction.count({ where: currentWhere }),
        prisma.transaction.groupBy({
            by: ["category"],
            _sum: { amount: true },
            _count: { id: true },
            where: currentWhere,
        }),
        prisma.transaction.groupBy({
            by: ["priority"],
            _sum: { amount: true },
            _count: { id: true },
            where: currentWhere,
        }),
        prisma.transaction.findMany({
            where: currentWhere,
            orderBy: { amount: "desc" },
            take: 5,
        }),
        prisma.transaction.aggregate({
            _sum: { amount: true },
            where: prevWhere,
        }),
        prisma.transaction.count({ where: prevWhere }),
        prisma.transaction.groupBy({
            by: ["category"],
            _sum: { amount: true },
            _count: { id: true },
            where: prevWhere,
        }),
        prisma.transaction.groupBy({
            by: ["priority"],
            _sum: { amount: true },
            _count: { id: true },
            where: prevWhere,
        }),
    ]);

    const totalSpent = currentSumResult._sum.amount
        ? round2(Number(currentSumResult._sum.amount))
        : 0;
    const prevTotalSpent = prevSumResult._sum.amount
        ? round2(Number(prevSumResult._sum.amount))
        : 0;

    const hasData = currentCount > 0;
    const hasComparisonData = prevCount > 0;

    // Summary calculations
    const averageTransactionAmount = hasData
        ? round2(totalSpent / currentCount)
        : 0;
    const dailyAverageSpend = hasData
        ? round2(totalSpent / Math.max(1, daysElapsed))
        : 0;
    const projectedMonthEndSpend =
        isCurrentMonth && daysElapsed < daysInMonth && hasData
            ? round2(dailyAverageSpend * daysInMonth)
            : null;

    // Month-over-Month comparison
    const deltaAmount = round2(totalSpent - prevTotalSpent);
    let percentageChange: number | null = null;
    let direction: "INCREASED" | "DECREASED" | "UNCHANGED" | "NO_PREVIOUS_DATA" = "UNCHANGED";

    if (!hasComparisonData) {
        direction = hasData ? "NO_PREVIOUS_DATA" : "UNCHANGED";
        percentageChange = null;
    } else {
        if (prevTotalSpent > 0) {
            percentageChange = round1(((totalSpent - prevTotalSpent) / prevTotalSpent) * 100);
        }
        if (deltaAmount > 0) {
            direction = "INCREASED";
        } else if (deltaAmount < 0) {
            direction = "DECREASED";
        } else {
            direction = "UNCHANGED";
        }
    }

    const prevDailyAverage = hasComparisonData
        ? round2(prevTotalSpent / Math.max(1, prevDaysInMonth))
        : 0;
    const dailyDelta = round2(dailyAverageSpend - prevDailyAverage);

    let momExplanation = "";
    if (!hasData && !hasComparisonData) {
        momExplanation = `No expense transactions recorded for ${monthLabel} or ${prevMonthLabel}.`;
    } else if (!hasComparisonData) {
        momExplanation = `First recorded month with $${totalSpent.toFixed(2)} in total spend across ${currentCount} transaction(s). Prior period comparison will activate when historical transactions are available.`;
    } else if (direction === "INCREASED") {
        momExplanation = `Spending increased by $${Math.abs(deltaAmount).toFixed(2)} (+${percentageChange ?? 0}%) compared to ${prevMonthLabel} ($${prevTotalSpent.toFixed(2)}). Average daily spend is $${dailyAverageSpend.toFixed(2)}/day vs $${prevDailyAverage.toFixed(2)}/day previously.`;
    } else if (direction === "DECREASED") {
        momExplanation = `Spending decreased by $${Math.abs(deltaAmount).toFixed(2)} (${percentageChange ?? 0}%) compared to ${prevMonthLabel} ($${prevTotalSpent.toFixed(2)}). Average daily spend dropped by $${Math.abs(dailyDelta).toFixed(2)}/day.`;
    } else {
        momExplanation = `Spending is exactly unchanged compared to ${prevMonthLabel} at $${totalSpent.toFixed(2)}.`;
    }

    // Category mappings
    const currentCategoryMap = new Map<Category, { amount: number; count: number }>();
    for (const g of currentCategoryGroups) {
        const amt = g._sum.amount ? round2(Number(g._sum.amount)) : 0;
        currentCategoryMap.set(g.category, { amount: amt, count: g._count.id });
    }

    const prevCategoryMap = new Map<Category, { amount: number; count: number }>();
    for (const g of prevCategoryGroups) {
        const amt = g._sum.amount ? round2(Number(g._sum.amount)) : 0;
        prevCategoryMap.set(g.category, { amount: amt, count: g._count.id });
    }

    // Top categories for current month
    const topCategories: CategorySpendSummary[] = Array.from(currentCategoryMap.entries())
        .map(([category, { amount, count }]) => ({
            category,
            displayName: CATEGORY_DISPLAY_NAMES[category] || category,
            amount,
            percentage: totalSpent > 0 ? round1((amount / totalSpent) * 100) : 0,
            transactionCount: count,
        }))
        .sort((a, b) => b.amount - a.amount);

    // Category deltas (increases and decreases)
    const allCategories = new Set<Category>([
        ...Array.from(currentCategoryMap.keys()),
        ...Array.from(prevCategoryMap.keys()),
    ]);

    const categoryDeltasRaw: CategoryDeltaSummary[] = [];
    for (const cat of allCategories) {
        const curr = currentCategoryMap.get(cat) || { amount: 0, count: 0 };
        const prev = prevCategoryMap.get(cat) || { amount: 0, count: 0 };
        const diff = round2(curr.amount - prev.amount);

        let pctChange: number | null = null;
        let trend: "INCREASED" | "DECREASED" | "UNCHANGED" | "NEW" | "DROPPED" = "UNCHANGED";

        if (prev.amount === 0 && curr.amount > 0) {
            trend = "NEW";
            pctChange = null;
        } else if (curr.amount === 0 && prev.amount > 0) {
            trend = "DROPPED";
            pctChange = -100;
        } else if (prev.amount > 0) {
            pctChange = round1(((curr.amount - prev.amount) / prev.amount) * 100);
            if (diff > 0) trend = "INCREASED";
            else if (diff < 0) trend = "DECREASED";
            else trend = "UNCHANGED";
        }

        categoryDeltasRaw.push({
            category: cat,
            displayName: CATEGORY_DISPLAY_NAMES[cat] || cat,
            currentAmount: curr.amount,
            previousAmount: prev.amount,
            deltaAmount: diff,
            percentageChange: pctChange,
            trend,
        });
    }

    const categoryIncreases = categoryDeltasRaw
        .filter((d) => d.deltaAmount > 0)
        .sort((a, b) => b.deltaAmount - a.deltaAmount);

    const categoryDecreases = categoryDeltasRaw
        .filter((d) => d.deltaAmount < 0)
        .sort((a, b) => a.deltaAmount - b.deltaAmount); // largest drops first (most negative)

    const categoryExplanation =
        topCategories.length > 0
            ? `Top spending category is ${topCategories[0].displayName} with $${topCategories[0].amount.toFixed(2)} (${topCategories[0].percentage}% of monthly spend).`
            : "No category spending recorded for this period.";

    // Spending Tier Breakdown
    // Contract: ESSENTIAL vs Discretionary (GOOD_TO_HAVE + LUXURY) vs UNCLASSIFIED.
    const priorityMap = new Map<Priority, { amount: number; count: number }>();
    for (const p of currentPriorityGroups) {
        const amt = p._sum.amount ? round2(Number(p._sum.amount)) : 0;
        priorityMap.set(p.priority, { amount: amt, count: p._count.id });
    }

    const essentialAmt = priorityMap.get(Priority.ESSENTIAL)?.amount || 0;
    const essentialCount = priorityMap.get(Priority.ESSENTIAL)?.count || 0;

    const goodToHaveAmt = priorityMap.get(Priority.GOOD_TO_HAVE)?.amount || 0;
    const goodToHaveCount = priorityMap.get(Priority.GOOD_TO_HAVE)?.count || 0;

    const luxuryAmt = priorityMap.get(Priority.LUXURY)?.amount || 0;
    const luxuryCount = priorityMap.get(Priority.LUXURY)?.count || 0;

    const unclassifiedAmt = priorityMap.get(Priority.UNCLASSIFIED)?.amount || 0;
    const unclassifiedCount = priorityMap.get(Priority.UNCLASSIFIED)?.count || 0;

    const discretionaryTotalAmt = round2(goodToHaveAmt + luxuryAmt);
    const discretionaryTotalCount = goodToHaveCount + luxuryCount;

    const classifiedSpendTotal = round2(essentialAmt + discretionaryTotalAmt);
    const discretionaryToEssentialRatio =
        essentialAmt > 0 ? round2(discretionaryTotalAmt / essentialAmt) : null;

    let tierExplanation = "";
    if (totalSpent === 0) {
        tierExplanation = "No expenses recorded to evaluate spending tier allocation.";
    } else {
        const parts = [
            `Essential needs comprise $${essentialAmt.toFixed(2)} (${totalSpent > 0 ? round1((essentialAmt / totalSpent) * 100) : 0}%).`,
            `Discretionary spending (Good to Have + Luxury) totals $${discretionaryTotalAmt.toFixed(2)} (${totalSpent > 0 ? round1((discretionaryTotalAmt / totalSpent) * 100) : 0}%).`,
        ];
        if (unclassifiedAmt > 0) {
            parts.push(
                `Note: $${unclassifiedAmt.toFixed(2)} (${round1((unclassifiedAmt / totalSpent) * 100)}%) remains Unclassified and is kept isolated from essential and discretionary totals.`
            );
        }
        tierExplanation = parts.join(" ");
    }

    const tierBreakdown = {
        essential: {
            amount: essentialAmt,
            percentage: totalSpent > 0 ? round1((essentialAmt / totalSpent) * 100) : 0,
            transactionCount: essentialCount,
        },
        discretionary: {
            amount: discretionaryTotalAmt,
            totalAmount: discretionaryTotalAmt,
            percentage: totalSpent > 0 ? round1((discretionaryTotalAmt / totalSpent) * 100) : 0,
            transactionCount: discretionaryTotalCount,
            goodToHaveAmount: goodToHaveAmt,
            goodToHavePercentage: totalSpent > 0 ? round1((goodToHaveAmt / totalSpent) * 100) : 0,
            goodToHaveCount,
            luxuryAmount: luxuryAmt,
            luxuryPercentage: totalSpent > 0 ? round1((luxuryAmt / totalSpent) * 100) : 0,
            luxuryCount,
        },
        unclassified: {
            amount: unclassifiedAmt,
            percentage: totalSpent > 0 ? round1((unclassifiedAmt / totalSpent) * 100) : 0,
            transactionCount: unclassifiedCount,
        },
        discretionaryToEssentialRatio,
        classifiedSpendTotal,
        explanation: tierExplanation,
    };

    // Largest Transactions
    const largestTransactions: TopTransactionItem[] = largestTransactionsRaw.map((tx) => {
        const amt = round2(Number(tx.amount));
        return {
            id: tx.id,
            title: tx.title,
            amount: amt,
            category: tx.category,
            priority: tx.priority,
            transactionDate: tx.transactionDate.toISOString(),
            percentageOfTotal: totalSpent > 0 ? round1((amt / totalSpent) * 100) : 0,
        };
    });

    // Savings Opportunities (Deterministic, fact-grounded recommendations)
    const savingsOpportunities: SavingsOpportunity[] = [];

    // 1. Subscription recurring spend audit
    const subData = currentCategoryMap.get(Category.SUBSCRIPTION);
    if (subData && subData.amount > 0) {
        const potentialMonthlySavings = round2(subData.amount * 0.20);
        savingsOpportunities.push({
            id: "savings-subscription-audit",
            type: "SUBSCRIPTION",
            title: "Recurring Subscriptions Review",
            fact: `Spent $${subData.amount.toFixed(2)} across ${subData.count} recurring subscription transaction(s) in ${monthLabel}. Annual run-rate is $${(subData.amount * 12).toFixed(2)}.`,
            suggestion: `Audit recurring active subscriptions to cancel unneeded memberships or switch active tools to annual billing for an estimated 15–20% discount.`,
            potentialSavings: potentialMonthlySavings > 0 ? potentialMonthlySavings : null,
            relevantCategory: Category.SUBSCRIPTION,
            relevantAmount: subData.amount,
        });
    }

    // 2. Luxury spending review
    const prevLuxuryAmt = prevPriorityGroups.find((p) => p.priority === Priority.LUXURY)?._sum.amount;
    const prevLuxuryNum = prevLuxuryAmt ? round2(Number(prevLuxuryAmt)) : 0;
    const luxuryDelta = round2(luxuryAmt - prevLuxuryNum);

    if (luxuryAmt > 0 && (tierBreakdown.discretionary.luxuryPercentage >= 15 || luxuryDelta > 0)) {
        savingsOpportunities.push({
            id: "savings-luxury-spend",
            type: "LUXURY_SURGE",
            title: "Discretionary Luxury Optimization",
            fact: `Luxury tier expenses totaled $${luxuryAmt.toFixed(2)} (${tierBreakdown.discretionary.luxuryPercentage}% of monthly spend)${luxuryDelta > 0 && hasComparisonData ? `, an increase of $${luxuryDelta.toFixed(2)} over ${prevMonthLabel}` : ""}.`,
            suggestion: `Trimming non-essential luxury purchases provides direct cash flow savings without affecting essential living obligations.`,
            potentialSavings: round2(luxuryAmt * 0.25),
            relevantCategory: null,
            relevantAmount: luxuryAmt,
        });
    }

    // 3. Category spending surge
    if (categoryIncreases.length > 0 && categoryIncreases[0].deltaAmount >= 50) {
        const surge = categoryIncreases[0];
        savingsOpportunities.push({
            id: `savings-surge-${surge.category.toLowerCase()}`,
            type: "CATEGORY_SURGE",
            title: `${surge.displayName} Spending Surge`,
            fact: `Spending in ${surge.displayName} rose by $${surge.deltaAmount.toFixed(2)} (${surge.percentageChange !== null ? `+${surge.percentageChange}%` : "new spend"}) compared to ${prevMonthLabel}.`,
            suggestion: `Review transactions in ${surge.displayName} to verify if this surge was an isolated one-off expense or requires a revised budget cap.`,
            potentialSavings: round2(surge.deltaAmount),
            relevantCategory: surge.category,
            relevantAmount: surge.deltaAmount,
        });
    }

    // 4. High single transaction concentration
    if (largestTransactions.length > 0 && largestTransactions[0].percentageOfTotal >= 20 && totalSpent > 0) {
        const topTx = largestTransactions[0];
        const dateStr = topTx.transactionDate.split("T")[0];
        savingsOpportunities.push({
            id: `savings-large-tx-${topTx.id}`,
            type: "HIGH_CONCENTRATION",
            title: "Large Single Purchase Concentration",
            fact: `Your single largest purchase was $${topTx.amount.toFixed(2)} (${topTx.title || "Untitled"}, ${topTx.category}) on ${dateStr}, representing ${topTx.percentageOfTotal}% of total spend this month.`,
            suggestion: `Plan ahead for major individual outlays with Dedicated Sinking Funds to avoid spikes in monthly cash outflows.`,
            potentialSavings: null,
            relevantCategory: topTx.category,
            relevantAmount: topTx.amount,
        });
    }

    // 5. Unclassified transactions review
    if (unclassifiedAmt > 0 && unclassifiedCount > 0) {
        savingsOpportunities.push({
            id: "savings-unclassified-review",
            type: "UNCLASSIFIED_REVIEW",
            title: "Unclassified Transactions Action",
            fact: `$${unclassifiedAmt.toFixed(2)} across ${unclassifiedCount} transaction(s) (${tierBreakdown.unclassified.percentage}% of total spend) is currently Unclassified.`,
            suggestion: `Assign spending tiers (Essential, Good to Have, or Luxury) to these transactions in your ledger to unlock complete discretionary budgeting visibility.`,
            potentialSavings: null,
            relevantCategory: null,
            relevantAmount: unclassifiedAmt,
        });
    }

    // Provenance object detailing metadata
    const provenance = {
        source: "Finance One Ledger",
        recordTypesIncluded: ["EXPENSE"],
        recordTypesExcluded: ["INCOME", "TRANSFER", "BALANCE_SUMMARY"],
        calculationMethod: "Deterministic SQL ledger aggregation using UTC calendar month boundaries",
        comparisonWindow: `${monthLabel} vs ${prevMonthLabel}`,
    };

    return {
        period: {
            selectedMonth: selectedMonthString,
            monthLabel,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            daysInMonth,
            daysElapsed,
            isCurrentMonth,
        },
        comparisonPeriod: {
            selectedMonth: prevMonthString,
            monthLabel: prevMonthLabel,
            startDate: prevStartDate.toISOString(),
            endDate: prevEndDate.toISOString(),
            daysInMonth: prevDaysInMonth,
        },
        summary: {
            totalSpent,
            transactionCount: currentCount,
            averageTransactionAmount,
            dailyAverageSpend,
            projectedMonthEndSpend,
        },
        momComparison: {
            currentTotal: totalSpent,
            previousTotal: prevTotalSpent,
            deltaAmount,
            percentageChange,
            direction,
            spendVelocity: {
                currentDailyAverage: dailyAverageSpend,
                previousDailyAverage: prevDailyAverage,
                dailyDelta,
            },
            explanation: momExplanation,
        },
        categoryInsights: {
            topCategories,
            categoryDeltas: {
                increases: categoryIncreases,
                decreases: categoryDecreases,
            },
            explanation: categoryExplanation,
        },
        tierBreakdown,
        largestTransactions,
        savingsOpportunities,
        provenance,
        hasData,
        hasComparisonData,
    };
};

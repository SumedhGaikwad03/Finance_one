import { z } from "zod";
import { Category, Priority } from "../generated/prisma/enums";

export const monthlyInsightsQuerySchema = z.object({
    month: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be formatted as YYYY-MM")
        .optional(),
    timezone: z.string().optional().default("UTC"),
});

export type MonthlyInsightsQuery = z.infer<typeof monthlyInsightsQuerySchema>;
export type MonthlyInsightsQueryInput = z.input<typeof monthlyInsightsQuerySchema>;

export interface CategorySpendSummary {
    category: Category;
    displayName: string;
    amount: number;
    percentage: number;
    transactionCount: number;
}

export interface CategoryDeltaSummary {
    category: Category;
    displayName: string;
    currentAmount: number;
    previousAmount: number;
    deltaAmount: number;
    percentageChange: number | null;
    trend: "INCREASED" | "DECREASED" | "UNCHANGED" | "NEW" | "DROPPED";
}

export interface SpendingTierDetail {
    amount: number;
    percentage: number;
    transactionCount: number;
}

export interface DiscretionaryTierDetail extends SpendingTierDetail {
    totalAmount: number;
    goodToHaveAmount: number;
    goodToHavePercentage: number;
    goodToHaveCount: number;
    luxuryAmount: number;
    luxuryPercentage: number;
    luxuryCount: number;
}

export interface SpendingTierBreakdown {
    essential: SpendingTierDetail;
    discretionary: DiscretionaryTierDetail;
    unclassified: SpendingTierDetail;
    discretionaryToEssentialRatio: number | null;
    classifiedSpendTotal: number;
    explanation: string;
}

export interface TopTransactionItem {
    id: number;
    title: string | null;
    amount: number;
    category: Category;
    priority: Priority;
    transactionDate: string;
    percentageOfTotal: number;
}

export type SavingsOpportunityType =
    | "SUBSCRIPTION"
    | "LUXURY_SURGE"
    | "CATEGORY_SURGE"
    | "HIGH_CONCENTRATION"
    | "UNCLASSIFIED_REVIEW";

export interface SavingsOpportunity {
    id: string;
    type: SavingsOpportunityType;
    title: string;
    fact: string;
    suggestion: string;
    potentialSavings: number | null;
    relevantCategory: Category | null;
    relevantAmount: number | null;
}

export interface MonthlyInsightsResponse {
    period: {
        selectedMonth: string; // YYYY-MM
        monthLabel: string; // e.g. "August 2026"
        startDate: string; // ISO
        endDate: string; // ISO
        daysInMonth: number;
        daysElapsed: number;
        isCurrentMonth: boolean;
    };
    comparisonPeriod: {
        selectedMonth: string; // YYYY-MM
        monthLabel: string; // e.g. "July 2026"
        startDate: string; // ISO
        endDate: string; // ISO
        daysInMonth: number;
    };
    summary: {
        totalSpent: number;
        transactionCount: number;
        averageTransactionAmount: number;
        dailyAverageSpend: number;
        projectedMonthEndSpend: number | null;
    };
    momComparison: {
        currentTotal: number;
        previousTotal: number;
        deltaAmount: number;
        percentageChange: number | null;
        direction: "INCREASED" | "DECREASED" | "UNCHANGED" | "NO_PREVIOUS_DATA";
        spendVelocity: {
            currentDailyAverage: number;
            previousDailyAverage: number;
            dailyDelta: number;
        };
        explanation: string;
    };
    categoryInsights: {
        topCategories: CategorySpendSummary[];
        categoryDeltas: {
            increases: CategoryDeltaSummary[];
            decreases: CategoryDeltaSummary[];
        };
        explanation: string;
    };
    tierBreakdown: SpendingTierBreakdown;
    largestTransactions: TopTransactionItem[];
    savingsOpportunities: SavingsOpportunity[];
    provenance: {
        source: string;
        recordTypesIncluded: string[];
        recordTypesExcluded: string[];
        calculationMethod: string;
        comparisonWindow: string;
    };
    hasData: boolean;
    hasComparisonData: boolean;
}

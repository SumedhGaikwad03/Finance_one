import type { Transaction, TransactionCategory, TransactionPriority } from "./dashboard.types";

export type TimePeriodOption =
    | "THIS_MONTH"
    | "LAST_MONTH"
    | "LAST_3_MONTHS"
    | "LAST_6_MONTHS"
    | "THIS_YEAR"
    | "LAST_7_DAYS"
    | "LAST_30_DAYS"
    | "ALL_TIME";

export type AggregationView =
    | "TOTAL"
    | "DAILY"
    | "WEEKLY"
    | "MONTHLY"
    | "CATEGORY_BREAKDOWN"
    | "TRANSACTION_LIST";

export type VisualizationType = "CHART" | "TABLE" | "SUMMARY";

export type ExplorationGoal =
    | "WHERE_SPENT"
    | "HOW_CHANGING"
    | "HIGHEST_EXPENSES"
    | "BUDGET_TRACKING"
    | "CUSTOM";

export interface FinanceQuery {
    id?: string;
    rawPrompt?: string;
    goal?: ExplorationGoal;
    category?: TransactionCategory | null;
    categories?: TransactionCategory[];
    priority?: TransactionPriority | null;
    timePeriod: TimePeriodOption;
    startDate?: string;
    endDate?: string;
    aggregation: AggregationView;
    visualization: VisualizationType;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    limit?: number;
}

export type QueryBuilderStep =
    | "SELECT_GOAL"
    | "INITIAL"
    | "SELECT_CATEGORY"
    | "SELECT_PERIOD"
    | "SELECT_VIEW"
    | "CONFIRMATION"
    | "EXECUTING"
    | "RESULTS";

export interface QuerySuggestion {
    id: string;
    title: string;
    description: string;
    icon: string;
    initialQuery: Partial<FinanceQuery>;
    autoConfirm?: boolean;
}

export interface AggregatedDataPoint {
    label: string;
    dateKey: string;
    amount: number;
    count: number;
}

export interface CategoryBreakdownItem {
    category: TransactionCategory;
    label: string;
    icon: string;
    amount: number;
    percentage: number;
}

export interface QueryExecutionResult {
    query: FinanceQuery;
    transactions: Transaction[];
    totalSpent: number;
    transactionCount: number;
    averageAmount: number;
    highestAmount: number;
    lowestAmount: number;
    highestPeriod?: { label: string; amount: number };
    lowestPeriod?: { label: string; amount: number };
    chartData: AggregatedDataPoint[];
    categoryBreakdown?: CategoryBreakdownItem[];
    summaryText: string;
}

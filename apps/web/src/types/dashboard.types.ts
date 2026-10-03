// we define varibles and interfaces that wd eventullay use in our dashboard
// this is a frontend file

export interface Budget {

    id: number;

    amount: string;

    periodType: string;

    startDate: string;

    isLocked: boolean;

}

export interface Transaction {

    id: number;

    title: string | null;

    amount: string;

    category: TransactionCategory;

    priority: TransactionPriority;

    notes : string  | null ; 

    transactionDate: string ;

}

export interface CreateTransactionRequest {

    amount: number;

    category: TransactionCategory;

    priority: TransactionPriority;

    title?: string;

    notes?: string;

    transactionDate?: string;

}

export interface QuickTransactionRequest {
    text: string;
    amount?: number;
    category?: TransactionCategory;
    priority?: TransactionPriority;
    title?: string;
    notes?: string;
    transactionDate?: string;
}

export interface ParsedTransactionResponse {
    amount: number | null;
    title: string;
    category: TransactionCategory;
    priority: TransactionPriority;
    transactionDate: string;
    notes?: string;
    rawText: string;
    confidence: number;
    extractedFields: {
        amountDetected: boolean;
        categoryDetected: boolean;
        priorityDetected: boolean;
        dateDetected: boolean;
    };
}

export interface DashboardResponse {

    // A user can have transactions without having an active budget.
    budget: Budget | null;

    recentTransactions: Transaction[];

    totalSpent: string;

    // These values depend on an active budget existing.
    remainingBudget: string | null;

    budgetUsage: number | null;

    categoryTotals: Record<string, string>;

    priorityTotals: Record<string, string>;

    transactionCount: number;

    largestTransaction: Transaction | null;

}

export type TransactionCategory =
    | "FOOD"
    | "FUEL"
    | "SHOPPING"
    | "BILLS"
    | "ENTERTAINMENT"
    | "HEALTH"
    | "TRAVEL"
    | "EDUCATION"
    | "SUBSCRIPTION"
    | "GIFT"
    | "OTHER";

export type TransactionPriority =
    | "ESSENTIAL"
    | "GOOD_TO_HAVE"
    | "LUXURY";

export type SortField = "transactionDate" | "amount" | "createdAt";
export type SortDirection = "asc" | "desc";

export interface TransactionQueryParams {
    category?: TransactionCategory | TransactionCategory[];
    categories?: TransactionCategory[];
    priority?: TransactionPriority | TransactionPriority[];
    priorities?: TransactionPriority[];
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: SortField;
    sortDirection?: SortDirection;
}

export interface TransactionQuery {
    categories?: TransactionCategory[];
    priorities?: TransactionPriority[];
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: SortField;
    sortDirection?: SortDirection;
}
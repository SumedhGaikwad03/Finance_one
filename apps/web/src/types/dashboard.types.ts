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
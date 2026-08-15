// we define varibles and interfaces that wd eventullay use in our dashboard 

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

    category: string;

    priority: string;

    transactionDate: string ;

}

export interface CreateTransactionRequest {

    amount : number;

    category: string;

    priority: string;

    title?: string;

    notes?: string;

    transactionDate?: string;


}

export interface DashboardResponse {

    budget: Budget;

    recentTransactions: Transaction[];

    totalSpent: string;

    remainingBudget: string;

    budgetUsage: number;

    categoryTotals: Record<string, string>;

    priorityTotals: Record<string, string>;

    transactionCount: number;

    largestTransaction: Transaction | null;

}
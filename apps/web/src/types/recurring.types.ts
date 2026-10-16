export type RecurringFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL" | "IRREGULAR";

export type RecurringType = "SUBSCRIPTION" | "BILL_PAYMENT" | "GENERAL_RECURRING";

export type RecurringConfidence = "HIGH" | "MEDIUM" | "LOW";

export type RecurringStatus = "POSSIBLE" | "CONFIRMED" | "DISMISSED";

export interface RecurringMatchedTransaction {
    id: number;
    amount: number;
    transactionDate: string;
    title: string | null;
    category: string;
    priority: string;
}

export interface RecurringSignals {
    merchantMatchScore: number;
    cadenceRegularityScore: number;
    amountConsistencyScore: number;
    hasMissingIntervals: boolean;
    isSubscriptionCategory: boolean;
    isKnownRecurringMerchant: boolean;
    intervalDaysMedian: number;
    intervalDaysVariance: number;
}

export interface RecurringEvidence {
    explanation: string;
    signals: RecurringSignals;
    matchedTransactions: RecurringMatchedTransaction[];
}

export interface RecurringPattern {
    id: string;
    userId: number;
    merchantName: string;
    normalizedMerchantKey: string;
    sampleNarration: string;
    frequency: RecurringFrequency;
    type: RecurringType;
    category: string;
    priority: string;
    averageAmount: number;
    minAmount: number;
    maxAmount: number;
    lastAmount: number;
    isVariableAmount: boolean;
    amountVariancePercentage: number;
    currency: string;
    confidence: number;
    confidenceLevel: RecurringConfidence;
    status: RecurringStatus;
    transactionCount: number;
    firstPaymentDate: string;
    lastPaymentDate: string;
    estimatedNextDate: string | null;
    evidence: RecurringEvidence;
    userConfirmed?: boolean;
    userDismissed?: boolean;
    userNotes?: string;
}

export interface RecurringDetectionSummary {
    totalDetected: number;
    confirmedCount: number;
    possibleCount: number;
    dismissedCount: number;
    subscriptionsCount: number;
    billsCount: number;
    generalCount: number;
    estimatedMonthlyOutflow: number;
}

export interface RecurringPatternsResponse {
    patterns: RecurringPattern[];
    summary: RecurringDetectionSummary;
}

export interface RecurringQueryOptions {
    status?: RecurringStatus;
    type?: RecurringType;
    frequency?: RecurringFrequency;
    minConfidence?: number;
    includeDismissed?: boolean;
    lookbackMonths?: number;
}

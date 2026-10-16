import { Category, Priority } from "../generated/prisma/enums";

export type RecurringFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL" | "IRREGULAR";

export type RecurringType = "SUBSCRIPTION" | "BILL_PAYMENT" | "GENERAL_RECURRING";

export type RecurringConfidence = "HIGH" | "MEDIUM" | "LOW";

export type RecurringStatus = "POSSIBLE" | "CONFIRMED" | "DISMISSED";

export interface RecurringMatchedTransaction {
    id: number;
    amount: number;
    transactionDate: string; // ISO 8601
    title: string | null;
    category: Category;
    priority: Priority;
}

export interface RecurringSignals {
    merchantMatchScore: number;       // 0.0 to 1.0
    cadenceRegularityScore: number;   // 0.0 to 1.0
    amountConsistencyScore: number;   // 0.0 to 1.0
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
    id: string; // Deterministic hash: e.g. "rec_user_merchant_freq"
    userId: number;
    merchantName: string;
    normalizedMerchantKey: string;
    sampleNarration: string;
    frequency: RecurringFrequency;
    type: RecurringType;
    category: Category;
    priority: Priority;
    averageAmount: number;
    minAmount: number;
    maxAmount: number;
    lastAmount: number;
    isVariableAmount: boolean;
    amountVariancePercentage: number;
    currency: string;
    confidence: number; // 0.0 to 1.0
    confidenceLevel: RecurringConfidence;
    status: RecurringStatus;
    transactionCount: number;
    firstPaymentDate: string; // ISO 8601
    lastPaymentDate: string;  // ISO 8601
    estimatedNextDate: string | null; // ISO 8601 or null if unpredictable
    evidence: RecurringEvidence;
    userConfirmed?: boolean;
    userDismissed?: boolean;
    userNotes?: string;
}

export interface RecurringPatternPreference {
    userId: number;
    patternId: string;
    status: RecurringStatus;
    userNotes?: string;
    updatedAt: string;
}

export interface RecurringDetectionOptions {
    lookbackMonths?: number;
    minTransactions?: number;
    includeDismissed?: boolean;
    minConfidence?: number;
    statusFilter?: RecurringStatus;
    typeFilter?: RecurringType;
    frequencyFilter?: RecurringFrequency;
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

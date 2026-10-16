// this is the file that has our interface for budgets 

import type { BudgetPeriod } from "../constants/budget.constants"; // we use "type " for a complir time code as this is mostly static 
// we use this for oue sake and also this is complete erased during complation 

export interface BudgetCreationRequest {
    amount: number;
    periodType: BudgetPeriod;
    startDate: string;
    isLocked?: boolean;
} 

export interface Budget {
    id: number;
    amount: string;
    periodType: BudgetPeriod;
    startDate: string;
    isLocked: boolean;
}

export type BudgetAlertType = "OVER_BUDGET" | "BUDGET_THRESHOLD" | "CATEGORY_SURGE";
export type AlertSeverity = "info" | "warning" | "critical";

export interface BudgetAlertPeriod {
    startDate: string;
    endDate: string;
    periodType: BudgetPeriod;
    daysRemaining: number;
}

export interface BudgetAlertMetrics {
    budgetAmount: number;
    totalSpent: number;
    remainingBudget: number;
    usagePercentage: number;
    thresholdPercentage?: number;
    category?: string;
    categorySpent?: number;
    baselineSpent?: number;
    surgePercentage?: number;
}

export interface BudgetAlertExplanation {
    reason: string;
    source: string;
    rule: string;
    calculationBreakdown: {
        budgetAmount: number;
        totalSpent: number;
        remainingBudget: number;
        usagePercentage: number;
        baselinePeriod?: {
            startDate: string;
            endDate: string;
        };
        baselineAmount?: number;
        currentAmount?: number;
    };
}

export interface BudgetAlert {
    id: string;
    type: BudgetAlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    period: BudgetAlertPeriod;
    metrics: BudgetAlertMetrics;
    explanation: BudgetAlertExplanation;
    dismissed: boolean;
    createdAt: string;
}

export interface BudgetAlertsResponse {
    hasActiveBudget: boolean;
    activeBudget: {
        id: number;
        amount: number;
        periodType: BudgetPeriod;
        startDate: string;
        isLocked: boolean;
    } | null;
    period: BudgetAlertPeriod | null;
    totalSpent: number;
    remainingBudget: number | null;
    usagePercentage: number | null;
    isOverBudget: boolean;
    alerts: BudgetAlert[];
    historicalBaselinePeriod?: {
        startDate: string;
        endDate: string;
    } | null;
    evaluatedAt: string;
}
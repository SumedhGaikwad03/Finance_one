import { z } from "zod";
import { BudgetPeriod, Category } from "../generated/prisma/enums";

export const BudgetAlertType = {
  OVER_BUDGET: "OVER_BUDGET",
  BUDGET_THRESHOLD: "BUDGET_THRESHOLD",
  CATEGORY_SURGE: "CATEGORY_SURGE",
} as const;

export type BudgetAlertType = (typeof BudgetAlertType)[keyof typeof BudgetAlertType];

export const AlertSeverity = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
} as const;

export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];

export const budgetAlertQuerySchema = z.object({
  thresholds: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [75, 90, 100];
      return val
        .split(",")
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n) && n > 0 && n <= 100)
        .sort((a, b) => a - b);
    }),
  includeDismissed: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((val) => val === "true" || val === "1"),
});

export type BudgetAlertQuery = z.infer<typeof budgetAlertQuerySchema>;

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
  category?: Category;
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

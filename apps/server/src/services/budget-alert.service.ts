import { Category, Prisma } from "../generated/prisma/client";
import * as budgetService from "./budget.service";
import * as transactionRepository from "../repositories/transaction.repository";
import * as analyticsService from "./analytics.services";
import {
  calculateEndDate,
  calculatePreviousPeriod,
  calculateDaysRemaining,
} from "../utils/budget.utils";
import {
  BudgetAlert,
  BudgetAlertsResponse,
  BudgetAlertType,
  AlertSeverity,
} from "../schemas/budget-alert.schema";

// In-memory dismissal store to prevent repeated alert fatigue
// Maps `${userId}:${alertId}` to dismissal epoch timestamp
const dismissedAlertsStore = new Map<string, number>();

/**
 * Marks an alert as dismissed by the authenticated user for the current session/window.
 */
export const dismissAlert = (userId: number, alertId: string): void => {
  const key = `${userId}:${alertId}`;
  dismissedAlertsStore.set(key, Date.now());
};

/**
 * Checks whether an alert has been dismissed by the user.
 */
export const isAlertDismissed = (userId: number, alertId: string): boolean => {
  const key = `${userId}:${alertId}`;
  return dismissedAlertsStore.has(key);
};

/**
 * Clears dismissals (used primarily for test resets and testing cycles).
 */
export const clearDismissals = (userId?: number): void => {
  if (userId !== undefined) {
    for (const key of dismissedAlertsStore.keys()) {
      if (key.startsWith(`${userId}:`)) {
        dismissedAlertsStore.delete(key);
      }
    }
  } else {
    dismissedAlertsStore.clear();
  }
};

interface GetBudgetAlertsOptions {
  thresholds?: number[];
  includeDismissed?: boolean;
}

/**
 * Evaluates spending guardrails and generates explainable budget alerts
 * based on canonical server-side financial calculations.
 */
export const evaluateBudgetAlerts = async (
  userId: number,
  options?: GetBudgetAlertsOptions
): Promise<BudgetAlertsResponse> => {
  const evaluatedAt = new Date().toISOString();
  const includeDismissed = options?.includeDismissed ?? false;
  const thresholds = (options?.thresholds && options.thresholds.length > 0)
    ? options.thresholds.sort((a, b) => a - b)
    : [75, 90, 100];

  // 1. Fetch current active budget for the user
  const budget = await budgetService.getActiveBudgetOrNull(userId);

  if (!budget) {
    return {
      hasActiveBudget: false,
      activeBudget: null,
      period: null,
      totalSpent: 0,
      remainingBudget: null,
      usagePercentage: null,
      isOverBudget: false,
      alerts: [],
      historicalBaselinePeriod: null,
      evaluatedAt,
    };
  }

  // 2. Compute canonical period boundaries
  const startDate = budget.startDate;
  const endDate = calculateEndDate(startDate, budget.periodType);
  const daysRemaining = calculateDaysRemaining(startDate, budget.periodType);
  const periodKey = startDate.toISOString().slice(0, 10);

  const periodObj = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    periodType: budget.periodType,
    daysRemaining,
  };

  // 3. Authoritative server-side spending aggregations
  const whereClause: Prisma.TransactionWhereInput = {
    userId,
    transactionDate: {
      gte: startDate,
      lt: endDate,
    },
  };

  const [totalSpent, categoryTotals] = await Promise.all([
    transactionRepository.aggregateTotalSpent(whereClause),
    transactionRepository.groupCategoryTotals(whereClause),
  ]);

  // 4. Authoritative analytics metrics
  const remainingBudget = analyticsService.calculateRemainingBudget(
    budget.amount,
    totalSpent
  );
  const usagePercentage = analyticsService.calculateBudgetUsage(
    budget.amount,
    totalSpent
  );

  const budgetAmountNum = budget.amount.toNumber();
  const totalSpentNum = totalSpent.toNumber();
  const remainingBudgetNum = remainingBudget.toNumber();
  const isOverBudget = totalSpentNum > budgetAmountNum && budgetAmountNum > 0;

  const alerts: BudgetAlert[] = [];

  // =========================================================================
  // Guardrail 1: Budget Threshold & Over-Budget Detection
  // =========================================================================
  if (isOverBudget) {
    const alertId = `alert-budget-${budget.id}-overbudget-${periodKey}`;
    const isDismissed = isAlertDismissed(userId, alertId);

    if (includeDismissed || !isDismissed) {
      const overAmount = totalSpentNum - budgetAmountNum;
      alerts.push({
        id: alertId,
        type: BudgetAlertType.OVER_BUDGET,
        severity: AlertSeverity.CRITICAL,
        title: "Over Budget: Spending Limit Exceeded",
        message: `You have spent ₹${totalSpentNum.toFixed(2)}, exceeding your ₹${budgetAmountNum.toFixed(2)} ${budget.periodType.toLowerCase()} budget by ₹${overAmount.toFixed(2)} (${usagePercentage.toFixed(1)}% used).`,
        period: periodObj,
        metrics: {
          budgetAmount: budgetAmountNum,
          totalSpent: totalSpentNum,
          remainingBudget: remainingBudgetNum,
          usagePercentage,
          thresholdPercentage: 100,
        },
        explanation: {
          reason: `Total spending of ₹${totalSpentNum.toFixed(2)} has exceeded your allocated budget of ₹${budgetAmountNum.toFixed(2)} for the active period from ${periodObj.startDate.slice(0, 10)} to ${periodObj.endDate.slice(0, 10)}.`,
          source: "Canonical Server SQL Aggregations (aggregateTotalSpent)",
          rule: "Triggered when current period spending strictly exceeds 100% of the active budget amount.",
          calculationBreakdown: {
            budgetAmount: budgetAmountNum,
            totalSpent: totalSpentNum,
            remainingBudget: remainingBudgetNum,
            usagePercentage,
          },
        },
        dismissed: isDismissed,
        createdAt: evaluatedAt,
      });
    }
  } else {
    // Check descending thresholds (e.g. 90%, 75%) to emit the most urgent state
    const descendingThresholds = [...thresholds].filter((t) => t < 100).sort((a, b) => b - a);
    for (const threshold of descendingThresholds) {
      if (usagePercentage >= threshold) {
        const alertId = `alert-budget-${budget.id}-threshold-${threshold}-${periodKey}`;
        const isDismissed = isAlertDismissed(userId, alertId);

        if (includeDismissed || !isDismissed) {
          const isWarning = threshold >= 90;
          alerts.push({
            id: alertId,
            type: BudgetAlertType.BUDGET_THRESHOLD,
            severity: isWarning ? AlertSeverity.WARNING : AlertSeverity.INFO,
            title: `${threshold}% Budget Threshold Reached`,
            message: `You have used ${usagePercentage.toFixed(1)}% of your ${budget.periodType.toLowerCase()} budget. ₹${remainingBudgetNum.toFixed(2)} remaining with ${daysRemaining} days left.`,
            period: periodObj,
            metrics: {
              budgetAmount: budgetAmountNum,
              totalSpent: totalSpentNum,
              remainingBudget: remainingBudgetNum,
              usagePercentage,
              thresholdPercentage: threshold,
            },
            explanation: {
              reason: `Spending has reached ${usagePercentage.toFixed(1)}% of your ₹${budgetAmountNum.toFixed(2)} budget, crossing the ${threshold}% spending guardrail for ${periodObj.startDate.slice(0, 10)} to ${periodObj.endDate.slice(0, 10)}.`,
              source: "Canonical Server SQL Aggregations (aggregateTotalSpent)",
              rule: `Triggered when current period spending reaches or exceeds ${threshold}% of the active budget amount.`,
              calculationBreakdown: {
                budgetAmount: budgetAmountNum,
                totalSpent: totalSpentNum,
                remainingBudget: remainingBudgetNum,
                usagePercentage,
              },
            },
            dismissed: isDismissed,
            createdAt: evaluatedAt,
          });
        }
        // Emit only the highest triggered threshold to avoid alert fatigue (e.g. don't fire 75% when at 90%)
        break;
      }
    }
  }

  // =========================================================================
  // Guardrail 2: Unusual Category Spending Increase (Surge Anomaly)
  // =========================================================================
  const baselinePeriod = calculatePreviousPeriod(startDate, budget.periodType);
  const baselineWhere: Prisma.TransactionWhereInput = {
    userId,
    transactionDate: {
      gte: baselinePeriod.startDate,
      lt: baselinePeriod.endDate,
    },
  };

  const [baselineCategoryTotals, baselineTxnCount] = await Promise.all([
    transactionRepository.groupCategoryTotals(baselineWhere),
    transactionRepository.countTransactions(baselineWhere),
  ]);

  // Anomaly baseline requirement: at least 3 historical transactions in the previous period
  const hasSufficientHistoricalData = baselineTxnCount >= 3;

  if (hasSufficientHistoricalData) {
    const validCategories = Object.values(Category);

    for (const cat of validCategories) {
      const currentCatSpend = categoryTotals[cat] ? Number(categoryTotals[cat]) : 0;
      const baselineCatSpend = baselineCategoryTotals[cat]
        ? Number(baselineCategoryTotals[cat])
        : 0;

      // Anomaly detection rules:
      // 1. Baseline spend must be established and non-trivial (>= ₹100)
      // 2. Current spend must exceed baseline by at least 50% (surge ratio >= 1.5)
      // 3. Absolute spend increase must be meaningful (>= ₹500)
      if (
        baselineCatSpend >= 100 &&
        currentCatSpend >= baselineCatSpend * 1.5 &&
        currentCatSpend - baselineCatSpend >= 500
      ) {
        const surgePercentage =
          ((currentCatSpend - baselineCatSpend) / baselineCatSpend) * 100;
        const alertId = `alert-budget-${budget.id}-surge-${cat.toLowerCase()}-${periodKey}`;
        const isDismissed = isAlertDismissed(userId, alertId);

        if (includeDismissed || !isDismissed) {
          alerts.push({
            id: alertId,
            type: BudgetAlertType.CATEGORY_SURGE,
            severity: AlertSeverity.WARNING,
            title: `Unusual Spending Surge in ${cat}`,
            message: `Spending in ${cat} has increased by ${surgePercentage.toFixed(1)}% (₹${currentCatSpend.toFixed(2)} vs ₹${baselineCatSpend.toFixed(2)} in previous ${budget.periodType.toLowerCase()} period).`,
            period: periodObj,
            metrics: {
              budgetAmount: budgetAmountNum,
              totalSpent: totalSpentNum,
              remainingBudget: remainingBudgetNum,
              usagePercentage,
              category: cat,
              categorySpent: currentCatSpend,
              baselineSpent: baselineCatSpend,
              surgePercentage: Number(surgePercentage.toFixed(1)),
            },
            explanation: {
              reason: `In the current period (${periodObj.startDate.slice(0, 10)} to ${periodObj.endDate.slice(0, 10)}), spending in category ${cat} reached ₹${currentCatSpend.toFixed(2)}, which is +${surgePercentage.toFixed(1)}% higher than your preceding baseline of ₹${baselineCatSpend.toFixed(2)} (${baselinePeriod.startDate.toISOString().slice(0, 10)} to ${baselinePeriod.endDate.toISOString().slice(0, 10)}).`,
              source: "Historical Period Baseline Comparison (groupCategoryTotals)",
              rule: "Triggered when category spend exceeds previous period baseline by >= 50% with at least ₹500 absolute increase and >= 3 baseline transactions.",
              calculationBreakdown: {
                budgetAmount: budgetAmountNum,
                totalSpent: totalSpentNum,
                remainingBudget: remainingBudgetNum,
                usagePercentage,
                baselinePeriod: {
                  startDate: baselinePeriod.startDate.toISOString(),
                  endDate: baselinePeriod.endDate.toISOString(),
                },
                baselineAmount: baselineCatSpend,
                currentAmount: currentCatSpend,
              },
            },
            dismissed: isDismissed,
            createdAt: evaluatedAt,
          });
        }
      }
    }
  }

  return {
    hasActiveBudget: true,
    activeBudget: {
      id: budget.id,
      amount: budgetAmountNum,
      periodType: budget.periodType,
      startDate: budget.startDate.toISOString(),
      isLocked: budget.isLocked,
    },
    period: periodObj,
    totalSpent: totalSpentNum,
    remainingBudget: remainingBudgetNum,
    usagePercentage,
    isOverBudget,
    alerts,
    historicalBaselinePeriod: {
      startDate: baselinePeriod.startDate.toISOString(),
      endDate: baselinePeriod.endDate.toISOString(),
    },
    evaluatedAt,
  };
};

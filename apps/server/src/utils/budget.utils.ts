import { BudgetPeriod } from "../generated/prisma/enums";
import { Budget } from "../generated/prisma/client";

/**
 * Returns the last valid day for a given month.
 * Month is 0-based (0 = January, 11 = December).
 */
const getLastDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

/**
 * Adds months while preserving the original day whenever possible.
 *
 * Example:
 * Jan 31 + 1 month -> Feb 28 (or Feb 29)
 * May 31 + 1 month -> Jun 30
 */
const addMonthsSafely = (date: Date, months: number): Date => {
    const result = new Date(date);

    const originalDay = result.getDate();

    // Move to the first day before changing months to avoid JS rollover.
    result.setDate(1);
    result.setMonth(result.getMonth() + months);

    const maxDay = getLastDayOfMonth(
        result.getFullYear(),
        result.getMonth()
    );

    result.setDate(Math.min(originalDay, maxDay));

    return result;
};

/**
 * Calculates the end date of a budget based on its period.
 * This function acts as the single source of truth for budget durations.
 */
export const calculateEndDate = (
    startDate: Date,
    periodType: BudgetPeriod
): Date => {
    switch (periodType) {
        case BudgetPeriod.WEEKLY: {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);
            return endDate;
        }

        case BudgetPeriod.MONTHLY:
            return addMonthsSafely(startDate, 1);

        case BudgetPeriod.QUARTERLY:
            return addMonthsSafely(startDate, 3);

        default:
            throw new Error("Unsupported budget period.");
    }
};

/**
 * Calculates the immediately preceding period of the exact same duration.
 * Used for historical baseline comparisons and surge anomaly detection.
 */
export const calculatePreviousPeriod = (
    startDate: Date,
    periodType: BudgetPeriod
): { startDate: Date; endDate: Date } => {
    const endDate = new Date(startDate);

    switch (periodType) {
        case BudgetPeriod.WEEKLY: {
            const prevStart = new Date(startDate);
            prevStart.setDate(prevStart.getDate() - 7);
            return { startDate: prevStart, endDate };
        }

        case BudgetPeriod.MONTHLY: {
            const prevStart = addMonthsSafely(startDate, -1);
            return { startDate: prevStart, endDate };
        }

        case BudgetPeriod.QUARTERLY: {
            const prevStart = addMonthsSafely(startDate, -3);
            return { startDate: prevStart, endDate };
        }

        default:
            throw new Error("Unsupported budget period.");
    }
};

/**
 * Calculates days remaining in a budget window relative to an optional reference date (default: now).
 */
export const calculateDaysRemaining = (
    startDate: Date,
    periodType: BudgetPeriod,
    asOfDate: Date = new Date()
): number => {
    const endDate = calculateEndDate(startDate, periodType);
    const msDiff = endDate.getTime() - asOfDate.getTime();
    if (msDiff <= 0) return 0;
    return Math.ceil(msDiff / (1000 * 60 * 60 * 24));
};

/**
 * Checks whether a budget overlaps with any existing budget.
 * Returns true if an overlap is found, otherwise false.
 */
export const hasBudgetOverlap = (
    budgets: Budget[],
    startDate: Date,
    periodType: BudgetPeriod,
    excludeBudgetId?: number
): boolean => {

    // calculate the end date of the new budget
    const newBudgetEndDate = calculateEndDate(startDate, periodType);

    // compare the new budget with every existing budget
    for (const budget of budgets) {

        // skip the current budget while updating
        if (budget.id === excludeBudgetId) {
            continue;
        }

        // calculate the end date of the existing budget
        const existingBudgetEndDate = calculateEndDate(
            budget.startDate,
            budget.periodType
        );

        // Two half-open intervals [A_start, A_end) and [B_start, B_end) overlap iff
        // A_start < B_end && B_start < A_end
        if (
            startDate < existingBudgetEndDate &&
            newBudgetEndDate > budget.startDate
        ) {
            return true;
        }
    }

    // no overlap found
    return false;
};
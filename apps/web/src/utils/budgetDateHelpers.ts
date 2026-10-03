/**
 * Budget date helper utilities for client-side date calculations and formatting.
 * Mirrors backend calculation logic in apps/server/src/utils/budget.utils.ts.
 */

export const getLastDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

export const addMonthsSafely = (date: Date, months: number): Date => {
    const result = new Date(date);
    const originalDay = result.getDate();

    result.setDate(1);
    result.setMonth(result.getMonth() + months);

    const maxDay = getLastDayOfMonth(
        result.getFullYear(),
        result.getMonth()
    );

    result.setDate(Math.min(originalDay, maxDay));
    return result;
};

export const calculateBudgetEndDate = (
    startDate: string | Date,
    periodType: string
): Date => {
    const start = new Date(startDate);
    const normalizedPeriod = periodType.toUpperCase();

    switch (normalizedPeriod) {
        case "WEEKLY": {
            const end = new Date(start);
            end.setDate(end.getDate() + 7);
            return end;
        }
        case "MONTHLY":
            return addMonthsSafely(start, 1);
        case "QUARTERLY":
            return addMonthsSafely(start, 3);
        default:
            return addMonthsSafely(start, 1);
    }
};

export const isBudgetActive = (
    startDate: string | Date,
    periodType: string
): boolean => {
    const now = new Date();
    const start = new Date(startDate);
    // Reset time components for clean calendar day comparison
    start.setHours(0, 0, 0, 0);

    const end = calculateBudgetEndDate(start, periodType);
    end.setHours(23, 59, 59, 999);

    return now >= start && now <= end;
};

export const formatBudgetPeriodDateRange = (
    startDate: string | Date,
    periodType: string
): string => {
    const start = new Date(startDate);
    const end = calculateBudgetEndDate(start, periodType);

    const startStr = start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    const endStr = end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return `${startStr} – ${endStr}`;
};

export const getDaysRemainingInBudget = (
    startDate: string | Date,
    periodType: string
): number => {
    const now = new Date();
    const end = calculateBudgetEndDate(startDate, periodType);
    const diffMs = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

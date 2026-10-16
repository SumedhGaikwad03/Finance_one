import { RecurringFrequency } from "./recurring.types";

export interface CadenceAnalysisResult {
    frequency: RecurringFrequency;
    intervalDaysMedian: number;
    intervalDaysAverage: number;
    intervalDaysVariance: number; // Standard deviation of intervals in days
    regularityScore: number;       // 0.0 to 1.0
    hasMissingIntervals: boolean;
    estimatedNextDate: string | null; // ISO 8601
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calculates standard statistical median of an array of numbers.
 */
export function calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Adds calendar months safely, accounting for variable month lengths (28/30/31 days).
 */
export function addMonths(date: Date, count: number): Date {
    const d = new Date(date);
    const targetMonth = d.getMonth() + count;
    d.setMonth(targetMonth);
    return d;
}

/**
 * Analyzes chronologically sorted dates and determines payment cadence, regularity, and next projected date.
 */
export function analyzeCadence(sortedDates: Date[]): CadenceAnalysisResult {
    if (sortedDates.length < 2) {
        return {
            frequency: "IRREGULAR",
            intervalDaysMedian: 0,
            intervalDaysAverage: 0,
            intervalDaysVariance: 0,
            regularityScore: 0,
            hasMissingIntervals: false,
            estimatedNextDate: null,
        };
    }

    // 1. Calculate consecutive day differences
    const intervals: number[] = [];
    for (let i = 0; i < sortedDates.length - 1; i++) {
        const diffMs = sortedDates[i + 1].getTime() - sortedDates[i].getTime();
        const diffDays = Math.max(1, Math.round(diffMs / MS_PER_DAY));
        intervals.push(diffDays);
    }

    const median = calculateMedian(intervals);
    const average = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;

    // 2. Identify target frequency from median
    let frequency: RecurringFrequency = "IRREGULAR";
    let basePeriodDays = 30;
    let minAllowedJitter = 4;

    if (median >= 5 && median <= 10) {
        frequency = "WEEKLY";
        basePeriodDays = 7;
        minAllowedJitter = 2;
    } else if (median >= 24 && median <= 36) {
        frequency = "MONTHLY";
        basePeriodDays = 30;
        minAllowedJitter = 4;
    } else if (median >= 80 && median <= 105) {
        frequency = "QUARTERLY";
        basePeriodDays = 91;
        minAllowedJitter = 8;
    } else if (median >= 335 && median <= 395) {
        frequency = "ANNUAL";
        basePeriodDays = 365;
        minAllowedJitter = 15;
    }

    // 3. Detect missing intervals (e.g., someone missed one month or quarterly cycle)
    let hasMissingIntervals = false;
    const normalizedIntervalErrors: number[] = [];

    for (const interval of intervals) {
        // Check if interval is close to 1x, 2x, or 3x base period
        const multiple = Math.round(interval / basePeriodDays);
        if (multiple > 1 && multiple <= 3) {
            hasMissingIntervals = true;
            // Adjusted error per cycle
            const error = Math.abs(interval - multiple * basePeriodDays) / multiple;
            normalizedIntervalErrors.push(error);
        } else {
            const error = Math.abs(interval - basePeriodDays);
            normalizedIntervalErrors.push(error);
        }
    }

    // Compute variance / std dev of jitter
    const meanError = normalizedIntervalErrors.reduce((a, b) => a + b, 0) / normalizedIntervalErrors.length;
    const variance = Math.sqrt(
        normalizedIntervalErrors.map((x) => Math.pow(x - meanError, 2)).reduce((a, b) => a + b, 0) /
            normalizedIntervalErrors.length
    );

    // 4. Compute regularity score (1.0 = exact cadence, 0.0 = completely erratic)
    let regularityScore = 0.5;
    if (frequency !== "IRREGULAR") {
        if (meanError <= minAllowedJitter) {
            regularityScore = 0.95;
        } else if (meanError <= minAllowedJitter * 2) {
            regularityScore = 0.75;
        } else if (meanError <= minAllowedJitter * 3) {
            regularityScore = 0.55;
        } else {
            regularityScore = 0.35;
            frequency = "IRREGULAR";
        }

        // Slight penalty for missing intervals
        if (hasMissingIntervals) {
            regularityScore = Math.max(0.3, regularityScore - 0.15);
        }
    }

    // 5. Estimate Next Date
    let estimatedNextDate: string | null = null;
    const lastDate = sortedDates[sortedDates.length - 1];
    const now = new Date();

    if (frequency !== "IRREGULAR" && regularityScore >= 0.5) {
        let projected = new Date(lastDate);

        if (frequency === "WEEKLY") {
            projected.setDate(projected.getDate() + 7);
            while (projected.getTime() < now.getTime() - 2 * MS_PER_DAY) {
                projected.setDate(projected.getDate() + 7);
            }
        } else if (frequency === "MONTHLY") {
            projected = addMonths(projected, 1);
            while (projected.getTime() < now.getTime() - 5 * MS_PER_DAY) {
                projected = addMonths(projected, 1);
            }
        } else if (frequency === "QUARTERLY") {
            projected = addMonths(projected, 3);
            while (projected.getTime() < now.getTime() - 10 * MS_PER_DAY) {
                projected = addMonths(projected, 3);
            }
        } else if (frequency === "ANNUAL") {
            projected.setFullYear(projected.getFullYear() + 1);
            while (projected.getTime() < now.getTime() - 30 * MS_PER_DAY) {
                projected.setFullYear(projected.getFullYear() + 1);
            }
        }

        estimatedNextDate = projected.toISOString().slice(0, 10);
    }

    return {
        frequency,
        intervalDaysMedian: Math.round(median),
        intervalDaysAverage: Math.round(average * 10) / 10,
        intervalDaysVariance: Math.round(variance * 10) / 10,
        regularityScore: Math.round(regularityScore * 100) / 100,
        hasMissingIntervals,
        estimatedNextDate,
    };
}

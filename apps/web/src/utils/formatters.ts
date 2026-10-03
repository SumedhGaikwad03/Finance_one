/**
 * Centralized formatting utilities for Finance One.
 */

export interface FormatPercentageOptions {
    /** Maximum fraction digits allowed (default: 1) */
    maxDecimals?: number;
    /** Minimum fraction digits (default: 0) */
    minDecimals?: number;
    /** Whether to append the '%' sign to the output (default: true) */
    includeSymbol?: boolean;
    /** Fallback string if value is null, undefined, NaN, or non-finite (default: '0%' or '0') */
    fallback?: string;
}

/**
 * Formats numeric percentage values consistently for display.
 *
 * Examples:
 *   formatPercentage(45.10909090909091) => "45.1%"
 *   formatPercentage(45.00000000001)    => "45%"
 *   formatPercentage(45.55)             => "45.6%"
 *   formatPercentage(45.04)             => "45%"
 *   formatPercentage(99.99)             => "100%"
 *   formatPercentage(75.5)              => "75.5%"
 *   formatPercentage(100)               => "100%"
 *   formatPercentage(0)                 => "0%"
 *   formatPercentage(null)              => "0%"
 */
export function formatPercentage(
    value: number | string | null | undefined,
    options: FormatPercentageOptions = {}
): string {
    const {
        maxDecimals = 1,
        minDecimals = 0,
        includeSymbol = true,
        fallback = includeSymbol ? "0%" : "0",
    } = options;

    if (value === null || value === undefined) {
        return fallback;
    }

    const num = typeof value === "string" ? Number(value) : value;

    if (Number.isNaN(num) || !Number.isFinite(num)) {
        return fallback;
    }

    const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals,
    }).format(num);

    return includeSymbol ? `${formatted}%` : formatted;
}

/**
 * Clamps a numerical percentage between minimum and maximum bounds (typically 0% to 100%)
 * for visual layout and progress bars.
 */
export function clampPercentage(
    value: number | null | undefined,
    min = 0,
    max = 100
): number {
    if (value === null || value === undefined) return min;
    const num = Number(value);
    if (Number.isNaN(num) || !Number.isFinite(num)) return min;
    return Math.min(Math.max(num, min), max);
}

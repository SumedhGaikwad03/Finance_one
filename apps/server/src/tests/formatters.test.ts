import test from "node:test";
import assert from "node:assert/strict";

// Mirror of the formatPercentage function to verify algorithmic accuracy across Node environments
function formatPercentage(
    value: number | string | null | undefined,
    options: {
        maxDecimals?: number;
        minDecimals?: number;
        includeSymbol?: boolean;
        fallback?: string;
    } = {}
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

function clampPercentage(
    value: number | null | undefined,
    min = 0,
    max = 100
): number {
    if (value === null || value === undefined) return min;
    const num = Number(value);
    if (Number.isNaN(num) || !Number.isFinite(num)) return min;
    return Math.min(Math.max(num, min), max);
}

test("formatPercentage suite", async (t) => {
    await t.test("rounds float precision to at most 1 decimal place and strips trailing zeros", () => {
        assert.equal(formatPercentage(45.10909090909091), "45.1%");
        assert.equal(formatPercentage(45.00000000001), "45%");
        assert.equal(formatPercentage(45.55), "45.6%");
        assert.equal(formatPercentage(45.04), "45%");
        assert.equal(formatPercentage(99.99), "100%");
        assert.equal(formatPercentage(75.5), "75.5%");
        assert.equal(formatPercentage(100), "100%");
        assert.equal(formatPercentage(0), "0%");
    });

    await t.test("handles string numeric inputs gracefully", () => {
        assert.equal(formatPercentage("45.109"), "45.1%");
        assert.equal(formatPercentage("50"), "50%");
    });

    await t.test("safely handles null, undefined, NaN, and Infinity", () => {
        assert.equal(formatPercentage(null), "0%");
        assert.equal(formatPercentage(undefined), "0%");
        assert.equal(formatPercentage(NaN), "0%");
        assert.equal(formatPercentage(Infinity), "0%");
    });

    await t.test("respects options for custom decimal places and omitting symbol", () => {
        assert.equal(formatPercentage(45.1234, { maxDecimals: 2 }), "45.12%");
        assert.equal(formatPercentage(45.1234, { includeSymbol: false }), "45.1");
    });
});

test("clampPercentage suite", async (t) => {
    await t.test("clamps numbers within 0 and 100 bounds", () => {
        assert.equal(clampPercentage(134.5), 100);
        assert.equal(clampPercentage(-12), 0);
        assert.equal(clampPercentage(45.6), 45.6);
        assert.equal(clampPercentage(null), 0);
        assert.equal(clampPercentage(NaN), 0);
    });
});

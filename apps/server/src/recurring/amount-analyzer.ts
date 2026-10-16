export interface AmountAnalysisResult {
    averageAmount: number;
    minAmount: number;
    maxAmount: number;
    lastAmount: number;
    isVariableAmount: boolean;
    amountVariancePercentage: number;
    amountConsistencyScore: number; // 0.0 to 1.0
}

/**
 * Analyzes amounts in a transaction sequence and determines amount consistency, variance, and fixed vs variable status.
 */
export function analyzeAmounts(amounts: number[]): AmountAnalysisResult {
    if (amounts.length === 0) {
        return {
            averageAmount: 0,
            minAmount: 0,
            maxAmount: 0,
            lastAmount: 0,
            isVariableAmount: false,
            amountVariancePercentage: 0,
            amountConsistencyScore: 0,
        };
    }

    const n = amounts.length;
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    const lastAmount = amounts[amounts.length - 1];
    const sum = amounts.reduce((acc, v) => acc + v, 0);
    const average = sum / n;

    // Standard deviation
    const variance = amounts.reduce((acc, v) => acc + Math.pow(v - average, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Relative percentage difference between max and min relative to average
    const spreadPercentage = average > 0 ? ((maxAmount - minAmount) / average) * 100 : 0;
    const cvPercentage = average > 0 ? (stdDev / average) * 100 : 0;

    // Fixed vs Variable evaluation:
    // If difference is <= 1 INR or CV <= 1.5%, considered strictly fixed (e.g. Netflix, Prime, Spotify, standard EMI)
    const isFixed = maxAmount - minAmount <= 1.0 || cvPercentage <= 1.5;
    const isVariableAmount = !isFixed;

    // Amount consistency scoring
    let amountConsistencyScore = 0.5;
    if (isFixed) {
        amountConsistencyScore = 1.0;
    } else if (spreadPercentage <= 15.0) {
        // Minor seasonal or consumption fluctuation (e.g. mobile postpaid, slight water bill diff)
        amountConsistencyScore = 0.85;
    } else if (spreadPercentage <= 35.0) {
        // Moderate utility bill fluctuation (e.g. electricity bills between summer and winter)
        amountConsistencyScore = 0.70;
    } else if (spreadPercentage <= 60.0) {
        amountConsistencyScore = 0.45;
    } else {
        // High variation (> 60% spread)
        amountConsistencyScore = 0.25;
    }

    return {
        averageAmount: Math.round(average * 100) / 100,
        minAmount: Math.round(minAmount * 100) / 100,
        maxAmount: Math.round(maxAmount * 100) / 100,
        lastAmount: Math.round(lastAmount * 100) / 100,
        isVariableAmount,
        amountVariancePercentage: Math.round(spreadPercentage * 10) / 10,
        amountConsistencyScore: Math.round(amountConsistencyScore * 100) / 100,
    };
}

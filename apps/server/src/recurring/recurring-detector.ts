import crypto from "crypto";
import { Category, Priority, Prisma, Transaction } from "../generated/prisma/client";
import { determineFinancialEligibility } from "../classification/contracts/classification.contract";
import { analyzeAmounts } from "./amount-analyzer";
import { analyzeCadence } from "./cadence-analyzer";
import { normalizeMerchant } from "./merchant-normalizer";
import { recurringPreferenceStore } from "./recurring-preference.store";
import {
    RecurringConfidence,
    RecurringDetectionOptions,
    RecurringEvidence,
    RecurringMatchedTransaction,
    RecurringPattern,
    RecurringPatternsResponse,
    RecurringSignals,
    RecurringStatus,
    RecurringType,
} from "./recurring.types";

/**
 * Generates a stable, reproducible pattern ID based on userId, normalized merchant key, and frequency.
 */
export function generatePatternId(userId: number, normalizedKey: string, frequency: string): string {
    const raw = `${userId}:${normalizedKey}:${frequency}`;
    const hash = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
    return `rec_${hash}`;
}

export class RecurringExpenseDetector {
    /**
     * Evaluates a user's transaction history and detects recurring payment patterns with explainable evidence.
     */
    public detect(
        transactions: Transaction[],
        userId: number,
        options: RecurringDetectionOptions = {}
    ): RecurringPatternsResponse {
        const minTransactions = options.minTransactions ?? 2;
        const minConfidence = options.minConfidence ?? 0.35;
        const includeDismissed = options.includeDismissed ?? false;

        // 1. Filter transactions to strictly valid outgoing expenses
        const validExpenses = transactions.filter((tx) => {
            if (tx.userId !== userId) return false;

            const amountNum =
                tx.amount instanceof Prisma.Decimal ? tx.amount.toNumber() : Number(tx.amount);
            if (!Number.isFinite(amountNum) || amountNum <= 0) return false;

            const eligibility = determineFinancialEligibility({
                amount: tx.amount,
                isDebit: true,
                isCredit: false,
                narration: `${tx.title || ""} ${tx.notes || ""}`,
            });

            return eligibility.isEligibleExpense && eligibility.recordType === "EXPENSE";
        });

        // 2. Group transactions by normalized merchant key
        const groups = new Map<string, Transaction[]>();

        for (const tx of validExpenses) {
            const norm = normalizeMerchant(tx.title, tx.notes);
            const key = norm.normalizedKey;

            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(tx);
        }

        const userPreferences = recurringPreferenceStore.getAllPreferencesForUser(userId);
        const patterns: RecurringPattern[] = [];

        // 3. Evaluate each merchant group
        for (const [merchantKey, groupTxs] of groups.entries()) {
            // Hard invariant: single transaction is NEVER recurring
            if (groupTxs.length < minTransactions) {
                continue;
            }

            // Sort chronologically ascending
            const sorted = [...groupTxs].sort(
                (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
            );

            // Extract dates and amounts
            const dates = sorted.map((tx) => new Date(tx.transactionDate));
            const amounts = sorted.map((tx) =>
                tx.amount instanceof Prisma.Decimal ? tx.amount.toNumber() : Number(tx.amount)
            );

            // Run analyzers
            const cadence = analyzeCadence(dates);
            const amountAnalysis = analyzeAmounts(amounts);

            // Merchant normalization details from the most recent transaction
            const latestTx = sorted[sorted.length - 1];
            const norm = normalizeMerchant(latestTx.title, latestTx.notes);

            // 4. Distinguish Recurring Type (Subscription vs Bill Payment vs General)
            let detectedType: RecurringType = "GENERAL_RECURRING";
            let dominantCategory: Category = latestTx.category;

            // Check if known merchant definition exists
            if (norm.knownDefinition) {
                detectedType = norm.knownDefinition.defaultType;
                dominantCategory = norm.knownDefinition.defaultCategory;
            } else if (
                latestTx.category === Category.SUBSCRIPTION ||
                sorted.some((t) => t.category === Category.SUBSCRIPTION)
            ) {
                detectedType = "SUBSCRIPTION";
                dominantCategory = Category.SUBSCRIPTION;
            } else if (
                latestTx.category === Category.BILLS ||
                sorted.some((t) => t.category === Category.BILLS) ||
                /\b(bill|electricity|water|gas|broadband|rent|emi|insurance)\b/i.test(norm.cleanedNarration)
            ) {
                detectedType = "BILL_PAYMENT";
                dominantCategory = Category.BILLS;
            } else if (!amountAnalysis.isVariableAmount && cadence.frequency === "MONTHLY") {
                // Fixed monthly amount to a consistent merchant is likely a subscription
                detectedType = "SUBSCRIPTION";
            }

            // 5. Confidence Scoring Model
            let baseConfidence = 0.5;
            if (sorted.length >= 5) {
                baseConfidence = 0.85;
            } else if (sorted.length >= 4) {
                baseConfidence = 0.75;
            } else if (sorted.length >= 3) {
                baseConfidence = 0.65;
            } else {
                baseConfidence = 0.45;
            }

            // Regularity adjustment (-0.20 to +0.10)
            const regularityDelta = (cadence.regularityScore - 0.5) * 0.25;

            // Amount consistency adjustment (-0.15 to +0.05)
            const amountDelta = (amountAnalysis.amountConsistencyScore - 0.5) * 0.2;

            // Known merchant bonus (+0.08)
            const knownBonus = norm.isKnownMerchant ? 0.08 : 0;

            let finalConfidence = baseConfidence + regularityDelta + amountDelta + knownBonus;

            // If cadence is completely irregular and amount is variable, cap confidence low
            if (cadence.frequency === "IRREGULAR" && amountAnalysis.isVariableAmount) {
                finalConfidence = Math.min(finalConfidence, 0.4);
            }

            // Bounded between 0.15 and 0.98
            finalConfidence = Math.max(0.15, Math.min(0.98, Math.round(finalConfidence * 100) / 100));

            // Determine confidence tier
            let confidenceLevel: RecurringConfidence = "LOW";
            if (finalConfidence >= 0.75) {
                confidenceLevel = "HIGH";
            } else if (finalConfidence >= 0.5) {
                confidenceLevel = "MEDIUM";
            }

            // Check if pattern meets minimum confidence threshold
            if (finalConfidence < minConfidence) {
                continue;
            }

            // 6. Build Evidence and Explanation
            const patternId = generatePatternId(userId, merchantKey, cadence.frequency);
            const userPref = userPreferences.get(patternId);

            let status: RecurringStatus = "POSSIBLE";
            let userConfirmed = false;
            let userDismissed = false;

            if (userPref) {
                status = userPref.status;
                if (status === "CONFIRMED") {
                    userConfirmed = true;
                    finalConfidence = 1.0;
                    confidenceLevel = "HIGH";
                } else if (status === "DISMISSED") {
                    userDismissed = true;
                }
            }

            // Skip dismissed patterns unless explicitly requested
            if (userDismissed && !includeDismissed) {
                continue;
            }

            // Filter options
            if (options.statusFilter && status !== options.statusFilter) continue;
            if (options.typeFilter && detectedType !== options.typeFilter) continue;
            if (options.frequencyFilter && cadence.frequency !== options.frequencyFilter) continue;

            const matchedTransactions: RecurringMatchedTransaction[] = sorted.map((t) => ({
                id: t.id,
                amount: t.amount instanceof Prisma.Decimal ? t.amount.toNumber() : Number(t.amount),
                transactionDate: new Date(t.transactionDate).toISOString().slice(0, 10),
                title: t.title,
                category: t.category,
                priority: t.priority,
            }));

            const signals: RecurringSignals = {
                merchantMatchScore: norm.isKnownMerchant ? 1.0 : 0.8,
                cadenceRegularityScore: cadence.regularityScore,
                amountConsistencyScore: amountAnalysis.amountConsistencyScore,
                hasMissingIntervals: cadence.hasMissingIntervals,
                isSubscriptionCategory: detectedType === "SUBSCRIPTION",
                isKnownRecurringMerchant: norm.isKnownMerchant,
                intervalDaysMedian: cadence.intervalDaysMedian,
                intervalDaysVariance: cadence.intervalDaysVariance,
            };

            // Human-readable evidence explanation
            const cadenceText =
                cadence.frequency !== "IRREGULAR"
                    ? `${cadence.frequency.toLowerCase()} (approx. every ${cadence.intervalDaysMedian} days)`
                    : "irregular intervals";

            const amountText = amountAnalysis.isVariableAmount
                ? `variable amounts averaging ₹${amountAnalysis.averageAmount.toFixed(2)} (range: ₹${amountAnalysis.minAmount.toFixed(2)} - ₹${amountAnalysis.maxAmount.toFixed(2)})`
                : `consistent amount of ₹${amountAnalysis.lastAmount.toFixed(2)}`;

            const explanation = `Paid ${sorted.length} times with ${cadenceText} and ${amountText}. Last recorded payment on ${dates[dates.length - 1].toISOString().slice(0, 10)}.`;

            const evidence: RecurringEvidence = {
                explanation,
                signals,
                matchedTransactions,
            };

            const pattern: RecurringPattern = {
                id: patternId,
                userId,
                merchantName: norm.canonicalName,
                normalizedMerchantKey: merchantKey,
                sampleNarration: latestTx.title || norm.cleanedNarration,
                frequency: cadence.frequency,
                type: detectedType,
                category: dominantCategory,
                priority: latestTx.priority || Priority.ESSENTIAL,
                averageAmount: amountAnalysis.averageAmount,
                minAmount: amountAnalysis.minAmount,
                maxAmount: amountAnalysis.maxAmount,
                lastAmount: amountAnalysis.lastAmount,
                isVariableAmount: amountAnalysis.isVariableAmount,
                amountVariancePercentage: amountAnalysis.amountVariancePercentage,
                currency: "INR",
                confidence: finalConfidence,
                confidenceLevel,
                status,
                transactionCount: sorted.length,
                firstPaymentDate: dates[0].toISOString().slice(0, 10),
                lastPaymentDate: dates[dates.length - 1].toISOString().slice(0, 10),
                estimatedNextDate: cadence.estimatedNextDate,
                evidence,
                userConfirmed,
                userDismissed,
                userNotes: userPref?.userNotes,
            };

            patterns.push(pattern);
        }

        // Sort patterns: Confirmed first, then highest confidence descending
        patterns.sort((a, b) => {
            if (a.status === "CONFIRMED" && b.status !== "CONFIRMED") return -1;
            if (b.status === "CONFIRMED" && a.status !== "CONFIRMED") return 1;
            return b.confidence - a.confidence;
        });

        // 7. Calculate summary metrics
        let confirmedCount = 0;
        let possibleCount = 0;
        let dismissedCount = 0;
        let subscriptionsCount = 0;
        let billsCount = 0;
        let generalCount = 0;
        let estimatedMonthlyOutflow = 0;

        for (const p of patterns) {
            if (p.status === "CONFIRMED") confirmedCount++;
            else if (p.status === "POSSIBLE") possibleCount++;
            else if (p.status === "DISMISSED") dismissedCount++;

            if (p.type === "SUBSCRIPTION") subscriptionsCount++;
            else if (p.type === "BILL_PAYMENT") billsCount++;
            else generalCount++;

            // Estimate monthly equivalent outflow (excluding dismissed)
            if (p.status !== "DISMISSED") {
                if (p.frequency === "WEEKLY") estimatedMonthlyOutflow += p.averageAmount * 4.33;
                else if (p.frequency === "MONTHLY") estimatedMonthlyOutflow += p.averageAmount;
                else if (p.frequency === "QUARTERLY") estimatedMonthlyOutflow += p.averageAmount / 3;
                else if (p.frequency === "ANNUAL") estimatedMonthlyOutflow += p.averageAmount / 12;
            }
        }

        return {
            patterns,
            summary: {
                totalDetected: patterns.length,
                confirmedCount,
                possibleCount,
                dismissedCount,
                subscriptionsCount,
                billsCount,
                generalCount,
                estimatedMonthlyOutflow: Math.round(estimatedMonthlyOutflow * 100) / 100,
            },
        };
    }
}

export const recurringExpenseDetector = new RecurringExpenseDetector();

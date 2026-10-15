import { Transaction } from "../../generated/prisma/client";
import { TransactionSource } from "../../generated/prisma/enums";
import * as transactionRepository from "../../repositories/transaction.repository";
import {
    ValidatedTransactionCandidate,
    DuplicateCheckResult,
} from "../types/ingestion.types";

/**
 * Checks for exact and heuristic duplicates for a validated transaction candidate.
 */
export async function detectDuplicate(
    candidate: ValidatedTransactionCandidate
): Promise<DuplicateCheckResult> {
    const { userId, source, externalId, amount, transactionDate, title } = candidate;

    // 1. Stable External Identifier Check (Exact Match)
    if (externalId) {
        const existing = await transactionRepository.findTransactionByExternalId(
            userId,
            source,
            externalId
        );

        if (existing) {
            return {
                status: "CONFIRMED_DUPLICATE",
                matchedTransactionId: existing.id,
                confidence: 1.0,
                reason: `Matches existing transaction with source '${source}' and external ID '${externalId}'`,
            };
        }
    }

    // 2. Heuristic Matching (Ambiguous / Potential Duplicates)
    // Find existing transactions for this user with exact amount in a 1-day window
    const candidates = await transactionRepository.findPotentialDuplicates(
        userId,
        amount,
        transactionDate,
        1 // +/- 1 day tolerance
    );

    if (candidates.length > 0) {
        const normalizedCandidateTitle = (title || "").toLowerCase().trim();

        for (const existing of candidates) {
            const normalizedExistingTitle = (existing.title || "").toLowerCase().trim();
            const sameTitle =
                normalizedCandidateTitle.length > 0 &&
                normalizedExistingTitle.length > 0 &&
                normalizedCandidateTitle === normalizedExistingTitle;

            // Scenario A: Manual Entry Rapid Double-Submission Guard
            if (source === TransactionSource.MANUAL && sameTitle) {
                const ageMs = Math.abs(Date.now() - existing.createdAt.getTime());
                const DOUBLE_CLICK_WINDOW_MS = 60 * 1000; // 60 seconds

                if (ageMs < DOUBLE_CLICK_WINDOW_MS) {
                    return {
                        status: "POTENTIAL_DUPLICATE",
                        matchedTransactionId: existing.id,
                        confidence: 0.95,
                        reason: `Identical manual transaction was submitted ${Math.round(ageMs / 1000)}s ago.`,
                    };
                }
            }

            // Scenario B: Import / Batch Statement Potential Duplicate
            if (source !== TransactionSource.MANUAL && sameTitle) {
                const sameDate =
                    existing.transactionDate.toISOString().slice(0, 10) ===
                    transactionDate.toISOString().slice(0, 10);

                if (sameDate) {
                    return {
                        status: "POTENTIAL_DUPLICATE",
                        matchedTransactionId: existing.id,
                        confidence: 0.85,
                        reason: `Potential duplicate found: ID ${existing.id} has identical amount (${amount}), date (${sameDate}), and title ('${existing.title}').`,
                    };
                }
            }
        }
    }

    // 3. New Transaction Eligible for Persistence
    return {
        status: "NEW",
        confidence: 0.0,
    };
}

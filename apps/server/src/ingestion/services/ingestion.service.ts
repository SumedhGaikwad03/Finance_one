import { Prisma, Transaction } from "../../generated/prisma/client";
import { isPrismaP2002 } from "../../lib/prismaErrors";
import * as transactionRepository from "../../repositories/transaction.repository";
import {
    IngestionSourceInput,
    IngestionContext,
    IngestionResult,
    BatchIngestionResult,
} from "../types/ingestion.types";
import { normalizeTransactionInput } from "../normalizers/transaction.normalizer";
import { validateTransactionCandidate } from "../validators/transaction.validator";
import { detectDuplicate } from "../duplicates/duplicate-detector";

/**
 * Ingests a single transaction through the canonical financial pipeline:
 * Source Input -> Normalize -> Validate -> Duplicate Check -> Persist -> IngestionResult
 */
export async function ingestTransaction(
    input: IngestionSourceInput,
    context: IngestionContext
): Promise<IngestionResult> {
    // 1. Normalization
    const candidate = normalizeTransactionInput(input);

    // 2. Validation
    const validation = validateTransactionCandidate(candidate, context.userId);
    if (!validation.isValid || !validation.validated) {
        return {
            status: "VALIDATION_FAILED",
            candidate,
            errors: validation.errors,
        };
    }

    const validated = validation.validated;

    // 3. Duplicate Detection
    const duplicateCheck = await detectDuplicate(validated);

    // Outcome A: Confirmed Duplicate (matched by stable identifier)
    if (duplicateCheck.status === "CONFIRMED_DUPLICATE" && duplicateCheck.matchedTransactionId) {
        const existing = await transactionRepository.findTransactionById(
            duplicateCheck.matchedTransactionId
        );

        return {
            status: "CONFIRMED_DUPLICATE",
            transaction: existing || undefined,
            candidate,
            duplicateInfo: {
                matchedTransactionId: duplicateCheck.matchedTransactionId,
                confidence: duplicateCheck.confidence,
                reason: duplicateCheck.reason || "Matches existing transaction with external ID",
            },
        };
    }

    // Outcome B: Potential Duplicate (heuristic match requiring confirmation)
    if (
        duplicateCheck.status === "POTENTIAL_DUPLICATE" &&
        duplicateCheck.matchedTransactionId &&
        !candidate.allowPotentialDuplicate
    ) {
        return {
            status: "POTENTIAL_DUPLICATE",
            candidate,
            duplicateInfo: {
                matchedTransactionId: duplicateCheck.matchedTransactionId,
                confidence: duplicateCheck.confidence,
                reason: duplicateCheck.reason || "Potential duplicate detected via heuristic analysis",
            },
        };
    }

    // 4. Persistence (Acceptance into Financial Ledger)
    try {
        const created = await transactionRepository.createTransaction({
            amount: validated.amount,
            category: validated.category,
            priority: validated.priority,
            title: validated.title,
            notes: validated.notes,
            transactionDate: validated.transactionDate,
            userId: validated.userId,
            source: validated.source,
            externalId: validated.externalId,
            sourceMetadata: (validated.sourceMetadata as Prisma.InputJsonValue) || null,
        });

        return {
            status: "ACCEPTED",
            transaction: created,
            candidate,
        };
    } catch (err: unknown) {
        // Handle concurrent submission race conditions at DB level via unique constraint
        if (isPrismaP2002(err) && validated.externalId) {
            const existing = await transactionRepository.findTransactionByExternalId(
                validated.userId,
                validated.source,
                validated.externalId
            );

            if (existing) {
                return {
                    status: "CONFIRMED_DUPLICATE",
                    transaction: existing,
                    candidate,
                    duplicateInfo: {
                        matchedTransactionId: existing.id,
                        confidence: 1.0,
                        reason: "Concurrent submission matched unique external ID constraint.",
                    },
                };
            }
        }

        throw err;
    }
}

/**
 * Ingests a batch of transaction candidates, processing each independently.
 */
export async function ingestTransactionBatch(
    inputs: IngestionSourceInput[],
    context: IngestionContext
): Promise<BatchIngestionResult> {
    const results: IngestionResult[] = [];
    let accepted = 0;
    let duplicates = 0;
    let potentialDuplicates = 0;
    let failed = 0;

    for (const input of inputs) {
        const result = await ingestTransaction(input, context);
        results.push(result);

        switch (result.status) {
            case "ACCEPTED":
                accepted++;
                break;
            case "CONFIRMED_DUPLICATE":
                duplicates++;
                break;
            case "POTENTIAL_DUPLICATE":
                potentialDuplicates++;
                break;
            case "VALIDATION_FAILED":
                failed++;
                break;
        }
    }

    return {
        total: inputs.length,
        accepted,
        duplicates,
        potentialDuplicates,
        failed,
        results,
    };
}

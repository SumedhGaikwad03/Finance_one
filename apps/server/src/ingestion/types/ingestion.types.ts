import { Category, Priority, TransactionSource } from "../../generated/prisma/enums";
import { Prisma, Transaction } from "../../generated/prisma/client";

/**
 * 1. Source Input (Untrusted)
 * Information arriving from an external source: manual form, file row, OCR, etc.
 */
export interface IngestionSourceInput {
    amount: number | string | Prisma.Decimal;
    category?: Category | string;
    priority?: Priority | string;
    title?: string;
    notes?: string;
    transactionDate?: string | Date;
    source?: TransactionSource;
    externalId?: string;
    sourceMetadata?: Record<string, unknown>;
    allowPotentialDuplicate?: boolean;
    tags?: string[];
}

/**
 * 2. Normalized Transaction Candidate
 * Cleaned, canonicalized representations of source fields before domain verification.
 */
export interface NormalizedTransactionCandidate {
    amount: Prisma.Decimal;
    category: Category;
    priority: Priority;
    title: string | null;
    notes: string | null;
    transactionDate: Date;
    source: TransactionSource;
    externalId: string | null;
    sourceMetadata: Record<string, unknown> | null;
    tags?: string[];
    fingerprint: string;
    allowPotentialDuplicate: boolean;
}

/**
 * 3. Validated Transaction Candidate
 * Normalized candidate that satisfies all domain invariants and carries verified user context.
 */
export interface ValidatedTransactionCandidate extends NormalizedTransactionCandidate {
    userId: number;
    isValid: true;
}

/**
 * Structured validation failure error detail.
 */
export interface IngestionValidationError {
    field: string;
    message: string;
    code: string;
}

/**
 * Duplicate check classification.
 */
export type DuplicateCheckStatus = "NEW" | "CONFIRMED_DUPLICATE" | "POTENTIAL_DUPLICATE";

export interface DuplicateCheckResult {
    status: DuplicateCheckStatus;
    matchedTransactionId?: number;
    confidence: number;
    reason?: string;
}

/**
 * Final Ingestion Status Outcomes.
 */
export type IngestionStatus =
    | "ACCEPTED"             // Persisted to canonical Transaction ledger
    | "CONFIRMED_DUPLICATE"  // Matched by stable external ID, returned existing
    | "POTENTIAL_DUPLICATE"  // Ambiguous match requiring user confirmation
    | "VALIDATION_FAILED";   // Domain invariant failure

/**
 * Comprehensive Ingestion Outcome Contract.
 */
export interface IngestionResult {
    status: IngestionStatus;
    transaction?: Transaction;
    candidate: NormalizedTransactionCandidate;
    errors?: IngestionValidationError[];
    duplicateInfo?: {
        matchedTransactionId: number;
        reason: string;
        confidence: number;
    };
}

/**
 * Batch Ingestion Outcome.
 */
export interface BatchIngestionResult {
    total: number;
    accepted: number;
    duplicates: number;
    potentialDuplicates: number;
    failed: number;
    results: IngestionResult[];
}

/**
 * Ingestion Context containing authenticated tenant identity.
 */
export interface IngestionContext {
    userId: number;
}

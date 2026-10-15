import crypto from "crypto";
import { Prisma } from "../../generated/prisma/client";
import { Category, Priority, TransactionSource } from "../../generated/prisma/enums";
import { IngestionSourceInput, NormalizedTransactionCandidate } from "../types/ingestion.types";

/**
 * Normalizes description / title by trimming and collapsing multiple spaces.
 */
export function normalizeTitle(rawTitle?: string | null): string | null {
    if (!rawTitle) return null;
    const cleaned = rawTitle.trim().replace(/\s+/g, " ");
    return cleaned.length > 0 ? cleaned : null;
}

/**
 * Normalizes notes by trimming and stripping excessive whitespace.
 */
export function normalizeNotes(rawNotes?: string | null): string | null {
    if (!rawNotes) return null;
    const cleaned = rawNotes.trim();
    return cleaned.length > 0 ? cleaned : null;
}

/**
 * Normalizes raw amount representation into a positive Prisma.Decimal.
 * Handles currency symbols (₹, $, €, £), commas, and negative debit representations.
 */
export function normalizeAmount(rawAmount: number | string | Prisma.Decimal): Prisma.Decimal {
    if (rawAmount instanceof Prisma.Decimal) {
        return rawAmount.abs();
    }

    if (typeof rawAmount === "number") {
        if (!Number.isFinite(rawAmount)) {
            throw new Error("Amount must be a finite number");
        }
        return new Prisma.Decimal(Math.abs(rawAmount));
    }

    if (typeof rawAmount === "string") {
        // Strip common currency symbols, commas, and whitespace
        const sanitized = rawAmount
            .replace(/[₹$€£,\s]/g, "")
            .trim();

        if (sanitized.length === 0 || isNaN(Number(sanitized))) {
            throw new Error(`Invalid monetary amount format: '${rawAmount}'`);
        }

        const parsed = new Prisma.Decimal(sanitized);
        return parsed.abs();
    }

    throw new Error("Unsupported amount type");
}

/**
 * Parses and normalizes transaction date into a valid UTC Date.
 */
export function normalizeTransactionDate(rawDate?: string | Date | null): Date {
    if (!rawDate) {
        return new Date();
    }

    if (rawDate instanceof Date) {
        if (isNaN(rawDate.getTime())) {
            throw new Error("Invalid Date object provided");
        }
        return rawDate;
    }

    if (typeof rawDate === "string") {
        const trimmed = rawDate.trim();
        // Support YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return new Date(`${trimmed}T00:00:00.000Z`);
        }

        const parsed = new Date(trimmed);
        if (isNaN(parsed.getTime())) {
            throw new Error(`Invalid transaction date string: '${rawDate}'`);
        }
        return parsed;
    }

    throw new Error("Unsupported date type");
}

/**
 * Normalizes category string or enum to valid Category, falling back to Category.OTHER.
 */
export function normalizeCategory(rawCategory?: Category | string | null): Category {
    if (!rawCategory) return Category.OTHER;
    const upper = String(rawCategory).trim().toUpperCase();
    if (Object.values(Category).includes(upper as Category)) {
        return upper as Category;
    }
    return Category.OTHER;
}

/**
 * Normalizes priority string or enum to valid Priority, falling back to Priority.GOOD_TO_HAVE.
 */
export function normalizePriority(rawPriority?: Priority | string | null): Priority {
    if (!rawPriority) return Priority.GOOD_TO_HAVE;
    const upper = String(rawPriority).trim().toUpperCase();
    if (Object.values(Priority).includes(upper as Priority)) {
        return upper as Priority;
    }
    return Priority.GOOD_TO_HAVE;
}

/**
 * Computes a deterministic SHA-256 fingerprint for a normalized transaction candidate.
 */
export function computeTransactionFingerprint(
    amount: Prisma.Decimal,
    date: Date,
    title: string | null,
    source: TransactionSource
): string {
    const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
    const amountStr = amount.toFixed(2);
    const titleStr = (title || "").toLowerCase();

    const payload = `${source}:${amountStr}:${dateStr}:${titleStr}`;
    return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Orchestrates full normalization of untrusted source input into a NormalizedTransactionCandidate.
 */
export function normalizeTransactionInput(
    input: IngestionSourceInput
): NormalizedTransactionCandidate {
    const amount = normalizeAmount(input.amount);
    const transactionDate = normalizeTransactionDate(input.transactionDate);
    const title = normalizeTitle(input.title);
    const notes = normalizeNotes(input.notes);
    const category = normalizeCategory(input.category);
    const priority = normalizePriority(input.priority);
    const source = input.source || TransactionSource.MANUAL;
    const externalId = input.externalId?.trim() || null;
    const sourceMetadata = input.sourceMetadata || null;
    const allowPotentialDuplicate = Boolean(input.allowPotentialDuplicate);

    const fingerprint = computeTransactionFingerprint(
        amount,
        transactionDate,
        title,
        source
    );

    return {
        amount,
        category,
        priority,
        title,
        notes,
        transactionDate,
        source,
        externalId,
        sourceMetadata,
        fingerprint,
        allowPotentialDuplicate,
    };
}

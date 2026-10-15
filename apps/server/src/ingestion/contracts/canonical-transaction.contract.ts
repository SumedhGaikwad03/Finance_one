import { Prisma, Transaction } from "../../generated/prisma/client";
import { Category, Priority, TransactionSource } from "../../generated/prisma/enums";

/**
 * Formalized Canonical Transaction Contract.
 * Represents an accepted financial ledger record in Finance One.
 */
export interface CanonicalTransactionRecord {
    id: number;
    amount: Prisma.Decimal;
    category: Category;
    priority: Priority;
    title: string | null;
    notes: string | null;
    transactionDate: Date;
    userId: number;
    source: TransactionSource;
    externalId: string | null;
    sourceMetadata: Prisma.JsonValue | null;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Type guard confirming an object conforms to the Canonical Transaction contract.
 */
export function isCanonicalTransaction(record: unknown): record is CanonicalTransactionRecord {
    if (!record || typeof record !== "object") return false;
    const r = record as Record<string, unknown>;

    return (
        typeof r.id === "number" &&
        r.amount instanceof Prisma.Decimal &&
        typeof r.category === "string" &&
        typeof r.priority === "string" &&
        r.transactionDate instanceof Date &&
        typeof r.userId === "number" &&
        typeof r.source === "string"
    );
}

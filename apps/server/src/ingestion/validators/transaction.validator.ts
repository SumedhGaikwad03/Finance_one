import { Category, Priority } from "../../generated/prisma/enums";
import {
    NormalizedTransactionCandidate,
    ValidatedTransactionCandidate,
    IngestionValidationError,
} from "../types/ingestion.types";

const MIN_SUPPORTED_DATE = new Date("2000-01-01T00:00:00.000Z");
const MAX_AMOUNT = 100_000_000; // 100 Million ceiling
const MAX_TITLE_LENGTH = 100;
const MAX_NOTES_LENGTH = 500;

export interface ValidationResult {
    isValid: boolean;
    errors: IngestionValidationError[];
    validated?: ValidatedTransactionCandidate;
}

/**
 * Validates a normalized transaction candidate against financial domain invariants.
 */
export function validateTransactionCandidate(
    candidate: NormalizedTransactionCandidate,
    userId: number
): ValidationResult {
    const errors: IngestionValidationError[] = [];

    // 1. Authenticated User Identity Enforcement
    if (!userId || typeof userId !== "number" || userId <= 0 || !Number.isInteger(userId)) {
        errors.push({
            field: "userId",
            code: "INVALID_USER_ID",
            message: "A valid authenticated user ID is required.",
        });
    }

    // 2. Amount Validation
    if (candidate.amount.isZero() || candidate.amount.isNegative()) {
        errors.push({
            field: "amount",
            code: "NON_POSITIVE_AMOUNT",
            message: "Transaction amount must be strictly greater than 0.",
        });
    } else if (candidate.amount.greaterThan(MAX_AMOUNT)) {
        errors.push({
            field: "amount",
            code: "AMOUNT_EXCEEDS_MAXIMUM",
            message: `Transaction amount cannot exceed ${MAX_AMOUNT}.`,
        });
    }

    // Amount precision check (max 2 decimal places for financial currency)
    const decimalPlaces = candidate.amount.decimalPlaces();
    if (decimalPlaces > 2) {
        errors.push({
            field: "amount",
            code: "EXCESSIVE_DECIMAL_PRECISION",
            message: "Transaction amount cannot specify more than 2 decimal places.",
        });
    }

    // 3. Date Range Validation
    if (isNaN(candidate.transactionDate.getTime())) {
        errors.push({
            field: "transactionDate",
            code: "INVALID_DATE",
            message: "Transaction date is invalid.",
        });
    } else {
        if (candidate.transactionDate < MIN_SUPPORTED_DATE) {
            errors.push({
                field: "transactionDate",
                code: "DATE_TOO_EARLY",
                message: "Transaction date cannot be earlier than year 2000.",
            });
        }

        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        if (candidate.transactionDate > oneYearFromNow) {
            errors.push({
                field: "transactionDate",
                code: "DATE_TOO_FAR_FUTURE",
                message: "Transaction date cannot be more than 1 year in the future.",
            });
        }
    }

    // 4. Category & Priority Validation
    if (!Object.values(Category).includes(candidate.category)) {
        errors.push({
            field: "category",
            code: "INVALID_CATEGORY",
            message: `Category '${candidate.category}' is not recognized.`,
        });
    }

    if (!Object.values(Priority).includes(candidate.priority)) {
        errors.push({
            field: "priority",
            code: "INVALID_PRIORITY",
            message: `Priority '${candidate.priority}' is not recognized.`,
        });
    }

    // 5. String Length Bounds
    if (candidate.title && candidate.title.length > MAX_TITLE_LENGTH) {
        errors.push({
            field: "title",
            code: "TITLE_TOO_LONG",
            message: `Title cannot exceed ${MAX_TITLE_LENGTH} characters.`,
        });
    }

    if (candidate.notes && candidate.notes.length > MAX_NOTES_LENGTH) {
        errors.push({
            field: "notes",
            code: "NOTES_TOO_LONG",
            message: `Notes cannot exceed ${MAX_NOTES_LENGTH} characters.`,
        });
    }

    if (errors.length > 0) {
        return {
            isValid: false,
            errors,
        };
    }

    return {
        isValid: true,
        errors: [],
        validated: {
            ...candidate,
            userId,
            isValid: true,
        },
    };
}

import { z } from "zod";

export const recurringQuerySchema = z.object({
    status: z.enum(["POSSIBLE", "CONFIRMED", "DISMISSED"]).optional(),
    type: z.enum(["SUBSCRIPTION", "BILL_PAYMENT", "GENERAL_RECURRING"]).optional(),
    frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "IRREGULAR"]).optional(),
    minConfidence: z
        .string()
        .optional()
        .transform((val) => (val !== undefined ? parseFloat(val) : undefined))
        .pipe(z.number().min(0).max(1).optional()),
    includeDismissed: z
        .string()
        .optional()
        .transform((val) => (val !== undefined ? val === "true" || val === "1" : undefined))
        .optional(),
    lookbackMonths: z
        .string()
        .optional()
        .transform((val) => (val !== undefined ? parseInt(val, 10) : undefined))
        .pipe(z.number().int().min(1).max(60).optional()),
});

export type RecurringQueryInput = z.infer<typeof recurringQuerySchema>;

export const patternIdParamSchema = z.object({
    id: z.string().min(5, "Valid pattern ID is required"),
});

export type PatternIdParam = z.infer<typeof patternIdParamSchema>;

export const confirmPatternSchema = z.object({
    notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export type ConfirmPatternInput = z.infer<typeof confirmPatternSchema>;

import { z } from "zod";
import { Category } from "../../generated/prisma/enums";

export const aiQuestionSchema = z.object({
    question: z.string().min(1),
});

export type AIQuestionInput = z.infer<
    typeof aiQuestionSchema
>;

export const transactionQuerySchema = z.object({
    operation: z.enum([
        "SUM",
        "COUNT",
        "LIST",
        "MAX",
        "MIN",
    ]),

    category: z.nativeEnum(Category).optional(),

    startDate: z.string().datetime().optional(),

    endDate: z.string().datetime().optional(),
});
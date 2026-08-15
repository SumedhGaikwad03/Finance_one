import { z } from "zod";
import { Category } from "../../generated/prisma/enums";
export const aiQuestionSchema = z.object({
    question: z.string().min(1),
});
// now we produce date range schema as we dont yet trust llm fully as it might give some weird type so we double check the op of the 
// system in the flow 
const dateRangeIntentSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("RELATIVE"),
        amount: z
            .number()
            .int()
            .positive(),
        unit: z.enum([
            "DAY",
            "WEEK",
            "MONTH",
            "YEAR",
        ]),
    }),
    z.object({
        type: z.literal("CALENDAR_PERIOD"),
        period: z.enum([
            "TODAY",
            "YESTERDAY",
            "THIS_WEEK",
            "LAST_WEEK",
            "THIS_MONTH",
            "LAST_MONTH",
            "THIS_YEAR",
            "LAST_YEAR",
        ]),
    }),
    z.object({
        type: z.literal("ABSOLUTE"),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
    }),
]);
export const transactionQuerySchema = z.object({
    operation: z.enum([
        "SUM",
        "COUNT",
        "LIST",
        "MAX",
        "MIN",
    ]),
    category: z.nativeEnum(Category).optional(),
    dateRange: dateRangeIntentSchema.optional(),
}).strict();

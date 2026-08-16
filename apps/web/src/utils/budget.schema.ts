import { z } from "zod";

import { BUDGET_PERIODS } from "../constants/budget.constants";

export const createBudgetSchema = z.object({

    amount: z
        .number({
            error: "Budget amount is required",
        })
        .positive(
            "Budget amount must be greater than zero"
        ),

    periodType: z.enum(BUDGET_PERIODS),

    startDate: z
        .string()
        .refine(
            (date) => !isNaN(Date.parse(date)),
            {
                message: "Invalid start date",
            }
        ),

    isLocked: z
        .boolean()
        .optional(),

});

export type CreateBudgetFormData = z.infer<
    typeof createBudgetSchema
>;
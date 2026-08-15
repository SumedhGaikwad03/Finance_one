import {z} from "zod"; 

export const createTransactionSchema = z.object({

    amount : z.number({error : "amount is required",}) 
    .positive("Amount must be greater than zero"),

  category: z.enum([
        "FOOD",
        "FUEL",
        "SHOPPING",
        "BILLS",
        "ENTERTAINMENT",
        "HEALTH",
        "TRAVEL",
        "EDUCATION",
        "SUBSCRIPTION",
        "GIFT",
        "OTHER",
    ]),

    priority: z.enum([
        "ESSENTIAL",
        "GOOD_TO_HAVE",
        "LUXURY",
    ]),

    title: z
        .string()
        .trim()
        .max(50, "Title is too long")
        .optional(),

    notes: z
        .string()
        .trim()
        .max(200, "Notes are too long")
        .optional(),

    transactionDate: z
        .string()
        .refine(
            (date) => !isNaN(Date.parse(date)),
            {
                message: "Invalid date",
            }
        )
        .optional(),

});
export type CreateTransactionFormData = z.infer<
    typeof createTransactionSchema
>;
import {z} from "zod"; 
// right now dupication is possible but later on we can have a shared file that has all the types that depends on the structure of these notes 
// that shared file would help the frontend and backend understand structure without logical coupling 
// this is file that is essentially the zod of the frontend data 

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
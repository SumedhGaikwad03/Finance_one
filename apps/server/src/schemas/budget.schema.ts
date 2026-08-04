import {z} from "zod"; 
import { BudgetPeriod } from "../generated/prisma/enums";

export const createBudgetSchema = z.object({
// here we prase the req body 
amount :  z.number().positive("Budget amount must be greater than 0"),
periodType :  z.enum(BudgetPeriod),
startDate : z.coerce.date(),
isLocked : z.boolean().optional()



}).refine(
    (data) => Object.keys(data).length > 0,
    {
        message: "At least one field is required for creation ."
    }
)
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>; 


export const updateBudgetSchema = z.object({
// here we prase the req body 
amount :  z.number().positive("Budget amount must be greater than 0").optional(),
periodType :  z.enum(BudgetPeriod).optional(),
startDate : z.coerce.date().optional(),
isLocked : z.boolean().optional()



}).refine(
    (data) => Object.keys(data).length > 0,
    {
        message: "At least one field is required for update."
    }
)
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

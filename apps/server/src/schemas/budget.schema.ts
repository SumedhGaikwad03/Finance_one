import {z} from "zod"; 
import { BudgetPeriod } from "../generated/prisma/enums";

export const createBudgetSchema = z.object({
// here we prase the req body 
amount :  z.number().positive("Budget amount must be greater than 0"),
periodType :  z.enum(BudgetPeriod),
startDate : z.coerce.date(),
isLocked : z.boolean().optional()



})
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>; 
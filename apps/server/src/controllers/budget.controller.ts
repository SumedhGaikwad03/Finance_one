import { Request, Response } from "express";
import * as budgetService from "../services/budget.service";
import { createBudgetSchema } from "../schemas/budget.schema";

/**
 * Creates a new budget for the authenticated user.
 */
export const createBudget = async (
    req: Request,
    res: Response
): Promise<void> => {

    // Validate the incoming request body.
    const input = createBudgetSchema.parse(req.body);

    // userId is attached by the authentication middleware.
    const userId = req.user.userId;

    const budget = await budgetService.createBudget(input, userId);

    res.status(201).json(budget);
};

export const getActiveBudget = async ( req: Request,
    res: Response
): Promise<void> => {

 const userId = req.user.userId; // chewing the request 

 const budget = await budgetService.getActiveBudget(userId);

 res.status(200).json(budget); 
}
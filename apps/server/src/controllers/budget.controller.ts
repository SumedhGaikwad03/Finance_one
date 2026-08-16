import { NextFunction, Request, Response } from "express";
import * as budgetService from "../services/budget.service";
import { createBudgetSchema, updateBudgetSchema } from "../schemas/budget.schema";

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


export const getMyBudgets = async (req : Request , res : Response , next : NextFunction  ): Promise<void> => { 

    const userId  = req.user.userId ;  

    const budgets = await budgetService.getMyBudget(userId); 

    res.status(200).json(budgets);





}

export const updateBudget = async (req : Request , res : Response , next : NextFunction  ): Promise<void> => { 

    const id = Number(req.params.id);
    const userId = req.user.userId; 
    const input = updateBudgetSchema.parse(req.body);

    const budget = await budgetService.updateBudget(id,userId,input);

    res.status(200).json(budget); 


    
}

export const deleteBudget = async (req : Request , res : Response , next : NextFunction  ): Promise<void> => { 

     const id = Number(req.params.id);
    const userId = req.user.userId;  

    await budgetService.deleteBudget(id,userId);

    res.sendStatus(204);
}

export const lockBudget = async (req : Request , res : Response , next : NextFunction  ): Promise<void> => { 

    const id = Number(req.params.id);
    const userId = req.user.userId;  

    const budget = await budgetService.lockBudget(id,userId);

     res.status(200).json(budget); 

}
import { NextFunction, Request, Response } from "express";
import * as budgetService from "../services/budget.service";
import * as budgetAlertService from "../services/budget-alert.service";
import { createBudgetSchema, updateBudgetSchema, idParamSchema } from "../schemas/budget.schema";
import { budgetAlertQuerySchema } from "../schemas/budget-alert.schema";
import { AppError } from "../error/AppError";

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

    const { id } = idParamSchema.parse(req.params);
    const userId = req.user.userId; 
    const input = updateBudgetSchema.parse(req.body);

    const budget = await budgetService.updateBudget(id,userId,input);

    res.status(200).json(budget); 


    
}

export const deleteBudget = async (req : Request , res : Response , next : NextFunction  ): Promise<void> => { 

    const { id } = idParamSchema.parse(req.params);
    const userId = req.user.userId;  

    await budgetService.deleteBudget(id,userId);

    res.sendStatus(204);
}

export const lockBudget = async (req : Request , res : Response , next : NextFunction  ): Promise<void> => { 

    const { id } = idParamSchema.parse(req.params);
    const userId = req.user.userId;  

    const budget = await budgetService.lockBudget(id,userId);

     res.status(200).json(budget); 

}

/**
 * Evaluates spending guardrails and returns explainable budget alerts for the active budget.
 */
export const getBudgetAlerts = async (
    req: Request,
    res: Response
): Promise<void> => {
    const userId = req.user.userId;
    const query = budgetAlertQuerySchema.parse(req.query);

    const alertsData = await budgetAlertService.evaluateBudgetAlerts(userId, {
        thresholds: query.thresholds,
        includeDismissed: query.includeDismissed,
    });

    res.status(200).json(alertsData);
};

/**
 * Dismisses a specific budget alert to prevent repeated alert fatigue.
 */
export const dismissBudgetAlert = async (
    req: Request,
    res: Response
): Promise<void> => {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!id || typeof id !== "string") {
        throw new AppError("Alert ID is required", 400);
    }

    budgetAlertService.dismissAlert(userId, id);

    res.status(200).json({
        success: true,
        message: "Alert dismissed successfully",
        alertId: id,
    });
};
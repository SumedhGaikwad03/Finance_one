import { Prisma } from "../generated/prisma/client";
import * as budgetRepository from "../repositories/budget.repository";
import * as budgetschemas from "../schemas/budget.schema";
import { CreateBudgetInput } from "../schemas/budget.schema";
import { calculateEndDate, hasBudgetOverlap } from "../utils/budget.utils";
import {
    AppError,
    BudgetLockedError,
    BudgetNotFoundError
} from "../error/AppError";

export const createBudget = async (
    input: CreateBudgetInput,
    userId: number
) => {

    // Fetch all existing budgets for this user.
    const existingBudgets = await budgetRepository.findBudgetByUser(userId);

    // Prevent overlapping budget periods.
    if (
        hasBudgetOverlap(
            existingBudgets,
            input.startDate,
            input.periodType
        )
    ) {
        throw new AppError(
            "Budget overlaps with an existing budget.",
            409
        );
    }

    return budgetRepository.createBudget({
        amount: new Prisma.Decimal(input.amount),
        periodType: input.periodType,
        startDate: input.startDate,
        isLocked: input.isLocked,
        userId,
    });
};

export const getActiveBudget = async (userId: number) => {

    const existingBudgets = await budgetRepository.findBudgetByUser(userId);

    // this gives us all the budgets in our system
    const todaysDate = new Date();

    // now we have find the budget that is active right now
    for (const budget of existingBudgets) {

        // a call to the fn to find end date
        const endDate = calculateEndDate(
            budget.startDate,
            budget.periodType
        );

        // check is date fall into this range
        if (
            todaysDate >= budget.startDate &&
            todaysDate <= endDate
        ) {
            return budget;
        }
    }

    throw new BudgetNotFoundError("No active budget found.");
};

export const getMyBudget = async (userId: number) => {

    return await budgetRepository.findBudgetByUser(userId);

};

export const updateBudget = async (
    id: number,
    userId: number,
    input: budgetschemas.UpdateBudgetInput
) => {

    const budget = await budgetRepository.findBudgetById(id);
    const existingBudgets = await budgetRepository.findBudgetByUser(userId);

    // checks for ownership and access
    if (!budget || budget.userId !== userId) {
        throw new BudgetNotFoundError(
            "Budget does not exist or user does not have access."
        );
    }

    // locked budgets cannot be updated
    if (budget.isLocked) {
        throw new BudgetLockedError(
            "Budget is locked and cannot be modified."
        );
    }

    // create the updated budget using the existing values
    // and overwrite them with the new values
    const updatedBudget = {
        ...budget,
        ...input
    };

    // check overlap with all other budgets
    if (
        hasBudgetOverlap(
            existingBudgets,
            updatedBudget.startDate,
            updatedBudget.periodType,
            budget.id
        )
    ) {
        throw new AppError(
            "Budget overlaps with an existing budget.",
            409
        );
    }

    return await budgetRepository.updateBudget(id, input);

};
export const deleteBudget = async (id : number , userId : number ) => {

     const budget = await budgetRepository.findBudgetById(id); 

       if (!budget || budget.userId !== userId) {
        throw new BudgetNotFoundError(
            "Budget does not exist or user does not have access."
        );
    }

    // locked budgets cannot be updated
    if (budget.isLocked) {
        throw new BudgetLockedError(
            "Budget is locked and cannot be modified."
        );
    }

    return await budgetRepository.deleteBudget(id); 
}

export const lockBudget = async ( id:number , userId : number) => {

    const budget = await budgetRepository.findBudgetById(id); 

       if (!budget || budget.userId !== userId) {
        throw new BudgetNotFoundError(
            "Budget does not exist or user does not have access."
        );
    }

    // locked budgets cannot be updated
    if (budget.isLocked) {
        throw new BudgetLockedError(
            "Budget is locked and cannot be modified."
        );
    }

     return await budgetRepository.updateBudget(id , {isLocked : true}); // we change the field to be true 



}
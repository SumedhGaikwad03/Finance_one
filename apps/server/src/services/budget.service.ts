import { Prisma } from "../generated/prisma/client";
import * as budgetRepository from "../repositories/budget.repository";
import { CreateBudgetInput } from "../schemas/budget.schema";
import { calculateEndDate } from "../utils/budget.utils";
import { AppError } from "../error/AppError";
import { BudgetNotFoundError } from "../error/AppError";
import { date } from "zod";
import { error } from "node:console";

/**
 * Checks whether two date ranges overlap.
 */
const isOverlapping = (
    startA: Date,
    endA: Date,
    startB: Date,
    endB: Date
): boolean => {
    return startA <= endB && startB <= endA;
};

export const createBudget = async (
    input: CreateBudgetInput,
    userId: number
) => {

    // Fetch all existing budgets for this user.
    const existingBudgets = await budgetRepository.findBudgetByUser(userId);

    const newBudgetEndDate = calculateEndDate(
        input.startDate,
        input.periodType
    );

    // Prevent overlapping budget periods.
    for (const budget of existingBudgets) {

        const existingBudgetEndDate = calculateEndDate(
            budget.startDate,
            budget.periodType
        );

        if (
            isOverlapping(
                input.startDate,
                newBudgetEndDate,
                budget.startDate,
                existingBudgetEndDate
            )
        ) {
            throw new AppError(
                "Budget overlaps with an existing budget.",
                409
            );
        }
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

    // now we have find the bugest that has active right now
    for (const budget of existingBudgets) { // essentiall a lopp thr all budgets

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


import { Prisma } from "../generated/prisma/client";
import * as budgetService from "./budget.service";
import * as transactionRepository from "../repositories/transaction.repository";
import * as analyticsService from "./analytics.services";
import { calculateEndDate } from "../utils/budget.utils";

export const getDashboardData = async (userId: number) => {
    // Step 1: Get the active budget
    const budget = await budgetService.getActiveBudgetOrNull(userId);

    // Step 2: Build the database filter based on budget period or user scope
    let whereClause: Prisma.TransactionWhereInput;

    if (budget) {
        const endDate = calculateEndDate(
            budget.startDate,
            budget.periodType
        );

        whereClause = {
            userId,
            transactionDate: {
                gte: budget.startDate,
                lte: endDate
            }
        };
    } else {
        whereClause = {
            userId
        };
    }

    // Step 3: Run SQL aggregations and fetch recent transactions in parallel via database
    const [
        totalSpent,
        categoryTotals,
        priorityTotals,
        transactionCount,
        largestTransaction,
        recentTransactions
    ] = await Promise.all([
        transactionRepository.aggregateTotalSpent(whereClause),
        transactionRepository.groupCategoryTotals(whereClause),
        transactionRepository.groupPriorityTotals(whereClause),
        transactionRepository.countTransactions(whereClause),
        transactionRepository.findLargestTransaction(whereClause),
        transactionRepository.findRecentTransactions(whereClause, 5)
    ]);

    // Step 4: Calculate budget usage using database-aggregated totalSpent
    const remainingBudget = budget
        ? analyticsService.calculateRemainingBudget(
            budget.amount,
            totalSpent
        )
        : null;

    const budgetUsage = budget
        ? analyticsService.calculateBudgetUsage(
            budget.amount,
            totalSpent
        )
        : null;

    // Step 5: Return complete dashboard data matching the original contract
    return {
        budget,
        recentTransactions,
        totalSpent,
        remainingBudget,
        budgetUsage,
        categoryTotals,
        priorityTotals,
        transactionCount,
        largestTransaction
    };
};
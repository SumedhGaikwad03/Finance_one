import * as budgetService from "./budget.service";
import * as transactionRepository from "../repositories/transaction.repository";
import * as analyticsService from "./analytics.services";
import { calculateEndDate } from "../utils/budget.utils";

export const getDashboardData = async (userId: number) => {
// this call to this function alone makes the call all o the data in our dash board 


    // Step 1 : Get the active budget
    // If there is no active budget, the dashboard should still work.
    const budget =
        await budgetService.getActiveBudgetOrNull(userId);


    let transactions;

    if (budget) {

        // Step 2 : Calculate the end date for the active budget
        const endDate = calculateEndDate(
            budget.startDate,
            budget.periodType
        );

        // Step 3 : Fetch all transactions within this budget period
        transactions =
            await transactionRepository.findTransactionsBetweenDates(
                userId,
                budget.startDate,
                endDate
            );

    } else {

        // If there is no active budget, we still want to show
        // the user's transactions on the dashboard.
        transactions =
            await transactionRepository.getMyTransactions(
                userId
            );

    }


    // Step 4 : Calculate analytics
    const totalSpent =
        analyticsService.calculateTotalSpent(transactions);

    const remainingBudget =
        budget
            ? analyticsService.calculateRemainingBudget(
                budget.amount,
                totalSpent
            )
            : null;

    const budgetUsage =
        budget
            ? analyticsService.calculateBudgetUsage(
                budget.amount,
                totalSpent
            )
            : null;

    const categoryTotals =
        analyticsService.calculateCategoryTotals(
            transactions
        );

    const priorityTotals =
        analyticsService.calculatePriorityTotals(
            transactions
        );

    const transactionCount =
        analyticsService.calculateTransactionCount(
            transactions
        );

    const largestTransaction =
        analyticsService.calculateLargestTransaction(
            transactions
        );

    const averageDailySpend =
       analyticsService.calculateAverageDailySpend(
           transactions
       );

    const averageTransaction =
        analyticsService.calculateAverageTransaction(
            transactions
        );

    // Step 5 : Return everything needed by the dashboard
    return {

        budget,

        recentTransactions: transactions,

        totalSpent,

        remainingBudget,

        budgetUsage,

        categoryTotals,

        priorityTotals,

        transactionCount,

        largestTransaction

    };

};
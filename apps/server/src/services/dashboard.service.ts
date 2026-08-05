import * as budgetService from "./budget.service";
import * as transactionRepository from "../repositories/transaction.repository";
import * as analyticsService from "./analytics.services";
import { calculateEndDate } from "../utils/budget.utils";

export const getDashboardData = async (userId: number) => {
// this call to this function alone makes the call all o the data in our dash board 


    // Step 1 : Get the active budget
    const budget = await budgetService.getActiveBudget(userId);

    // Step 2 : Calculate the end date for the active budget
    const endDate = calculateEndDate(
        budget.startDate,
        budget.periodType
    );

    // Step 3 : Fetch all transactions within this budget period
    const transactions =
        await transactionRepository.findTransactionsBetweenDates(
            userId,
            budget.startDate,
            endDate
        );

    // Step 4 : Calculate analytics
    const totalSpent =
        analyticsService.calculateTotalSpent(transactions);

    const remainingBudget =
        analyticsService.calculateRemainingBudget(
            budget.amount,
            totalSpent
        );

    const budgetUsage =
        analyticsService.calculateBudgetUsage(
            budget.amount,
            totalSpent
        );

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
       analyticsService.calculateAverageDailySpend(transactions);  
       
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
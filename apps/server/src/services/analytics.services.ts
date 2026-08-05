// Pure business calculations.
// No Express, Prisma queries, or HTTP concerns.
// This file acts as the application's financial calculation engine.

import { Prisma, Transaction } from "../generated/prisma/client";
import { Category, Priority } from "../generated/prisma/enums";

/**
 * Calculates the total amount spent across all transactions.
 */
export const calculateTotalSpent = (
    transactions: Transaction[]
): Prisma.Decimal => {

    return transactions.reduce(

        (total, transaction) =>
            total.plus(transaction.amount),

        new Prisma.Decimal(0)

    );

};

/**
 * Calculates the remaining budget.
 */
export const calculateRemainingBudget = (
    budgetAmount: Prisma.Decimal,
    totalSpent: Prisma.Decimal
): Prisma.Decimal => {

    return budgetAmount.minus(totalSpent);

};

/**
 * Calculates the percentage of the budget that has been used.
 */
export const calculateBudgetUsage = (
    budgetAmount: Prisma.Decimal,
    totalSpent: Prisma.Decimal
): number => {

    return totalSpent
        .div(budgetAmount)
        .mul(100)
        .toNumber();

};

/**
 * Calculates the total spending for each transaction category.
 */
export const calculateCategoryTotals = (
    transactions: Transaction[]
): Partial<Record<Category, Prisma.Decimal>> => {

    return transactions.reduce(

        (categoryTotals, transaction) => {

            // check if this category already has a running total
            const currentTotal =
                categoryTotals[transaction.category];

            if (currentTotal) {

                // category already exists so accumulate the amount
                categoryTotals[transaction.category] =
                    currentTotal.plus(transaction.amount);

            } else {

                // first transaction for this category
                categoryTotals[transaction.category] =
                    transaction.amount;

            }

            return categoryTotals;

        },

        {} as Partial<Record<Category, Prisma.Decimal>>

    );

};

/**
 * Calculates the total spending for each priority.
 */
export const calculatePriorityTotals = (
    transactions: Transaction[]
): Partial<Record<Priority, Prisma.Decimal>> => {

    return transactions.reduce(
      

        (priorityTotals, transaction) => {

            const currentTotal =
                priorityTotals[transaction.priority];

            if (currentTotal) {

                priorityTotals[transaction.priority] =
                    currentTotal.plus(transaction.amount);

            } else {

                priorityTotals[transaction.priority] =
                    transaction.amount;

            }

            return priorityTotals;

        },

        {} as Partial<Record<Priority, Prisma.Decimal>>

    );

};

/**
 * Calculates the total number of transactions.
 */
export const calculateTransactionCount = (
    transactions: Transaction[]
): number => {

    return transactions.length;

};

/**
 * Returns the largest transaction.
 */
export const calculateLargestTransaction = (
    transactions: Transaction[]
): Transaction | null => {

    if (transactions.length === 0) {
        return null;
    }

    let largestTransaction = transactions[0];

    for (let i = 1; i < transactions.length; i++) {

        if (
            transactions[i].amount.greaterThan(
                largestTransaction.amount
            )
        ) {
            largestTransaction = transactions[i];
        }

    }

    return largestTransaction;

};

/**
 * Calculates the average transaction amount.
 */
export const calculateAverageTransaction = (
    transactions: Transaction[]
): Prisma.Decimal => {
// assumes that the range is supled is the range we wnat to perfoem avg on 
    const transactionCount =
        calculateTransactionCount(transactions);

    if (transactionCount === 0) {
        return new Prisma.Decimal(0);
    }

    const totalSpent =
        calculateTotalSpent(transactions);

    return totalSpent.div(transactionCount);

};

/**
 * Calculates the average daily spending.
 */
export const calculateAverageDailySpend = (
    transactions: Transaction[]
): Prisma.Decimal => {

    if (transactions.length === 0) {
        return new Prisma.Decimal(0);
    }

    const totalSpent =
        calculateTotalSpent(transactions);

    let earliestDate = transactions[0].transactionDate;
    let latestDate = transactions[0].transactionDate;

    for (const transaction of transactions) {

        if (transaction.transactionDate < earliestDate) {
            earliestDate = transaction.transactionDate;
        }

        if (transaction.transactionDate > latestDate) {
            latestDate = transaction.transactionDate;
        }

    }

    // this point we have thw the fiest and the last traction of the range 

   const MILLISECONDS_PER_DAY =
    1000 * 60 * 60 * 24;

    const totalDays =
        Math.floor(
            (latestDate.getTime() - earliestDate.getTime()) /
            MILLISECONDS_PER_DAY
        ) + 1;
// this above block gives us the  range of days thta has passed 
    return totalSpent.div(totalDays);

};
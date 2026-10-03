import { Prisma, Transaction } from "../generated/prisma/client";
import { Category, Priority } from "../generated/prisma/enums";
import * as transactionRepository from "../repositories/transaction.repository";

/**
 * Calculates the total amount spent across all transactions via database aggregation.
 */
export const aggregateTotalSpent = async (
    where: Prisma.TransactionWhereInput
): Promise<Prisma.Decimal> => {
    return transactionRepository.aggregateTotalSpent(where);
};

/**
 * Calculates the total spending for each transaction category via database groupBy.
 */
export const aggregateCategoryTotals = async (
    where: Prisma.TransactionWhereInput
): Promise<Partial<Record<Category, Prisma.Decimal>>> => {
    return transactionRepository.groupCategoryTotals(where);
};

/**
 * Calculates the total spending for each priority via database groupBy.
 */
export const aggregatePriorityTotals = async (
    where: Prisma.TransactionWhereInput
): Promise<Partial<Record<Priority, Prisma.Decimal>>> => {
    return transactionRepository.groupPriorityTotals(where);
};

/**
 * Calculates the total number of transactions via database count.
 */
export const countTransactions = async (
    where: Prisma.TransactionWhereInput
): Promise<number> => {
    return transactionRepository.countTransactions(where);
};

/**
 * Returns the largest transaction in a set via database order by and limit.
 */
export const findLargestTransaction = async (
    where: Prisma.TransactionWhereInput
): Promise<Transaction | null> => {
    return transactionRepository.findLargestTransaction(where);
};

/**
 * Calculates the average transaction amount via database aggregation.
 */
export const aggregateAverageTransaction = async (
    where: Prisma.TransactionWhereInput
): Promise<Prisma.Decimal> => {
    return transactionRepository.aggregateAverageTransaction(where);
};

/**
 * Calculates the average daily spending using aggregated total and database min/max dates.
 */
export const aggregateDailySpend = async (
    where: Prisma.TransactionWhereInput
): Promise<Prisma.Decimal> => {
    return transactionRepository.aggregateDailySpend(where);
};

/**
 * Calculates the remaining budget given budget amount and total spent.
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
    if (budgetAmount.isZero()) {
        return 0;
    }
    return totalSpent
        .div(budgetAmount)
        .mul(100)
        .toNumber();
};

/**
 * In-memory fallback calculation for total spent (backwards compatible).
 */
export const calculateTotalSpent = (
    transactions: Transaction[]
): Prisma.Decimal => {
    return transactions.reduce(
        (total, transaction) => total.plus(transaction.amount),
        new Prisma.Decimal(0)
    );
};

/**
 * In-memory fallback calculation for category totals (backwards compatible).
 */
export const calculateCategoryTotals = (
    transactions: Transaction[]
): Partial<Record<Category, Prisma.Decimal>> => {
    return transactions.reduce(
        (categoryTotals, transaction) => {
            const currentTotal = categoryTotals[transaction.category];
            if (currentTotal) {
                categoryTotals[transaction.category] = currentTotal.plus(transaction.amount);
            } else {
                categoryTotals[transaction.category] = transaction.amount;
            }
            return categoryTotals;
        },
        {} as Partial<Record<Category, Prisma.Decimal>>
    );
};

/**
 * In-memory fallback calculation for priority totals (backwards compatible).
 */
export const calculatePriorityTotals = (
    transactions: Transaction[]
): Partial<Record<Priority, Prisma.Decimal>> => {
    return transactions.reduce(
        (priorityTotals, transaction) => {
            const currentTotal = priorityTotals[transaction.priority];
            if (currentTotal) {
                priorityTotals[transaction.priority] = currentTotal.plus(transaction.amount);
            } else {
                priorityTotals[transaction.priority] = transaction.amount;
            }
            return priorityTotals;
        },
        {} as Partial<Record<Priority, Prisma.Decimal>>
    );
};

/**
 * In-memory fallback calculation for transaction count (backwards compatible).
 */
export const calculateTransactionCount = (
    transactions: Transaction[]
): number => {
    return transactions.length;
};

/**
 * In-memory fallback calculation for largest transaction (backwards compatible).
 */
export const calculateLargestTransaction = (
    transactions: Transaction[]
): Transaction | null => {
    if (transactions.length === 0) {
        return null;
    }
    let largestTransaction = transactions[0];
    for (let i = 1; i < transactions.length; i++) {
        if (transactions[i].amount.greaterThan(largestTransaction.amount)) {
            largestTransaction = transactions[i];
        }
    }
    return largestTransaction;
};

/**
 * In-memory fallback calculation for average transaction (backwards compatible).
 */
export const calculateAverageTransaction = (
    transactions: Transaction[]
): Prisma.Decimal => {
    const transactionCount = calculateTransactionCount(transactions);
    if (transactionCount === 0) {
        return new Prisma.Decimal(0);
    }
    const totalSpent = calculateTotalSpent(transactions);
    return totalSpent.div(transactionCount);
};

/**
 * In-memory fallback calculation for average daily spend (backwards compatible).
 */
export const calculateAverageDailySpend = (
    transactions: Transaction[]
): Prisma.Decimal => {
    if (transactions.length === 0) {
        return new Prisma.Decimal(0);
    }
    const totalSpent = calculateTotalSpent(transactions);
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

    const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
    const totalDays =
        Math.floor(
            (latestDate.getTime() - earliestDate.getTime()) / MILLISECONDS_PER_DAY
        ) + 1;

    return totalSpent.div(totalDays > 0 ? totalDays : 1);
};
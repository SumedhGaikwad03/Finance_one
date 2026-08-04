// Pure business calculations.
// No Express, Prisma queries, or HTTP concerns.
// This file acts as the application's financial calculation engine.

import { Prisma, Transaction } from "../generated/prisma/client";
import { Category } from "../generated/prisma/enums";

/**
 * Calculates the total amount spent across all transactions.
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
 * Calculates how much budget is remaining.
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
): Partial<Record<Category, Prisma.Decimal>> => { // the retrun type basicaly is "An object whose keys are K and whose values are V."

    return transactions.reduce(

        (categoryTotals, transaction) => { // catgory toals is obj of the cat and its total 

            // get the current total for this category if it already exists
            const currentTotal = categoryTotals[transaction.category]; // as catgory also revoves then makes the tr as 

            /*Let's substitute the value.

transaction.category

↓

"SHOPPING"

So the line becomes:

const currentTotal = categoryTotals["SHOPPING"];

Now imagine you're opening a dictionary.

categoryTotals

┌───────────┬──────────────┐
│ FOOD      │ Decimal(700) │
├───────────┼──────────────┤
│ SHOPPING  │ Decimal(300) │  ← We look here
├───────────┼──────────────┤
│ FUEL      │ Decimal(100) │
└───────────┴──────────────┘ */
            if (currentTotal) { // the catgory we added exits yes /no 

                // category already exists so add the new amount
                categoryTotals[transaction.category] =
                    currentTotal.plus(transaction.amount);
 
            } else { // if it does not exits make one 

                // first transaction for this category
                categoryTotals[transaction.category] =
                    transaction.amount;

            }

            return categoryTotals;

        },

        {} as Partial<Record<Category, Prisma.Decimal>>

    );

};
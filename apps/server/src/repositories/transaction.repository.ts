import { Prisma, Transaction } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import {Category , Priority} from "../generated/prisma/enums";
import { updateUserInput } from "../schemas/user.schema"; 
import * as transactionSchemas from  "../schemas/transaction.schema";



export type CreateTransactionData = { // this is an intrnal contract ,  this makes the contract in par with the reposity ways of stroring 
    // things as it should not have knowledge of above layers 
    amount : Prisma.Decimal ;
    category :  Category;
    priority : Priority;
    title ?: string ;
    notes ? : string ;
    transactionDate : Date ;
    userId : number ;
};

export type TransactionFilters = {
    userId: number;
    category?: Category;
    startDate?: Date;
    endDate?: Date;
}; // this is used take in the info and struture it for later use 

export const createTransaction = (transaction : CreateTransactionData) => {

    return prisma.transaction.create({data: {...transaction,}}); }


    export const getMyTransactions =  async (userId : number) => {

        return prisma.transaction.findMany({where : {userId}, orderBy : {transactionDate : "desc"}}); 
        // this gives all the tractions for a user 

    }

export const findTransactionById = ( id : number) =>  { 

    return prisma.transaction.findUnique({where :{id} }); 





}

export const updateTransaction = async (
    id: number,
    input: transactionSchemas.UpdateTransactionInput
) => {

    const data = {
        ...input,

        ...(input.amount !== undefined && {
            amount: new Prisma.Decimal(input.amount),
        }),

        ...(input.transactionDate !== undefined && {
            transactionDate: new Date(input.transactionDate),
        }),
    };

    return prisma.transaction.update({
        where: {
            id: id
        },

        data
    });
}



export const deleteTransaction = async ( id:number ) => {

    return prisma.transaction.delete({where :{ id}  }); 

}

export const findTransactionsBetweenDates = (
    userId: number,
    startDate: Date,
    endDate: Date
) => {
return prisma.transaction.findMany({
    where: {
        userId,
        transactionDate: {
            gte: startDate,
            lte: endDate,
        },
    },
     orderBy: {
            transactionDate: "desc",
        },

        // take : 5 tis comes at a later part of the system 
});
} 

export const findTransactionsByFilters = (
    filters: TransactionFilters
) => {
    return prisma.transaction.findMany({
        where: {
            userId: filters.userId,

            ...(filters.category && {
                category: filters.category,
            }),

            ...((filters.startDate || filters.endDate) && {
                transactionDate: {
                    ...(filters.startDate && {
                        gte: filters.startDate,
                    }),

                    ...(filters.endDate && {
                        lte: filters.endDate,
                    }),
                },
            }),
        },

        orderBy: {
            transactionDate: "desc",
        },
    });
};

export const findTransactions = async (
    userId: number,
    query: transactionSchemas.TransactionQuery
): Promise<Transaction[]> => {
    const where: Prisma.TransactionWhereInput = {
        userId,
        ...(query.categories && query.categories.length > 0 && {
            category: { in: query.categories },
        }),
        ...(query.priorities && query.priorities.length > 0 && {
            priority: { in: query.priorities },
        }),
        ...((query.startDate || query.endDate) && {
            transactionDate: {
                ...(query.startDate && { gte: query.startDate }),
                ...(query.endDate && { lte: query.endDate }),
            },
        }),
        ...((query.minAmount !== undefined || query.maxAmount !== undefined) && {
            amount: {
                ...(query.minAmount !== undefined && { gte: new Prisma.Decimal(query.minAmount) }),
                ...(query.maxAmount !== undefined && { lte: new Prisma.Decimal(query.maxAmount) }),
            },
        }),
        ...(query.search && {
            OR: [
                { title: { contains: query.search, mode: "insensitive" } },
                { notes: { contains: query.search, mode: "insensitive" } },
            ],
        }),
    };

    return prisma.transaction.findMany({
        where,
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
        orderBy: {
            [query.sortBy ?? "transactionDate"]: query.sortDirection ?? "desc",
        },
    });
};


export const aggregateTotalSpent = async (
    where: Prisma.TransactionWhereInput
): Promise<Prisma.Decimal> => {
    const result = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where
    });
    return result._sum.amount ?? new Prisma.Decimal(0);
};

export const countTransactions = async (
    where: Prisma.TransactionWhereInput
): Promise<number> => {
    return prisma.transaction.count({ where });
};

export const groupCategoryTotals = async (
    where: Prisma.TransactionWhereInput
): Promise<Partial<Record<Category, Prisma.Decimal>>> => {
    const groups = await prisma.transaction.groupBy({
        by: ["category"],
        _sum: { amount: true },
        where
    });

    const categoryTotals: Partial<Record<Category, Prisma.Decimal>> = {};
    for (const group of groups) {
        categoryTotals[group.category] = group._sum.amount ?? new Prisma.Decimal(0);
    }
    return categoryTotals;
};

export const groupPriorityTotals = async (
    where: Prisma.TransactionWhereInput
): Promise<Partial<Record<Priority, Prisma.Decimal>>> => {
    const groups = await prisma.transaction.groupBy({
        by: ["priority"],
        _sum: { amount: true },
        where
    });

    const priorityTotals: Partial<Record<Priority, Prisma.Decimal>> = {};
    for (const group of groups) {
        priorityTotals[group.priority] = group._sum.amount ?? new Prisma.Decimal(0);
    }
    return priorityTotals;
};

export const findLargestTransaction = async (
    where: Prisma.TransactionWhereInput
): Promise<Transaction | null> => {
    return prisma.transaction.findFirst({
        where,
        orderBy: { amount: "desc" }
    });
};

export const findRecentTransactions = async (
    where: Prisma.TransactionWhereInput,
    take: number = 5
): Promise<Transaction[]> => {
    return prisma.transaction.findMany({
        where,
        orderBy: { transactionDate: "desc" },
        take
    });
};

export const aggregateAverageTransaction = async (
    where: Prisma.TransactionWhereInput
): Promise<Prisma.Decimal> => {
    const result = await prisma.transaction.aggregate({
        _avg: { amount: true },
        where
    });
    return result._avg.amount ? new Prisma.Decimal(result._avg.amount) : new Prisma.Decimal(0);
};

export const aggregateDailySpend = async (
    where: Prisma.TransactionWhereInput
): Promise<Prisma.Decimal> => {
    const [totalSpent, dateRange] = await Promise.all([
        aggregateTotalSpent(where),
        prisma.transaction.aggregate({
            _min: { transactionDate: true },
            _max: { transactionDate: true },
            where
        })
    ]);

    if (!dateRange._min.transactionDate || !dateRange._max.transactionDate) {
        return new Prisma.Decimal(0);
    }

    const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
    const totalDays =
        Math.floor(
            (dateRange._max.transactionDate.getTime() - dateRange._min.transactionDate.getTime()) /
                MILLISECONDS_PER_DAY
        ) + 1;

    return totalSpent.div(totalDays > 0 ? totalDays : 1);
};
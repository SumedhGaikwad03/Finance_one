import { Prisma } from "../generated/prisma/client";
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
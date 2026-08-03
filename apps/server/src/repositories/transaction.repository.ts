import { Prisma } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import {Category , Priority} from "../generated/prisma/enums";

export type CreateTransactionData = { // this is an intrnal contract
    amount : number ;
    category :  Category;
    priority : Priority;
    title ?: string ;
    notes ? : string ;
    transactionDate : Date ;
    userId : number ;
};

export const createTransaction = (transaction : CreateTransactionData) => {

    return prisma.transaction.create({data: {...transaction, amount : new Prisma.Decimal(transaction.amount)}}); }


    export const getMyTransactions =  async (userId : number) => {

        return prisma.transaction.findMany({where : {userId}, orderBy : {transactionDate : "desc"}}); 
        // this gives all the tractions for a user 

    }
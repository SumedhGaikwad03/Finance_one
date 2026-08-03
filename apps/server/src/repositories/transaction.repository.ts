import { Prisma } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import {Category , Priority} from "../generated/prisma/enums";
import { updateUserInput } from "../schemas/user.schema"; 
import * as transactionSchemas from  "../schemas/transaction.schema";


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

export const findTransactionById = ( id : number) =>  { 

    return prisma.transaction.findUnique({where :{id} }); 





}

export const updateTransaction = async ( id : number , input : transactionSchemas.UpdateTransactionInput  ) => { 

   const data = {
    ...input,

    ...(input.amount !== undefined && {
        amount: new Prisma.Decimal(input.amount),
    }),
};

    return prisma.transaction.update({
        where : {

           id : id  

        }, 

        data: input 
    })

    




}

export const deleteTransaction = async ( id:number ) => {

    return prisma.transaction.delete({where :{ id}  }); 

}
import { CreateTransactionInput, UpdateTransactionInput, TransactionQuery } from "../schemas/transaction.schema";
import * as transactionRepository from "../repositories/transaction.repository";
import { TransactionNotFoundError, BadRequestError, ConflictError } from "../error/AppError";
import { Prisma } from "../generated/prisma/client";
import { TransactionSource } from "../generated/prisma/enums";
import { ingestTransaction } from "../ingestion/services/ingestion.service";

export const createTransaction = async (input: CreateTransactionInput, userId: number) => {
    const result = await ingestTransaction(
        {
            ...input,
            source: TransactionSource.MANUAL,
        },
        { userId }
    );

    if (result.status === "VALIDATION_FAILED") {
        throw new BadRequestError(result.errors?.[0]?.message || "Validation failed");
    }

    if (result.status === "CONFIRMED_DUPLICATE") {
        return result.transaction!;
    }

    if (result.status === "POTENTIAL_DUPLICATE") {
        throw new ConflictError(
            result.duplicateInfo?.reason ||
            "A transaction with identical amount and title was just created. Please confirm before submitting again."
        );
    }

    return result.transaction!;
};   

export const queryTransactions = async (userId: number, query: TransactionQuery) => {
    return transactionRepository.findTransactions(userId, query);
};

export const queryTransactionsWithCount = async (userId: number, query: TransactionQuery) => {
    return transactionRepository.findTransactionsWithCount(userId, query);
};

export const getTransactionById = async (id: number, userId: number) => {
    const transaction = await transactionRepository.findTransactionById(id);
    if (!transaction || transaction.userId !== userId) {
        throw new TransactionNotFoundError("Transaction does not exist or user does not have access");
    }
    return transaction;
};

export const getMyTransactions = async (userId :number )=> {

    const transactions = await transactionRepository.getMyTransactions(userId);

    return transactions;
}



export const updateTransaction = async (id : number , userId : number ,  input : UpdateTransactionInput) => { 

    const transaction = await transactionRepository.findTransactionById(id); 

      if( !transaction || transaction.userId !== userId){

        throw new TransactionNotFoundError("Transaction does not exists or user does not have access"); 
    }
// this is resource enumaration babyyy 
    



    return  transactionRepository.updateTransaction(id,input);
// no need for await cuz we are not doing anything with the data yet 




}
export const deleteTransaction = async ( id:number , userId : number ) => {
     // same logic to check is transaction exits and user owns it we do this 
        const transaction = await transactionRepository.findTransactionById(id); 

      if( !transaction || transaction.userId !== userId){

        throw new TransactionNotFoundError("Transaction does not exists or user does not have access"); 
    }

    return transactionRepository.deleteTransaction(id );
}
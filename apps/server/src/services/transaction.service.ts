import { CreateTransactionInput, UpdateTransactionInput } from "../schemas/transaction.schema";
import * as transactionRepository from "../repositories/transaction.repository";
import { TransactionNotFoundError } from "../error/AppError";
// user id is attaced the traction suppiled by the user 


export const createTransaction = async ( input : CreateTransactionInput , userId : number ) => {

    const transaction = await transactionRepository.createTransaction({
    ...input,
    transactionDate: input.transactionDate
        ? new Date(input.transactionDate)
        : new Date(),
    userId, });

    return transaction;
}   

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
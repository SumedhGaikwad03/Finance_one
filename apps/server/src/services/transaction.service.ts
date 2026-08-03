import { CreateTransactionInput } from "../schemas/transaction.schema";
import * as transactionRepository from "../repositories/transaction.repository";
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
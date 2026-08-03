import {Request , Response , NextFunction} from "express"; 

import { createTransactionSchema} from "../schemas/transaction.schema";
import * as transactionService from "../services/transaction.service";


export async function createTransaction(
    req : Request ,
    res : Response ,
    next : NextFunction
): Promise<void> {

    const input = createTransactionSchema.parse(req.body); // this will validate the input data and if it is 
    // valid then it will return the input data otherwise it will throw an error
 // validation is completed then 

 const userId = req.user.userId; // this is the user id that we have set in the auth middleware after verifying 
 // the token and then we can use this user id to find the user in the database or in this case in the users array

 const transaction = await transactionService.createTransaction(input, userId); // this will call the service function to create the
 //  transaction and then it will return the transaction data 

 res.status(201).json(transaction); // this will return the transaction data to the client with status code 201

}
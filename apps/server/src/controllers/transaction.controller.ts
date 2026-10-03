import {Request , Response , NextFunction} from "express"; 

import {
    createTransactionSchema,
    updateTransactionSchema,
    parseTransactionSchema,
    quickTransactionSchema,
    transactionQueryInputSchema,
    toCanonicalTransactionQuery,
} from "../schemas/transaction.schema";
import * as transactionService from "../services/transaction.service";
import { parseQuickTransaction } from "../utils/transactionParser";


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

export async function queryTransactions(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const userId = req.user.userId;
    const validatedInput = transactionQueryInputSchema.parse(req.query);
    const domainQuery = toCanonicalTransactionQuery(validatedInput);

    const transactions = await transactionService.queryTransactions(userId, domainQuery);
    res.status(200).json(transactions);
}

export async function getMyTransactions(
    req : Request ,
    res : Response ,
    next : NextFunction
): Promise<void> {

    const userId = req.user.userId; // this is the user id that we have set in the auth middleware after verifying

    const transactions = await transactionService.getMyTransactions(userId); // this will call the service function to get the
    // transactions for users 
    res.status(200).json(transactions); // this will return the transactions data to the client with status code 200 
}


export async function updateTransaction(
    req : Request ,
    res : Response ,
    next : NextFunction
): Promise<void> { 
   const userId = req.user.userId;
   const transactionId = Number (req.params.id);
   const input = updateTransactionSchema.parse(req.body);

   const transaction = await transactionService.updateTransaction( transactionId,
    userId,
    input);

   res.status(200).json(transaction);

}

export async function deleteTransaction (
      req : Request ,
    res : Response ,
    next : NextFunction
): Promise<void> { 
     const userId = req.user.userId;
   const Id = Number (req.params.id);
 

   await transactionService.deleteTransaction(Id , userId); 

   res.sendStatus(204);
}

export async function parseTransaction(
    req: Request,
    res: Response
): Promise<void> {
    const { text } = parseTransactionSchema.parse(req.body);
    const parsed = parseQuickTransaction(text);
    res.status(200).json(parsed);
}

export async function createQuickTransaction(
    req: Request,
    res: Response
): Promise<void> {
    const input = quickTransactionSchema.parse(req.body);
    const userId = req.user.userId;

    const parsed = parseQuickTransaction(input.text);

    const resolvedAmount = input.amount ?? parsed.amount;
    if (resolvedAmount === null || resolvedAmount === undefined || resolvedAmount <= 0) {
        res.status(400).json({
            message: "Could not detect a valid amount. Please specify an amount (e.g. '450 lunch').",
            parsed
        });
        return;
    }

    const canonicalInput = createTransactionSchema.parse({
        amount: resolvedAmount,
        category: input.category ?? parsed.category,
        priority: input.priority ?? parsed.priority,
        title: input.title ?? parsed.title,
        notes: input.notes ?? parsed.notes,
        transactionDate: input.transactionDate ?? parsed.transactionDate
    });

    const transaction = await transactionService.createTransaction(canonicalInput, userId);
    res.status(201).json(transaction);
}

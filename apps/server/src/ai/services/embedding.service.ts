import type { Transaction } from "../../generated/prisma/client";
import type { TransactionDocument } from "../types/ai.types";
import { formatTransactionsDate } from "../utils/date.utils";
import {openai} from "../config/openai"; // open ai client is imported 
import { embeddingProvider } from "../config/embedding";
/**
 * Converts a database transaction into
 * a document that AI models can understand.
 */
export const buildTransactionDocument = (

    transaction: Transaction

): TransactionDocument => {

    const content =

`Transaction Title: ${transaction.title ?? "Untitled Transaction"}

Amount: ₹${transaction.amount}

Category: ${transaction.category}

Priority: ${transaction.priority}

Transaction Date: ${formatTransactionsDate(transaction.transactionDate)}

Notes: ${transaction.notes ?? "No Notes"}
`;

    return {

        content,

        metadata: {

            transactionId: transaction.id,

            userId: transaction.userId,

            category: transaction.category,

            priority: transaction.priority,

            transactionDate: transaction.transactionDate,

        },

    };

};

// this makes the title more human friendly and the document worth passing to the llm 

//now its time to build a function that is responsible for embedding in our system 
// this is now the center piece of the entire data system 
// makes human redble text into vectors 




export const generateEmbedding = async (
    text : string, 

  
    // modulaer 
) : Promise<number[]> => { 



    return embeddingProvider.generateEmbedding(text); // simple as we already imported the embedding provider 

    

}


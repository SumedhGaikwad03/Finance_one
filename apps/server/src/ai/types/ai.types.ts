// Represents a document that will be stored
// inside the vector database.

export interface TransactionDocument {

    content: string;

    metadata: {

        transactionId: number;

        userId: number;

        category: string;

        priority: string;

        transactionDate: Date;

    };

}

// User question received by the AI.

export interface AIQuestion {

    question: string;

}

// AI response returned to the frontend.

export interface AIAnswer {

    answer: string;

}
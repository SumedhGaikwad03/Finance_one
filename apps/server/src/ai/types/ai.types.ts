// Represents a document that will be stored
// inside the vector database.
// types define structe of data object 
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

// defining what a skill looks like for ai 

export interface AiSkill {

    id : string ;

    name : string ; 

    description : string ; 

    examples : string[]; // these are used for semantic represtation for comparing questions and determining intent 

    requirements : string[]; // the info that the skills need 



}
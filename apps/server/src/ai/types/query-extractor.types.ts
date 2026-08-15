import { AIQuestion } from "./ai.types";
import { TransactionQuery } from "./transaction-query.types";
// this is basically an contract of how the query extractor should structure itself 

export interface QueryExtractor {
    extract(
        question: AIQuestion
    ): Promise<TransactionQuery>;
}
 // this below is abstraction for llm providers 
export interface LLMProvider {

    generate(prompt : string ) : Promise<string> ;  // specifies the object must have an spefic function called generate with the same 
    //params and argments 
}
// archetuctlly speaking this should be in this file right but we will chage it later 

// this is basically an contract of how the query extractor should structure itself 

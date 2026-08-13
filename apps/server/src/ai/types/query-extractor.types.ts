import { AIQuestion } from "./ai.types";
import { TransactionQuery } from "./transaction-query.types";

export interface QueryExtractor {
    extract(
        question: AIQuestion
    ): Promise<TransactionQuery>;
}

export interface LLMProvider {

    generate(prompt : string ) : Promise<string> ; 
}
// archetuctlly speaking this should be in this file right but we will chage it later 
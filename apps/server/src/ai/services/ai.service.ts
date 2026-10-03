// this is the file that extracts the questions for us 
import { AIQuestionInput } from "../schemas/question.schema";

export const queryTransactions = async (input: AIQuestionInput, userId: number) => {
    return {
        message: "AI query pipeline stub",
        userId,
        input,
    };
};
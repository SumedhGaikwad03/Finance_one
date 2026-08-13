import { Request, Response } from "express";
import * as aiService from "../services/ai.service";
import { aiQuestionSchema } from "../schemas/question.schema"; 
// we have to define the question schema 


export const queryTransactions = async (
    req: Request,
    res: Response
): Promise<void> => {

    const input = aiQuestionSchema.parse(req.body); // validation  

    const userId = req.user.userId; // user id attached for middele ware 

    const result = await aiService.queryTransactions(
        input,
        userId
    );

    res.status(200).json(result);
}; 
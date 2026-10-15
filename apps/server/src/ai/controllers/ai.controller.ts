import { Request, Response } from "express";
import * as aiService from "../services/ai.service";
import { aiQuestionSchema } from "../schemas/question.schema";
import { UnauthorizedError } from "../../error/AppError";

export const queryTransactions = async (
    req: Request,
    res: Response
): Promise<void> => {
    if (!req.user || !req.user.userId) {
        throw new UnauthorizedError("Authentication required for AI financial queries");
    }

    const input = aiQuestionSchema.parse(req.body);
    const userId = req.user.userId;

    const result = await aiService.queryTransactions(input, userId);
    res.status(200).json(result);
};
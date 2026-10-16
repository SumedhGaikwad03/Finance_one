import { Request, Response } from "express";
import * as insightsService from "../services/insights.service";
import { monthlyInsightsQuerySchema } from "../schemas/insights.schema";

export const getMonthlyInsights = async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const query = monthlyInsightsQuerySchema.parse(req.query);

    const insights = await insightsService.getMonthlyInsights(userId, query);
    res.status(200).json(insights);
};

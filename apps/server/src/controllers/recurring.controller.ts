import { Request, Response } from "express";
import { recurringService } from "../services/recurring.service";
import {
    confirmPatternSchema,
    patternIdParamSchema,
    recurringQuerySchema,
} from "../schemas/recurring.schema";

export async function getRecurringPatterns(req: Request, res: Response): Promise<void> {
    const userId = req.user.userId;
    const query = recurringQuerySchema.parse(req.query);

    const result = await recurringService.getRecurringPatterns(userId, query);
    res.status(200).json(result);
}

export async function getRecurringPatternById(req: Request, res: Response): Promise<void> {
    const userId = req.user.userId;
    const { id } = patternIdParamSchema.parse(req.params);

    const pattern = await recurringService.getRecurringPatternById(userId, id);
    res.status(200).json(pattern);
}

export async function confirmRecurringPattern(req: Request, res: Response): Promise<void> {
    const userId = req.user.userId;
    const { id } = patternIdParamSchema.parse(req.params);
    const body = confirmPatternSchema.parse(req.body);

    const updated = await recurringService.confirmRecurringPattern(userId, id, body.notes);
    res.status(200).json(updated);
}

export async function dismissRecurringPattern(req: Request, res: Response): Promise<void> {
    const userId = req.user.userId;
    const { id } = patternIdParamSchema.parse(req.params);

    const updated = await recurringService.dismissRecurringPattern(userId, id);
    res.status(200).json(updated);
}

export async function resetRecurringPattern(req: Request, res: Response): Promise<void> {
    const userId = req.user.userId;
    const { id } = patternIdParamSchema.parse(req.params);

    const updated = await recurringService.resetRecurringPattern(userId, id);
    res.status(200).json(updated);
}

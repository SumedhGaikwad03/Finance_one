import { AiSkill, AIQuestion, AIAnswer } from "../types/ai.types";
import { SkillExecutor } from "./skill-executor";
import prisma from "../../lib/prisma";
import { BadRequestError } from "../../error/AppError";

export class TransactionRetrievalExecutor implements SkillExecutor {
    async execute(
        skill: AiSkill,
        question: AIQuestion,
        userId: number
    ): Promise<AIAnswer> {
        if (!userId || typeof userId !== "number" || userId <= 0) {
            throw new BadRequestError("Valid userId is required for transaction retrieval");
        }

        const transactions = await prisma.transaction.findMany({
            where: { userId },
            take: 10,
            orderBy: {
                transactionDate: "desc",
            },
        });

        return {
            answer: `Found ${transactions.length} transactions.`,
        };
    }
}
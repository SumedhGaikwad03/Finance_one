import { AiSkill, AIQuestion, AIAnswer } from "../types/ai.types";
import prisma from "../../lib/prisma";

export class TransactionRetrievalExecutor {

    async execute(
        skill: AiSkill,
        question: AIQuestion
    ): Promise<AIAnswer> {

        const transactions = await prisma.transaction.findMany({
            take: 10,
            orderBy: {
                transactionDate: "desc",
            },
        });

        console.log("Transactions retrieved:", transactions);

        return {
            answer: `Found ${transactions.length} transactions.`,
        };
    }
}
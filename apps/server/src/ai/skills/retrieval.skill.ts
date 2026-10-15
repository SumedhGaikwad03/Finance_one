import type { AiSkill } from "../types/ai.types";

export const retrivalSkill: AiSkill = {
    id: "transaction-retrieval",
    name: "Transaction Retrieval",
    description: "Retrieves factual and aggregated spending information from the user's transaction ledger.",
    examples: [
        "How much did I spend on food?",
        "What is my total spending on groceries this month?",
        "Show me my recent travel expenses",
        "List my latest transactions",
        "What was my biggest transaction?",
        "What was my highest expense on shopping?",
        "What was my cheapest purchase?",
        "How many transactions did I make this week?",
        "How many times did I pay for fuel?",
        "When did I last pay for fuel?",
    ],
    requirements: ["transactions"],
};
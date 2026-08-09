import type { AiSkill } from "../types/ai.types";

export const retrivalSkill: AiSkill = {

    id: "transaction-retrieval",

    name: "Transaction Retrieval",

    description:
        "Retrieves factual information from the user's financial data.",

    examples: [
        "How much did I spend on food?",
        "When did I last pay for fuel?",
        "Show me my recent travel expenses.",
        "What was my biggest transaction?"
    ],

    requirements: [
        "transactions"
    ]

};
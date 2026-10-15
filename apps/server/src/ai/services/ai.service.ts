import { AIQuestionInput } from "../schemas/question.schema";
import { SkillMatcher, SkillMatchResult } from "./skill-matcher.service";
import { LLMQueryExtractor } from "./llm-query-extractor.service";
import { OllamaLLMProvider } from "../providers/ollama-llm.provider";
import { TransactionQueryService } from "./transaction-query.service";
import { BadRequestError } from "../../error/AppError";
import { QueryExtractor } from "../types/query-extractor.types";

export interface AIQueryResponse {
    success: boolean;
    matched: boolean;
    message?: string;
    confidence: number;
    skill: {
        id: string;
        name: string;
    } | null;
    query?: {
        operation: string;
        category: string | null;
        startDate: string | null;
        endDate: string | null;
    } | null;
    data: any;
}

export class AIService {
    private readonly skillMatcher: SkillMatcher;
    private readonly queryExtractor: QueryExtractor;
    private readonly transactionQueryService: TransactionQueryService;

    constructor(options: {
        skillMatcher?: SkillMatcher;
        queryExtractor?: QueryExtractor;
        transactionQueryService?: TransactionQueryService;
    } = {}) {
        this.skillMatcher = options.skillMatcher ?? new SkillMatcher();
        this.queryExtractor = options.queryExtractor ?? new LLMQueryExtractor(new OllamaLLMProvider());
        this.transactionQueryService = options.transactionQueryService ?? new TransactionQueryService();
    }

    async queryTransactions(
        input: AIQuestionInput,
        userId: number
    ): Promise<AIQueryResponse> {
        if (!userId || typeof userId !== "number" || userId <= 0) {
            throw new BadRequestError("Valid authenticated user ID is required");
        }

        const normalizedQuestion = input.question?.trim();
        if (!normalizedQuestion) {
            throw new BadRequestError("Question cannot be empty");
        }

        // 1. Skill Matching & Intent Classification via pgvector
        const matchResult: SkillMatchResult = await this.skillMatcher.match(normalizedQuestion);

        if (!matchResult.matched || !matchResult.skill) {
            return {
                success: true,
                matched: false,
                message: "Could not confidently match question to a registered financial skill.",
                confidence: matchResult.score,
                skill: null,
                data: null,
            };
        }

        // 2. Skill Route Dispatcher
        switch (matchResult.skill.id) {
            case "transaction-retrieval": {
                // 3. Structured Query Extraction via LLM
                const extractedQuery = await this.queryExtractor.extract({
                    question: normalizedQuestion,
                });

                // 4. Validate allowed operations for transaction-retrieval
                const allowedOperations = ["SUM", "COUNT", "LIST", "MAX", "MIN"];
                if (!allowedOperations.includes(extractedQuery.operation)) {
                    throw new BadRequestError(
                        `Operation '${extractedQuery.operation}' is not supported by skill '${matchResult.skill.id}'`
                    );
                }

                // 5. Deterministic Execution against PostgreSQL (Strict Multi-Tenant Scoping)
                const facts = await this.transactionQueryService.execute(extractedQuery, userId);

                // 6. Return Structured Facts & Response Metadata
                return {
                    success: true,
                    matched: true,
                    confidence: matchResult.score,
                    skill: {
                        id: matchResult.skill.id,
                        name: matchResult.skill.name,
                    },
                    query: {
                        operation: extractedQuery.operation,
                        category: extractedQuery.category ?? null,
                        startDate: extractedQuery.startDate ? extractedQuery.startDate.toISOString() : null,
                        endDate: extractedQuery.endDate ? extractedQuery.endDate.toISOString() : null,
                    },
                    data: facts,
                };
            }

            default: {
                return {
                    success: true,
                    matched: false,
                    message: `Matched skill '${matchResult.skill.id}' has no registered executor.`,
                    confidence: matchResult.score,
                    skill: {
                        id: matchResult.skill.id,
                        name: matchResult.skill.name,
                    },
                    data: null,
                };
            }
        }
    }
}

// Default singleton instance for controllers
const defaultAIService = new AIService();

export const queryTransactions = (input: AIQuestionInput, userId: number): Promise<AIQueryResponse> => {
    return defaultAIService.queryTransactions(input, userId);
};
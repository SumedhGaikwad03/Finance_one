import { aiSkills } from "../skills";
import { AiSkill } from "../types/ai.types";
import { generateEmbedding } from "./embedding.service";
import { VectorSearchService } from "./vector-search.service";
import { EMBEDDING_CONFIG } from "../config/embedding";

export interface SkillMatchResult {
    matched: boolean;
    skill: AiSkill | null;
    score: number;
    reason?: "EMPTY_QUERY" | "NO_VECTOR_MATCH" | "LOW_CONFIDENCE" | "UNKNOWN_SKILL" | "SUCCESS";
}

export class SkillMatcher {
    private readonly vectorSearchService: VectorSearchService;
    private readonly confidenceThreshold: number;
    private readonly embeddingFn: (text: string) => Promise<number[]>;
    private readonly skillsRegistry: AiSkill[];

    constructor(options: {
        vectorSearchService?: VectorSearchService;
        confidenceThreshold?: number;
        embeddingFn?: (text: string) => Promise<number[]>;
        skillsRegistry?: AiSkill[];
    } = {}) {
        this.vectorSearchService = options.vectorSearchService ?? new VectorSearchService();
        this.confidenceThreshold = options.confidenceThreshold ?? EMBEDDING_CONFIG.confidenceThreshold;
        this.embeddingFn = options.embeddingFn ?? generateEmbedding;
        this.skillsRegistry = options.skillsRegistry ?? aiSkills;
    }

    async match(question: string): Promise<SkillMatchResult> {
        if (!question || typeof question !== "string" || question.trim().length === 0) {
            return {
                matched: false,
                skill: null,
                score: 0,
                reason: "EMPTY_QUERY",
            };
        }

        const normalizedQuestion = question.trim();
        const questionEmbedding = await this.embeddingFn(normalizedQuestion);

        if (!questionEmbedding || questionEmbedding.length === 0) {
            return {
                matched: false,
                skill: null,
                score: 0,
                reason: "NO_VECTOR_MATCH",
            };
        }

        const result = await this.vectorSearchService.search(questionEmbedding);

        if (!result) {
            return {
                matched: false,
                skill: null,
                score: 0,
                reason: "NO_VECTOR_MATCH",
            };
        }

        // Cosine distance is in [0, 2]. Cosine similarity is 1 - distance.
        const similarity = 1 - result.distance;

        if (similarity < this.confidenceThreshold) {
            return {
                matched: false,
                skill: null,
                score: similarity,
                reason: "LOW_CONFIDENCE",
            };
        }

        const matchedSkill = this.skillsRegistry.find(
            (skill) => skill.id === result.skillId
        );

        if (!matchedSkill) {
            console.warn(`[SkillMatcher] Skill ID '${result.skillId}' found in vector DB but not registered in aiSkills.`);
            return {
                matched: false,
                skill: null,
                score: similarity,
                reason: "UNKNOWN_SKILL",
            };
        }

        return {
            matched: true,
            skill: matchedSkill,
            score: similarity,
            reason: "SUCCESS",
        };
    }
}
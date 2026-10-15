import prisma from "../../lib/prisma";
import { EMBEDDING_CONFIG } from "../config/embedding";

export interface VectorSearchResult {
    skillId: string;
    exampleText: string;
    model: string;
    dimensions: number;
    distance: number;
}

export class VectorSearchService {
    async search(queryEmbedding: number[]): Promise<VectorSearchResult | null> {
        if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
            return null;
        }

        if (queryEmbedding.length !== EMBEDDING_CONFIG.dimensions) {
            console.warn(`[VectorSearch] Vector dimension mismatch: query is ${queryEmbedding.length}, expected ${EMBEDDING_CONFIG.dimensions}`);
            return null;
        }

        const vector = `[${queryEmbedding.join(",")}]`;

        try {
            const results = await prisma.$queryRaw<VectorSearchResult[]>`
                SELECT
                    "skillId",
                    "exampleText",
                    "model",
                    "dimensions",
                    "embedding" <=> ${vector}::vector AS distance
                FROM "SkillEmbedding"
                ORDER BY "embedding" <=> ${vector}::vector 
                LIMIT 1;
            `;

            return results[0] ?? null;
        } catch (error: any) {
            console.error("[VectorSearch] Database vector search failed:", error?.message || error);
            throw error;
        }
    }
}
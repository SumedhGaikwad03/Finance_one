import { AiSkill } from "../types/ai.types";
import { generateEmbedding } from "./embedding.service";
import { EMBEDDING_CONFIG } from "../config/embedding";
import prisma from "../../lib/prisma";

export class SkillEmbeddingService {
    async ingestSkill(skill: AiSkill): Promise<number> {
        if (!skill || !skill.id || !Array.isArray(skill.examples) || skill.examples.length === 0) {
            console.log(`[SkillEmbedding] Skipping skill '${skill?.id ?? "unknown"}': no valid examples provided.`);
            return 0;
        }

        let ingestedCount = 0;

        for (const example of skill.examples) {
            const trimmed = example?.trim();
            if (!trimmed) continue;

            // Check if example is already embedded with same model and dimensions
            try {
                const existing = await prisma.$queryRaw<any[]>`
                    SELECT "id", "model", "dimensions" 
                    FROM "SkillEmbedding"
                    WHERE "skillId" = ${skill.id} AND "exampleText" = ${trimmed}
                    LIMIT 1;
                `;

                if (
                    existing.length > 0 &&
                    existing[0].model === EMBEDDING_CONFIG.model &&
                    existing[0].dimensions === EMBEDDING_CONFIG.dimensions
                ) {
                    // Already embedded with correct model and dimension
                    continue;
                }
            } catch (err) {
                // If query fails (e.g., during fresh setup), proceed to upsert
            }

            const embedding = await generateEmbedding(trimmed);
            if (!embedding || embedding.length !== EMBEDDING_CONFIG.dimensions) {
                console.warn(`[SkillEmbedding] Skipping example '${trimmed}': invalid embedding dimensions.`);
                continue;
            }

            const vector = `[${embedding.join(",")}]`;

            await prisma.$executeRaw`
                INSERT INTO "SkillEmbedding"
                ("skillId", "exampleText", "embedding", "model", "dimensions", "createdAt", "updatedAt")
                VALUES (
                    ${skill.id},
                    ${trimmed},
                    ${vector}::vector,
                    ${EMBEDDING_CONFIG.model},
                    ${embedding.length},
                    NOW(),
                    NOW()
                )
                ON CONFLICT ("skillId", "exampleText")
                DO UPDATE SET
                    "embedding" = EXCLUDED."embedding",
                    "model" = EXCLUDED."model",
                    "dimensions" = EXCLUDED."dimensions",
                    "updatedAt" = NOW();
            `;

            ingestedCount++;
        }

        console.log(`[SkillEmbedding] Ingested ${ingestedCount} examples for skill '${skill.id}'.`);
        return ingestedCount;
    }
}
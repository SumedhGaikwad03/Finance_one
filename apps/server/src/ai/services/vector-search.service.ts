// thi file gives us stored vectors closted to this vector 

import prisma from "../../lib/prisma";

export class VectorSearchService {

    async search(queryEmbedding: number[]) {

        // vector search will go here
 
          const vector = `[${queryEmbedding.join(",")}]`;

        const results = await prisma.$queryRaw<
            {
                skillId: string;
                exampleText: string;
                model: string;
                dimensions: number;
                distance: number; // this cmd ""embedding" <=> ${vector}::vector" does 
                // "Calculate the cosine distance between the stored embedding and our query embedding."
            }[]
        >`
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
    }
}
import { AiSkill } from "../types/ai.types"; // this defines the structure of the skills 
import { generateEmbedding } from "./embedding.service"; // gives a call to generate embeddings 
// this is the same service that we used to genreate question embeddings for users but here we use it 
//once to create static embedding 
import prisma from "../../lib/prisma"

export class SkillEmbeddingService {

    async ingestSkill(skill : AiSkill) {

        for (const example of skill.examples){ // we infer examples from examples 

            const embedding = await generateEmbedding(example); 

             const vector = `[${embedding.join(",")}]`;

            await prisma.$executeRaw`
                INSERT INTO "SkillEmbedding"
                ("skillId", "exampleText", "embedding", "model", "dimensions", "createdAt", "updatedAt")
                VALUES (
                    ${skill.id},
                    ${example},
                    ${vector}::vector,
                    ${"qwen3-embedding:4b"},
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
`; // this code tests out idepotency of the flow when simlar id and examples found it essentially updates the existing embeddinds 
// and not create new ones 
            console.log({
                skillId : skill.id ,
                example,
                dimensions : embedding.length,
            });
        }


    }
}
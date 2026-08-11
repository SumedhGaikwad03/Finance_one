import { AiSkill } from "../types/ai.types";
import { generateEmbedding } from "./embedding.service"; 

// this file is used to determine what the user actually wants and intend to do with the input 


// this block is used to compute vectors 
const cosineSimilarity = (
    a: number[],
    b: number[]
): number => {

    let dot = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {

        dot += a[i] * b[i];

        magnitudeA += a[i] * a[i];

        magnitudeB += b[i] * b[i];
    }

    return dot /
        (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

export class SkillMatcher {

    async match(
        
        question : string , 
        skills : AiSkill[]

    ){

        const questionsEmbedding =
        await generateEmbedding(question);

    let bestSkill: AiSkill | null = null;

    let bestScore = -1;

    const CONFIDENCE_THRESHOLD = 0.70;

    for (const skill of skills) {

        let bestSimilarity = -1;

        for (const example of skill.examples) {

            const exampleEmbedding =
                await generateEmbedding(example);

            const similarity =
                cosineSimilarity(
                    questionsEmbedding,
                    exampleEmbedding
                );

            console.log(
                skill.name,
                example,
                similarity
            );

            if (similarity > bestSimilarity) {

                bestSimilarity = similarity;

            }
        }

        console.log(
            "Best score for",
            skill.name,
            ":",
            bestSimilarity
        );

        if (bestSimilarity > bestScore) {

            bestScore = bestSimilarity;

            bestSkill = skill;

        }
    }

    if (bestScore < CONFIDENCE_THRESHOLD) {

    return {
        skill: null,
        score: bestScore,
    };
}

    return {
        skill: bestSkill,
        score: bestScore,
    };
}
}
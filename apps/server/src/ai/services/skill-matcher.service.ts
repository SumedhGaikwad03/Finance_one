import { aiSkills } from "../skills";
import { generateEmbedding } from "./embedding.service"; 
import { VectorSearchService } from "./vector-search.service"; // this is the service that comapres our genrated vector 
// with static vectors in the system 

// this file is used to determine what the user actually wants and intend to do with the input 


// this block is used to compute vectors but now its obsalte 
/*
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
*/
export class SkillMatcher {

    private vectorSearchService = new VectorSearchService ; 

    async match(
        
        question : string , 
      //  skills : AiSkill[]

    ){

        const questionsEmbedding =
        await generateEmbedding(question);
           
        const result = await this.vectorSearchService.search(questionsEmbedding); 

       console.log("Vector search results  ", result)


       if(!result){
        return{
            skill: null ,
            score : 0 ,
        };


       }
  // this is the skill for confidence matching 
       const similarity = 1 - result.distance;

    const CONFIDENCE_THRESHOLD = 0.70;

    if (similarity < CONFIDENCE_THRESHOLD) {
        return {
            skill: null,
            score: similarity,
        };
    }

    //here we try to reslove the skillid structure 
      const skill = aiSkills.find(
        skill => skill.id === result.skillId
    );

    if (!skill){
        throw new Error( `Skill " ${result.skillId}" was found in the vector database but not registerd `);
    }


    return {
        skill,
        score: similarity,
    };
}
    

    // this code is now not needed as its obselete 

    /*
    let bestSkill: AiSkill | null = null;

    let bestScore = -1;

    const CONFIDENCE_THRESHOLD = 0.70;
/*
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
}*/ 


}
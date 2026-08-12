import { OllamaEmbeddingProvider } from "../providers/ollama-embedding.provider";
import { generateEmbedding } from "../services/embedding.service";
import { SkillEmbeddingService } from "./skill-embedding.service";
//import { AiSkills } from "../types/ai.types";
import { retrivalSkill } from "../skills/retrieval.skill";


const test1 = async () => {

    const embedding = await generateEmbedding(
        "How much did I spend on groceries?",
       
    );

    console.log("Embedding generated");
    console.log("Dimensions:", embedding.length);
    console.log("First 5 values:", embedding.slice(0, 5));

};


const service = new SkillEmbeddingService();

const test = async () => {

    await service.ingestSkill(retrivalSkill);

    console.log("Skill ingestion complete");
};

test(); 
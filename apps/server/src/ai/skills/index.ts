import type { AiSkill } from "../types/ai.types";
import { retrivalSkill } from "./retrieval.skill";

export const aiSkills: AiSkill[] = [
    retrivalSkill,
];
// the above line creates an array of skills that we have provided for it 


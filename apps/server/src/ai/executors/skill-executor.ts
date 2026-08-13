import { AiSkill, AIQuestion, AIAnswer } from "../types/ai.types";

export interface SkillExecutor {

    execute(
        skill: AiSkill,
        question: AIQuestion
    ): Promise<AIAnswer>;

}
import { SkillMatcher } from "./skill-matcher.service";
import { retrivalSkill} from "../skills/retrieval.skill";

const matcher = new SkillMatcher();

const test = async () => {

    const result = await matcher.match(
        "what is the capital of france ?",
        [retrivalSkill]
    );

    console.log(result);

};

test();
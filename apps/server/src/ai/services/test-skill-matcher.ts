import { SkillMatcher } from "./skill-matcher.service";
import { retrivalSkill} from "../skills/retrieval.skill";

const matcher = new SkillMatcher();

const test = async () => {

    const result = await matcher.match(
        "what did spend on eating out  ?"
    );

    console.log("Final results " , result);

};

test();
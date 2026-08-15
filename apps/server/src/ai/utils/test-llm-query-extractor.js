import { LLMQueryExtractor } from "../services/llm-query-extractor.service";
import { OllamaLLMProvider } from "../providers/ollama-llm.provider";
const llmProvider = new OllamaLLMProvider();
const extractor = new LLMQueryExtractor(llmProvider);
async function main() {
    const result = await extractor.extract({
        question: "How much have I spent on groceries ",
    });
    console.log("\n--------------------------------");
    console.log("FINAL TRANSACTION QUERY");
    console.log("--------------------------------\n");
    console.log(result);
    console.log("\n--------------------------------");
    console.log("DATE RANGE");
    console.log("--------------------------------\n");
    console.log("Start:", result.startDate?.toISOString());
    console.log("End:", result.endDate?.toISOString());
}
main().catch((error) => {
    console.error("\n❌ Test failed:\n");
    console.error(error);
    process.exit(1);
});

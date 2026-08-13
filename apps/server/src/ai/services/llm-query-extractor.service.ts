import { QueryExtractor , LLMProvider } from "../types/query-extractor.types";
import { AIQuestion} from "../types/ai.types";
import { TransactionQuery } from "../types/transaction-query.types";
import {transactionQuerySchema} from "../schemas/question.schema"
export class LLMQueryExtractor implements QueryExtractor {

      constructor(
        private readonly llmProvider: LLMProvider
    ) {}

    async extract(question: AIQuestion): Promise<TransactionQuery> {

        
        // LLM implementation later
        const prompt = `
You are a transaction query extraction system.

Your job is to convert the user's question into a structured JSON transaction query.

Allowed operations:
- SUM
- COUNT
- LIST
- MAX
- MIN

Allowed categories:
- FOOD
- FUEL
- SHOPPING
- BILLS
- ENTERTAINMENT
- HEALTH
- TRAVEL
- EDUCATION
- SUBSCRIPTION
- GIFT
- OTHER

Return ONLY valid JSON.

The JSON must have this structure:

{
    "operation": "SUM | COUNT | LIST | MAX | MIN",
    "category": "optional category",
    "startDate": "optional ISO date",
    "endDate": "optional ISO date"
}

Do not include userId.

Do not include fields that are not required.

User question:
${question.question}
`;

const response = await this.llmProvider.generate(prompt);

const parsed = JSON.parse(response);

const validated = transactionQuerySchema.parse(parsed);

   const query: TransactionQuery = {
            operation: validated.operation,
            category: validated.category,
            startDate: /* your date helper */,
            endDate: /* your date helper */,

return validated; };

    }


}

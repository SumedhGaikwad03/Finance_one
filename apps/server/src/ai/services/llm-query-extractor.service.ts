import { QueryExtractor, LLMProvider } from "../types/query-extractor.types";
import { AIQuestion } from "../types/ai.types";
import { TransactionQuery } from "../types/transaction-query.types";
import { transactionQuerySchema } from "../schemas/question.schema";
import { resolveDateRange } from "../utils/date-range.utils";
import { BadRequestError } from "../../error/AppError";

/* Turn a user's natural-language question into a structured query intent and an executable TransactionQuery. */
export class LLMQueryExtractor implements QueryExtractor {
    constructor(private readonly llmProvider: LLMProvider) {}

    async extract(question: AIQuestion): Promise<TransactionQuery> {
        if (!question?.question || question.question.trim().length === 0) {
            throw new BadRequestError("Question cannot be empty");
        }

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
    "dateRange": "optional date range"
}

If the user specifies a relative date range such as
"last 4 days", "past 2 weeks", or "last 3 months",
use:

{
    "type": "RELATIVE",
    "amount": number,
    "unit": "DAY | WEEK | MONTH | YEAR"
}

If the user specifies a calendar period such as
"today", "yesterday", "this month", or "last month",
use:

{
    "type": "CALENDAR_PERIOD",
    "period": "TODAY | YESTERDAY | THIS_WEEK | LAST_WEEK | THIS_MONTH | LAST_MONTH | THIS_YEAR | LAST_YEAR"
}

If the user gives explicit dates, use:

{
    "type": "ABSOLUTE",
    "startDate": "ISO date",
    "endDate": "ISO date"
}

Examples:

User:
"Show me food transactions from the last 4 days"

Output:
{
    "operation": "LIST",
    "category": "FOOD",
    "dateRange": {
        "type": "RELATIVE",
        "amount": 4,
        "unit": "DAY"
    }
}

User:
"How much did I spend last month?"

Output:
{
    "operation": "SUM",
    "dateRange": {
        "type": "CALENDAR_PERIOD",
        "period": "LAST_MONTH"
    }
}

User:
"What was my biggest expense on shopping?"

Output:
{
    "operation": "MAX",
    "category": "SHOPPING"
}

User:
"How many times did I pay for fuel this year?"

Output:
{
    "operation": "COUNT",
    "category": "FUEL",
    "dateRange": {
        "type": "CALENDAR_PERIOD",
        "period": "THIS_YEAR"
    }
}

Do not include userId.
Do not include fields that are not required.

User question:
${question.question.trim()}
`;

        const rawResponse = await this.llmProvider.generate(prompt);

        // Strip markdown code fences if model enclosed JSON in ```json ... ```
        let cleaned = rawResponse.trim();
        const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) {
            cleaned = codeBlockMatch[1].trim();
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(cleaned);
        } catch (err: any) {
            console.error("[LLMQueryExtractor] JSON parse failure on raw response:", rawResponse);
            throw new BadRequestError("AI language model returned invalid JSON structure");
        }

        const validated = transactionQuerySchema.safeParse(parsed);
        if (!validated.success) {
            console.error("[LLMQueryExtractor] Zod validation failure:", validated.error.format());
            throw new BadRequestError("Extracted query parameters failed schema validation");
        }

        const query: TransactionQuery = {
            operation: validated.data.operation,
            category: validated.data.category,
        };

        if (validated.data.dateRange) {
            try {
                const range = resolveDateRange(validated.data.dateRange);
                query.startDate = range.startDate;
                query.endDate = range.endDate;
            } catch (err: any) {
                throw new BadRequestError(`Invalid date range: ${err?.message || "Failed to resolve dates"}`);
            }
        }

        return query;
    }
}

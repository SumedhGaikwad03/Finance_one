import { transactionQuerySchema } from "../schemas/question.schema";
import { resolveDateRange } from "../utils/date-range.utils";
/* Turn a user's natural-language question into a structured query intent and eventually an executable TransactionQuery. */
export class LLMQueryExtractor {
    llmProvider;
    constructor(llmProvider) {
        this.llmProvider = llmProvider;
    } // right now the llm provider is ollama 
    async extract(question) {
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
"Show my travel transactions this week"

Output:
{
    "operation": "LIST",
    "category": "TRAVEL",
    "dateRange": {
        "type": "CALENDAR_PERIOD",
        "period": "THIS_WEEK"
    }
}


Do not include userId.

Do not include fields that are not required.

User question:
${question.question}
`;
        // this is the query tha we send to the llm we be working on 
        const response = await this.llmProvider.generate(prompt);
        const parsed = JSON.parse(response);
        const validated = transactionQuerySchema.parse(parsed);
        const query = {
            operation: validated.operation,
            category: validated.category,
        };
        if (validated.dateRange) {
            const range = resolveDateRange(validated.dateRange);
            query.startDate = range.startDate;
            query.endDate = range.endDate;
        }
        return query;
    }
}

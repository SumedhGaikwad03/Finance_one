# AI / NLP Query Builder

The AI Query Builder translates freeform natural language text into a validated `TransactionQuery` DTO.

---

## 1. Natural Language Extraction Pipeline

```text
User Question ("How much did I spend on groceries last week?")
                     │
                     ▼
             Skill Matching (pgvector)
                     │
                     ▼
       LLMQueryExtractor (Ollama Prompt)
                     │
                     ▼
           Extracted JSON Intent
                     │
                     ▼
          Zod Schema Validation
                     │
                     ▼
          Date Range Resolution
                     │
                     ▼
         Standard `TransactionQuery`
                     │
                     ▼
          Common Query Pipeline
```

---

## 2. Extraction Invariants

1. **No Direct SQL Generation**: The LLM is instructed via few-shot prompts to output structured JSON conforming to `transactionQuerySchema`, never SQL statements.
2. **Deterministic Date Resolution**: Relative date phrases ("last 4 days", "this month") are resolved using pure TypeScript date utilities (`date-range.utils.ts`) anchored to current server time.
3. **Enum Boundary Checking**: Category and Priority names returned by the LLM are strictly checked against Prisma enums.

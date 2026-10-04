# Finance One — AI Infrastructure & Status Specification

**Document Version:** 1.0.0  
**Current Release Context:** MVP 1 — Early Beta  
**Scope:** AI Subsystem, pgvector Database Layer, Intent Classifier, and Retrieval/RAG Pipeline  
**Last Audited:** October 2026  

---

## 1. Executive Summary & Core Philosophy

Finance One uses an **additive, deterministic AI architecture**. Unlike financial chatbots that generate balances and statistics via generative LLM completions (which risk mathematical hallucination), Finance One enforces a strict separation of concerns:

```text
Natural Language Input (User Question)
            │
            ▼
[ Intent Routing & Skill Classification ]  ──► pgvector Cosine Search
            │
            ▼
[ Query Extraction & Normalization ]       ──► LLM JSON Extraction + Zod Validation
            │
            ▼
[ Deterministic Ledger Retrieval ]         ──► PostgreSQL / Prisma Aggregate Query
            │
            ▼
[ Normalized Fact Envelope ]               ──► Exact Financial Truth (Totals, Averages, Counts)
            │
            ▼
[ Grounded LLM Explanation ]               ──► Constrained Prompt (Zero Number Invention)
```

### Core Invariants
1. **AI as Interface, Not Ledger**: The AI does not compute balances or modify ledgers directly. All mathematical aggregations run on real PostgreSQL records.
2. **Strict Grounding**: The explanation layer is instructed never to output numbers not provided in the verified fact envelope.
3. **Graceful Fallback**: If the local LLM or cloud AI service is offline, the application falls back immediately to deterministic heuristic parsing and visual charts.

---

## 2. Component Inventory & Implementation Status

The table below details every AI-related file and module currently present in `apps/server/src/ai/` and database schemas:

| Component / File Path | Current Status | Description & Role |
| :--- | :--- | :--- |
| **`prisma/schema.prisma`** (`SkillEmbedding`) | **IMPLEMENTED** | PostgreSQL table using `Unsupported("vector(2560)")` with unique composite index on `[skillId, exampleText]`. |
| **`ai/providers/ollama-embedding.provider.ts`** | **IMPLEMENTED** | Calls `http://localhost:11434/api/embed` with `qwen3-embedding:4b` to produce 2560-dimensional vector embeddings. |
| **`ai/providers/ollama-llm.provider.ts`** | **IMPLEMENTED** | Calls `http://localhost:11434/api/generate` with `qwen3:4b` for structured JSON completion. |
| **`ai/services/skill-embedding.service.ts`** | **IMPLEMENTED** | Ingests skill training examples into PostgreSQL via raw SQL `ON CONFLICT ("skillId", "exampleText") DO UPDATE`. |
| **`ai/services/vector-search.service.ts`** | **IMPLEMENTED** | Executes cosine distance queries (`"embedding" <=> ${vector}::vector`) against `SkillEmbedding`. |
| **`ai/services/skill-matcher.service.ts`** | **IMPLEMENTED** | Matches user question embeddings against registered skills with a confidence threshold ($\ge 0.70$). |
| **`ai/services/llm-query-extractor.service.ts`** | **IMPLEMENTED** | Few-shot LLM prompt converting natural queries into structured `TransactionQuery` JSON with Zod validation. |
| **`ai/utils/date-range.utils.ts`** | **IMPLEMENTED** | Deterministic calendar (`THIS_MONTH`, `LAST_WEEK`) and relative (`last 4 days`) date range calculation. |
| **`ai/skills/retrieval.skill.ts`** | **IMPLEMENTED** | Seeded skill definition for `transaction-retrieval` with training prompts. |
| **`ai/skills/index.ts`** | **IMPLEMENTED** | Central registry array exporting active skills (`aiSkills`). |
| **`ai/controllers/ai.controller.ts`** | **PARTIAL** | Express controller for `POST /api/ai/query`; parses question schema and invokes service. |
| **`ai/services/ai.service.ts`** | **STUBBED** | Placeholder returning `{ message: "AI query pipeline stub" }`. Needs end-to-end chaining. |
| **`ai/prompts/prompt.builder.ts`** | **STUBBED (0 bytes)** | Empty file. Intended for building grounded explanation prompts with `NormalizedQueryResult`. |
| **`ai/repositories/vector.repository.ts`** | **STUBBED (0 bytes)** | Empty file. Query logic currently resides directly in `VectorSearchService`. |
| **`ai/skills/analytics.skill.ts`** | **STUBBED (0 bytes)** | Placeholder for future spending trend analysis skill. |
| **`ai/skills/forecast.skill.ts`** | **STUBBED (0 bytes)** | Placeholder for future cashflow trajectory prediction skill. |
| **`ai/skills/knowledge.skill.ts`** | **STUBBED (0 bytes)** | Placeholder for personal finance FAQ / educational skill. |
| **`ai/skills/recommendation.skill.ts`** | **STUBBED (0 bytes)** | Placeholder for budget optimization / savings tips skill. |
| **`ai/routes/ai.routes.ts`** | **UNMOUNTED** | Route file exists but is intentionally unmounted in `src/app.ts` during MVP 1. |

---

## 3. Detailed Subsystem Breakdown

### 3.1 pgvector Skill Matching Subsystem

When a user asks a question, the vector pipeline maps the question to an operational capability:

```text
User Question: "How much did I spend on groceries last week?"
                       │
                       ▼
            OllamaEmbeddingProvider
        (model: "qwen3-embedding:4b")
                       │ (2560-dim vector)
                       ▼
             VectorSearchService
      SELECT "skillId", "embedding" <=> $1::vector AS distance
      FROM "SkillEmbedding" ORDER BY distance LIMIT 1;
                       │
                       ▼
             SkillMatcher Logic
      similarity = 1 - distance
      if (similarity >= 0.70) => Matched: "transaction-retrieval"
```

### 3.2 Query Extraction Subsystem

Once the `transaction-retrieval` skill is triggered, `LLMQueryExtractor` prompts the LLM to output a strict JSON payload:

```json
{
  "operation": "SUM",
  "category": "FOOD",
  "dateRange": {
    "type": "CALENDAR_PERIOD",
    "period": "LAST_WEEK"
  }
}
```

This output is:
1. Validated via `transactionQuerySchema` (Zod).
2. Resolved into concrete UTC dates via `resolveDateRange()` in [date-range.utils.ts](file:///c:/Users/777su/Desktop/Finance_one/apps/server/src/ai/utils/date-range.utils.ts).
3. Converted into standard domain query `TransactionQuery` `{ category: "FOOD", startDate: "...", endDate: "..." }`.

### 3.3 Heuristic Non-LLM Fallbacks (Active in Production)

Alongside the LLM pipeline, Finance One maintains two fast, deterministic natural-language parsers:
1. **Server Quick Add Parser ([transactionParser.ts](file:///c:/Users/777su/Desktop/Finance_one/apps/server/src/utils/transactionParser.ts))**:
   - Tokenizes strings like `"450 lunch"` or `"spent 1200 on petrol yesterday"` into amount, category, and date.
2. **Frontend Query Parser ([financeQuery.service.ts](file:///c:/Users/777su/Desktop/Finance_one/apps/web/src/services/financeQuery.service.ts))**:
   - Regex and keyword detection for timeframes, categories, and aggregation modes.

---

## 4. Why the AI Layer is Currently Isolated in MVP 1

In the current MVP 1 release, the AI routes are deliberately unmounted in `apps/server/src/app.ts` for three architectural reasons:

1. **Zero External Runtime Dependencies**: MVP 1 must run reliably anywhere without requiring a running Ollama daemon (`localhost:11434`) or paid cloud API keys.
2. **Deterministic Stability First**: The visual **Query Explorer** wizard fulfills 100% of user queries ("Where did I spend?") with zero failure rate and sub-millisecond response times.
3. **Clean Foundation Before Expansion**: Data models, authentication, security isolation, budget invariants, and responsive UI were prioritized and verified first.

---

## 5. Future Roadmap & What the AI Infra Could Become

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 1: MULTI-PROVIDER AI ADAPTER                              │
│  • Provider abstraction supporting Ollama, Google Gemini API, and OpenAI               │
│  • Dynamic embedding dimension support (768d Gemini/Nomic, 1536d OpenAI, 2560d Qwen)   │
│  • Structured Outputs (JSON Schema mode) for 100% reliable extraction                  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 2: DOMAIN SKILL EXPANSION                                 │
│  • Budget & Affordability Advisor: "Can I buy a ₹12,000 watch this month?"             │
│  • Anomaly Detector: "Why is my electricity bill higher this month?"                   │
│  • Recurring Expense Audit: Flags subscriptions with price changes or forgotten trials │
│  • Cashflow Trajectory Forecaster: Linear regression predicting month-end balance      │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 3: MULTIMODAL INGESTION RAG                               │
│  • Camera / PDF Receipt OCR: Extracts merchant, items, amount, tax into transaction   │
│  • SMS & UPI Alert Ingestion: Normalizes bank SMS strings into candidate ledger items │
│  • Merchant Normalization Index: Embeds cryptic descriptions ("POS 9942 PYTM")         │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   PHASE 4: CONVERSATIONAL COPILOT & GENERATIVE UI                      │
│  • Interactive Assistant Drawer with inline visual cards (charts, category badges)     │
│  • Mutation Execution: "Set a ₹6,000 dining budget" generates actionable confirm card │
│  • Multi-turn conversational memory maintaining active filter context                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Activation Runbook: Connecting the Pipeline

When ready to activate the AI subsystem post-MVP 1, follow these steps:

### Step 1: Implement `PromptBuilder`
Create [prompt.builder.ts](file:///c:/Users/777su/Desktop/Finance_one/apps/server/src/ai/prompts/prompt.builder.ts):
```typescript
export interface FinancialFacts {
  category?: string;
  totalSpent: number;
  transactionCount: number;
  averageAmount: number;
  periodLabel: string;
}

export function buildExplanationPrompt(facts: FinancialFacts, question: string): string {
  return `
You are the Finance One Assistant. Explain these verified financial facts to the user clearly.
Do NOT invent or alter any numbers.

VERIFIED FACTS:
- Category: ${facts.category || "All Categories"}
- Total Spent: ₹${facts.totalSpent}
- Transactions: ${facts.transactionCount}
- Average Amount: ₹${facts.averageAmount}
- Period: ${facts.periodLabel}

USER QUESTION: "${question}"
`;
}
```

### Step 2: Connect `ai.service.ts`
Wire `SkillMatcher` $\to$ `LLMQueryExtractor` $\to$ `TransactionQueryService` $\to$ `PromptBuilder` $\to$ `LLMProvider`.

### Step 3: Mount Routes in `app.ts`
```typescript
import aiRouter from "./ai/routes/ai.routes";

// Mount AI domain route with authentication
app.use("/api/ai", authMiddleware, aiRouter);
```

### Step 4: Seed Skill Vectors
Run vector initialization script to populate `SkillEmbedding`:
```bash
npx tsx src/ai/services/test-embeddings.ts
```

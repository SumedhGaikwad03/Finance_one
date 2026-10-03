# AI & NLP Layer Overview

The AI layer in Finance One is an **additive interface and explanation subsystem**. It provides conversational intent extraction and natural language explanations without compromising deterministic financial calculations.

---

## 1. Principles

1. **AI as Interface, Not Ledger**: The AI does not manage accounts or invent balances.
2. **Deterministic Retrieval**: PostgreSQL handles aggregation and filtering.
3. **Graceful Fallback**: The entire application (CRUD, Dashboard, Budgets, UI Query Builder) functions normally if the AI service or local LLM is unreachable.

---

## 2. AI Subsystem Components

```text
apps/server/src/ai/
├── config/             # Embedding and model configurations (e.g. nomic-embed-text)
├── controllers/        # Express handlers for AI endpoints
├── executors/          # Skill execution handlers (e.g. transaction retrieval)
├── prompts/            # prompt.builder.ts for explanation prompts
├── providers/          # Ollama / OpenAI API providers
├── repositories/       # Vector repository querying PostgreSQL pgvector
├── schemas/            # Zod validation schemas for AI inputs & dates
├── services/           # SkillMatcher, LLMQueryExtractor, EmbeddingService
├── skills/             # Registered skill definitions (e.g. retrieval.skill.ts)
└── utils/              # Date range resolvers & test scripts
```

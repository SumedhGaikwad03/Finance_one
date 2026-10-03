# Finance One Documentation

Welcome to the official technical documentation for **Finance One**, a full-stack, AI-augmented personal finance management platform built backend-first with deterministic financial integrity.

---

## Documentation Structure

### 1. Architecture
- [Architecture Overview](file:///c:/Users/777su/Desktop/Finance_one/docs/architecture/overview.md) — High-level system topology, layers, and communication boundaries.
- [Frontend Architecture](file:///c:/Users/777su/Desktop/Finance_one/docs/architecture/frontend.md) — React, TanStack Query, React Hook Form, and UI structure.
- [Backend Architecture](file:///c:/Users/777su/Desktop/Finance_one/docs/architecture/backend.md) — Express, layered design (Routes $\to$ Controllers $\to$ Services $\to$ Repositories).
- [Database Architecture](file:///c:/Users/777su/Desktop/Finance_one/docs/architecture/database.md) — PostgreSQL, Prisma models, enums, and pgvector schema.
- [Transaction Domain](file:///c:/Users/777su/Desktop/Finance_one/docs/architecture/transaction-domain.md) — Core principles, isolation, and domain boundaries.

### 2. Transaction Pipeline (Ingestion)
- [Input Pipeline](file:///c:/Users/777su/Desktop/Finance_one/docs/transaction/input-pipeline.md) — How transactions enter the system across diverse input sources.
- [Candidate Model](file:///c:/Users/777su/Desktop/Finance_one/docs/transaction/candidate-model.md) — `TransactionCandidate` definition, lifecycle, and provenance.
- [Normalization Layer](file:///c:/Users/777su/Desktop/Finance_one/docs/transaction/normalization.md) — Ingestion boundary, schema normalization, and validation rules.
- [Retrieval Architecture](file:///c:/Users/777su/Desktop/Finance_one/docs/transaction/retrieval.md) — Single retrieval pipeline for all query consumers.

### 3. Query System
- [TransactionQuery Contract](file:///c:/Users/777su/Desktop/Finance_one/docs/query/transaction-query.md) — Structured query interface, operations, and filters.
- [UI Query Builder](file:///c:/Users/777su/Desktop/Finance_one/docs/query/ui-query-builder.md) — Gamified, interactive step-by-step query construction.
- [AI Query Builder](file:///c:/Users/777su/Desktop/Finance_one/docs/query/ai-query-builder.md) — Natural language intent mapping to `TransactionQuery`.

### 4. AI & NLP Layer
- [AI Overview](file:///c:/Users/777su/Desktop/Finance_one/docs/ai/overview.md) — AI principles: read-only, non-hallucinatory, explanatory layer.
- [Intent Classification](file:///c:/Users/777su/Desktop/Finance_one/docs/ai/intent-classification.md) — `SkillMatcher`, pgvector embeddings, and skill catalog.
- [LLM Explanation & Prompts](file:///c:/Users/777su/Desktop/Finance_one/docs/ai/llm-explanation.md) — Normalized query result formatting and explanation prompts.

### 5. Product & Decisions
- [MVP Definition](file:///c:/Users/777su/Desktop/Finance_one/docs/product/mvp.md) — Current MVP capabilities, scope, and non-goals.
- [Product Roadmap](file:///c:/Users/777su/Desktop/Finance_one/docs/product/roadmap.md) — Incremental delivery phases.
- [Architecture Decision Records (ADRs)](file:///c:/Users/777su/Desktop/Finance_one/docs/decisions/architecture-decisions.md) — Key architectural decisions (ADR-001 to ADR-004).

---

## Core Guiding Principles

1. **Deterministic Financial Truth**: PostgreSQL and Prisma are the sole source of financial truth. The LLM never computes financial totals or executes direct SQL queries.
2. **Input Replaceability**: Input mechanisms (manual forms, share targets, screenshot OCR) are interchangeable adapters that produce standard `TransactionCandidate` objects.
3. **Single Retrieval Pipeline**: Both the Gamified UI Query Builder and the AI Intent Extractor target the exact same `TransactionQuery` engine.
4. **Non-Judgmental Priority**: Spending priority (`ESSENTIAL`, `GOOD_TO_HAVE`, `LUXURY`) represents user preference, not moral judgment, and is styled neutrally.

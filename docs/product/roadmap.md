# Product Roadmap

This roadmap outlines the incremental phases for Finance One.

---

## Phase 1: Core `TransactionQuery` Domain & Aggregation Engine
- **Focus**: Standardize `TransactionQuery` schema and repository aggregations (`SUM`, `COUNT`, `AVERAGE`, `MAX`, `MIN`, `FIND`).
- **Deliverables**:
  - `src/schemas/transaction-query.schema.ts` & `src/types/transaction-query.types.ts`.
  - Database-level aggregation methods in `transaction.repository.ts`.
  - `POST /api/transactions/query` endpoint with full Zod validation.

---

## Phase 2: Gamified UI Query Builder
- **Focus**: Interactive frontend query construction.
- **Deliverables**:
  - Step-by-step query wizard in the web app.
  - Live sentence preview.
  - Dynamic result visualization.

---

## Phase 3: Query Result Normalization
- **Focus**: Envelope format for query results.
- **Deliverables**:
  - `NormalizedQueryResult` formatter.
  - Consistent summary generator.

---

## Phase 4: AI Explanation & Prompt Builder
- **Focus**: Natural language explanation of retrieved financial facts.
- **Deliverables**:
  - `prompt.builder.ts` implementation.
  - Explanatory response generation via LLM provider.

---

## Phase 5: AI Intent Classification & Query Extraction Integration
- **Focus**: Connect conversational questions directly to the common query pipeline.
- **Deliverables**:
  - Connect `LLMQueryExtractor` to `TransactionQueryService`.
  - Mount AI routes in `app.ts`.

---

## Phase 6: Modular Transaction Candidate Ingestion
- **Focus**: Multi-source transaction entry.
- **Deliverables**:
  - `TransactionCandidate` DTO.
  - Ingestion normalization service.
  - Screenshot OCR / Share intent adapters.

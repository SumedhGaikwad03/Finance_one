# Transaction Retrieval Architecture

Finance One employs a unified retrieval pipeline to ensure data consistency, auditable calculations, and zero divergence between UI queries and AI queries.

---

## 1. Unified Retrieval Flow

```text
       UI Query Builder ───────────┐
                                   ├────> TransactionQuery
       AI Intent / NLP Extractor ──┘               │
                                                   ▼
                                        Query Validation (Zod)
                                                   │
                                                   ▼
                                         Transaction Service
                                                   │
                                                   ▼
                                         Transaction Repository
                                                   │
                                                   ▼
                                              PostgreSQL
                                                   │
                                                   ▼
                                         Exact Financial Data
                                                   │
                                                   ▼
                                         Normalization Layer
                                                   │
                                ┌──────────────────┴──────────────────┐
                                ▼                                     ▼
                        UI Table / Visuals                     Prompt Builder
                                                                      │
                                                                      ▼
                                                                 LLM Provider
                                                                      │
                                                                      ▼
                                                               User Explanation
```

---

## 2. Invariants

1. **Single Execution Engine**: `TransactionQueryService` / `transaction.repository.ts` is the only component executing transaction retrieval queries.
2. **Deterministic Calculations**: Sums, counts, averages, and extremes are calculated directly in PostgreSQL (via Prisma aggregates).
3. **No AI Direct Querying**: The AI model never connects to PostgreSQL or executes raw SQL queries. It produces a `TransactionQuery` and interprets the resulting normalized data.

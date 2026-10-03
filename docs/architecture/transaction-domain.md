# Transaction Domain

The transaction domain is the core operational heart of Finance One.

---

## 1. Domain Principle

> **Input mechanisms are replaceable. The transaction domain is not.**

The transaction domain enforces ledger integrity, user authorization, category validation, and persistence invariants. External input mechanisms (manual entry, mobile share sheet intents, screenshot OCR) and query generation mechanisms (UI buttons, natural language AI models) are strictly peripheral adapters.

```text
[ External World ] ──> [ Adapter / Normalizer ] ──> [ Transaction Domain ] ──> [ Database ]
```

---

## 2. Core Responsibilities

The transaction domain service (`apps/server/src/services/transaction.service.ts`) and repository (`apps/server/src/repositories/transaction.repository.ts`) are solely responsible for:

1. **Transaction Integrity**: Enforcing positive amounts, valid enum values, and consistent transaction timestamps.
2. **User Data Isolation**: Ensuring every query, mutation, and aggregation is scoped to the requesting `userId`.
3. **Deterministic Persistence**: Reading and writing ledger entries to PostgreSQL via Prisma.
4. **Decoupled Processing**: Operating purely on domain contracts (`CreateTransactionInput`, `TransactionQuery`) without knowledge of UI components, AI prompts, or ingestion source formats.

---

## 3. Separation of Ingestion vs Retrieval

- **Ingestion Boundary**: All transaction creation converges through `TransactionCandidate` $\to$ Normalization $\to$ `TransactionService.createTransaction`.
- **Retrieval Boundary**: All transaction queries converge through `TransactionQuery` $\to$ `TransactionQueryService.execute`.

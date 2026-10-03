# Architecture Decision Records (ADRs)

---

## ADR-001: Modular Transaction Input

### Status
Accepted

### Context
Transactions may eventually originate from manual forms, mobile OS share sheet intents, screenshot OCR, CSV imports, or bank sync feeds. Directly coupling transaction persistence to specific intake formats makes extending the application fragile.

### Decision
All transaction inputs will converge into a decoupled `TransactionCandidate` DTO before passing through an ingestion normalization layer and reaching the core `transaction.service.ts`.

### Consequences
- **Positive**: Ingestion adapters can be added or replaced without modifying the core transaction ledger domain.
- **Negative**: Adds a lightweight candidate DTO and normalization step prior to saving.

---

## ADR-002: Shared Transaction Query Contract

### Status
Accepted

### Context
Users should be able to query their spending via a structured/gamified UI or via natural language AI questions. Creating separate retrieval services for UI and AI would lead to duplicate code, inconsistent math, and maintenance overhead.

### Decision
Both the Gamified UI Query Builder and the AI Intent Extractor will generate the exact same `TransactionQuery` DTO, which is executed by a single, common `TransactionQueryService`.

### Consequences
- **Positive**: Single source of truth for all ledger querying and mathematical aggregations.
- **Negative**: AI extraction must strictly conform to the `TransactionQuery` schema.

---

## ADR-003: Deterministic Financial Retrieval

### Status
Accepted

### Context
Generative AI models are prone to arithmetic hallucination and cannot be trusted to calculate financial totals or execute unbounded database queries.

### Decision
All calculations (`SUM`, `COUNT`, `AVERAGE`, `MAX`, `MIN`) and filters are executed deterministically by PostgreSQL via Prisma. The LLM only receives verified facts for human-readable explanation.

### Consequences
- **Positive**: 100% mathematical accuracy and auditable ledger state.
- **Negative**: The query contract must explicitly model supported mathematical operations.

---

## ADR-004: AI as an Additive Interface Layer

### Status
Accepted

### Context
Finance One must remain fully functional as a standalone personal finance manager even if local/remote LLM services are offline or slow.

### Decision
AI features (intent matching, natural language query extraction, conversational explanations) are placed in an additive interface layer. The core application functions seamlessly without AI availability.

### Consequences
- **Positive**: High reliability, offline resiliency, and clear separation of concerns.
- **Negative**: Requires graceful UI fallbacks when AI services are unavailable.

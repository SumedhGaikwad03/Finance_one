# System Architecture Overview

Finance One is structured as a **modular monorepo** containing a web client and a monolithic backend service, backed by PostgreSQL.

---

## 1. High-Level Topology

```text
+-------------------------------------------------------------+
|                      Client Layer (PWA)                     |
|                React 19 + Vite + React Router               |
|            TanStack Query + React Hook Form + Zod           |
+------------------------------+------------------------------+
                               |
                               | REST (JSON over HTTP)
                               | Authorization: Bearer <JWT>
                               v
+-------------------------------------------------------------+
|                      Server Layer (Node.js)                 |
|                      Express + TypeScript                   |
|                                                             |
|  +-------------------------------------------------------+  |
|  | Middleware: Auth (JWT), Error Handling, CORS          |  |
|  +-------------------------------------------------------+  |
|  | Controllers: Auth, User, Transaction, Budget, Dash    |  |
|  +-------------------------------------------------------+  |
|  | Schemas: Zod Input Validation                         |  |
|  +-------------------------------------------------------+  |
|  | Services: Transaction, Budget, Dashboard, Analytics   |  |
|  +-------------------------------------------------------+  |
|  | Repositories: Direct Prisma ORM Calls                 |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  +-------------------------------------------------------+  |
|  | AI Module (Additive Interface Layer)                  |  |
|  | - SkillMatcher (pgvector similarity search)           |  |
|  | - LLMQueryExtractor (Ollama extraction to TxQuery)    |  |
|  | - PromptBuilder & LLM Provider (Explanations)         |  |
|  +-------------------------------------------------------+  |
+------------------------------+------------------------------+
                               |
                               | Prisma Client (TCP connection)
                               v
+-------------------------------------------------------------+
|                    Persistence Layer (PostgreSQL)           |
|  - Users, Transactions, Budgets                             |
|  - SkillEmbeddings (pgvector extension, 2560-dim vectors)   |
+-------------------------------------------------------------+
```

---

## 2. Ingestion & Retrieval Flow Separation

The architecture enforces strict separation between transaction **creation** and transaction **querying**:

```text
[ INGESTION PIPELINE ]
Manual Form / Share / Screenshot ──> TransactionCandidate ──> Normalization ──> Transaction Service ──> PostgreSQL

[ RETRIEVAL PIPELINE ]
UI Query Builder / AI NLP Intent ──> TransactionQuery ──> Transaction Service ──> PostgreSQL ──> Normalization ──> UI / LLM
```

---

## 3. Technology Stack Summary

| Area | Technology | Purpose | Status |
|---|---|---|---|
| Frontend Monorepo App | React 19, TypeScript, Vite | Client application | Implemented |
| State & Cache | TanStack React Query v5 | Server state caching & invalidation | Implemented |
| Routing | React Router v7 | Client routing & protected routes | Implemented |
| Forms & Validation | React Hook Form, Zod | Client input collection & validation | Implemented |
| Charts | Recharts | Visual spending breakdowns & gauges | Implemented |
| Backend Runtime | Node.js, Express, TypeScript | REST API service | Implemented |
| Database & ORM | PostgreSQL, Prisma ORM | Relational persistence | Implemented |
| Vector Extension | pgvector (`vector(2560)`) | Semantic skill embedding storage | Implemented |
| Auth & Security | bcrypt, jsonwebtoken | Password hashing & JWT session auth | Implemented |
| Local LLM / Embeddings | Ollama (`nomic-embed-text`, LLM) | Query extraction & skill matching | Partially Implemented |

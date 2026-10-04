# Finance One — Future Product & Technical Architecture Plan

**Document Status:** Approved Target Architecture & Roadmap  
**Target Horizon:** 2026 – 2028  
**Scope:** Ingestion Pipelines, Financial Knowledge Layer, Hybrid RAG, Multi-Provider AI Copilot, and Staged Evolution  
**Author:** Core Engineering & Architecture Team  

---

## 1. Executive Vision

Finance One is evolving from an MVP transaction tracker into an **autonomous personal financial copilot and financial intelligence platform**.

### What Finance One Is NOT
- It is **not** a simple CRUD ledger with a generic chatbot pasted on top.
- It is **not** a black-box AI tool that hallucinates bank balances or executes arbitrary unverified SQL.
- It is **not** a locked-in ecosystem coupled to a single AI vendor or brittle platform scraping mechanism.

### What Finance One IS
> **A personal financial copilot built on top of an immutable, normalized financial knowledge system.**

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FINANCE ONE COPILOT                                  │
│                 Understand · Explain · Compare · Detect · Forecast · Assist            │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                FINANCIAL INTELLIGENCE LAYER                            │
│           Skill Routing · Intent Extraction · Hybrid SQL/Vector RAG · LLM Reasoning    │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               FINANCIAL KNOWLEDGE LAYER                                │
│       PostgreSQL Canonical Truth · Semantic Financial Embeddings · Document Store      │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               MODULAR INGESTION PIPELINE                               │
│        Manual Form · Quick Add · CSV/Excel · PDF Statements · Receipt OCR · Connectors  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

The core philosophy rests on an uncompromising foundation:
1. **The Ledger is the Canonical Truth**: Financial calculations (sums, balances, category totals, period boundaries) are strictly computed by deterministic SQL engines (PostgreSQL / Prisma).
2. **AI as Interface and Reasoning**: Generative models and vector indexes provide natural language intent extraction, semantic contextual lookup, and grounded financial reasoning—they never invent or guess numbers.
3. **Ingestion Modularity**: Ingestion mechanisms (manual, statement parsing, OCR, webhooks) are decoupled adapters converging into one canonical candidate pipeline.

---

## 2. Current State (Repository Audit)

Based on an exhaustive audit of the `Finance_one` repository (`apps/server`, `apps/web`, `prisma/schema.prisma`, `docs/`), here is the verified implementation inventory:

```text
┌──────────────────────────────────────────────────────┬─────────────────────────┬──────────────────────────────────────────────────────────┐
│ Subsystem / Feature                                  │ Implementation Status   │ Codebase Location                                        │
├──────────────────────────────────────────────────────┼─────────────────────────┼──────────────────────────────────────────────────────────┤
│ User Auth & JWT Middleware (10h expiry, bcrypt)     │ IMPLEMENTED             │ `apps/server/src/controllers/auth.controller.ts`         │
│ User Profile & Password Security Management          │ IMPLEMENTED             │ `apps/server/src/controllers/user.controller.ts`         │
│ Transaction CRUD & Multi-Filter Query Engine         │ IMPLEMENTED             │ `apps/server/src/controllers/transaction.controller.ts`  │
│ Heuristic Quick Add Parser ("450 lunch")             │ IMPLEMENTED             │ `apps/server/src/utils/transactionParser.ts`             │
│ Budget Engine (Weekly, Monthly, Quarterly + Overlap) │ IMPLEMENTED             │ `apps/server/src/services/budget.service.ts`             │
│ Financial Dashboard Analytics (KPIs, Charts)         │ IMPLEMENTED             │ `apps/server/src/services/dashboard.service.ts`          │
│ Guided Query Explorer (2-step category/timeframe)    │ IMPLEMENTED             │ `apps/web/src/components/ai/QueryBuilder.tsx`            │
│ Frontend Heuristic Intent Parser                     │ IMPLEMENTED             │ `apps/web/src/services/financeQuery.service.ts`          │
│ Public Landing Page & Early Beta Roadmap UI          │ IMPLEMENTED             │ `apps/web/src/pages/Landing/LandingPage.tsx`             │
│ Production Health Probing (`GET /health` + DB ping)  │ IMPLEMENTED             │ `apps/server/src/controllers/health.controllers.ts`      │
│ CORS Whitelist & Graceful Teardown Lifecycle         │ IMPLEMENTED             │ `apps/server/src/app.ts`, `apps/server/src/index.ts`     │
│ pgvector SkillEmbedding Model (`vector(2560)`)       │ IMPLEMENTED             │ `apps/server/prisma/schema.prisma`                       │
│ Ollama Embedding & LLM Providers (Qwen 4B)           │ IMPLEMENTED             │ `apps/server/src/ai/providers/`                          │
│ Vector Search & Skill Matcher Service                │ IMPLEMENTED             │ `apps/server/src/ai/services/skill-matcher.service.ts`   │
│ LLM Query Intent Extractor (`TransactionQuery` JSON) │ IMPLEMENTED             │ `apps/server/src/ai/services/llm-query-extractor.service`│
│ Date Range Resolver (`relative` & `calendar`)        │ IMPLEMENTED             │ `apps/server/src/ai/utils/date-range.utils.ts`           │
│ AI Express Controller & Unmounted Route              │ PARTIALLY IMPLEMENTED   │ `apps/server/src/ai/controllers/ai.controller.ts`        │
│ PWA Service Worker & Manifest Generation             │ PARTIALLY IMPLEMENTED   │ `apps/web/vite.config.ts`                                │
│ AI Service Orchestrator (`ai.service.ts`)            │ STUBBED                 │ `apps/server/src/ai/services/ai.service.ts` (stub)       │
│ Prompt Builder (`prompt.builder.ts`)                 │ STUBBED (0 bytes)       │ `apps/server/src/ai/prompts/prompt.builder.ts`           │
│ Secondary Skills (Analytics, Forecast, Knowledge)    │ STUBBED (0 bytes)       │ `apps/server/src/ai/skills/*.ts`                         │
│ CSV / Excel Bank Statement Ingestion                 │ PLANNED                 │ `docs/transaction/candidate-model.md`                    │
│ PDF Bank Statement Parser                            │ PLANNED                 │ Target Phase 3                                           │
│ Receipt & Invoice OCR Ingestion                      │ PLANNED                 │ Target Phase 4                                           │
│ Transaction Semantic Vector Indexing                 │ PLANNED                 │ Target Phase 5                                           │
│ Hybrid Grounded RAG Copilot                          │ PLANNED                 │ Target Phase 6                                           │
│ Offline IndexedDB Transaction Queue                  │ PLANNED                 │ Target Mobile / PWA Expansion                            │
│ SMS / Notification OS-Level Adapter                  │ NOT STARTED / OPTIONAL  │ Reserved for future mobile native client                 │
└──────────────────────────────────────────────────────┴─────────────────────────┴──────────────────────────────────────────────────────────┘
```

---

## 3. Product Direction

Finance One is evolving across four distinct evolutionary horizons:

```text
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│         STAGE 1           │      │         STAGE 2           │      │         STAGE 3           │      │         STAGE 4           │
│     Core Smart Ledger     │ ───► │   Universal Ingestion     │ ───► │  Financial Knowledge Base │ ───► │     Financial Copilot     │
│                           │      │                           │      │                           │      │                           │
│ • Manual Entry & Quick Add│      │ • CSV / Excel Imports     │      │ • Semantic Vector Search  │      │ • Autonomous Advisory     │
│ • Category Budgets        │      │ • PDF Statement Parsers   │      │ • Document Attachments    │      │ • Anomaly Detection       │
│ • Deterministic Explorer  │      │ • Receipt OCR Pipeline    │      │ • Recurring Pattern Graph │      │ • Cashflow Forecasting    │
│ • Relational Aggregations │      │ • Reconciliation Review   │      │ • User Provenance Audit   │      │ • Multi-turn Copilot UI   │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

### From Ledger to Copilot
- In **Stage 1 (Current)**, Finance One proves that manual entry can be fast, deterministic, and frictionless.
- In **Stage 2**, it removes data entry fatigue by ingesting full bank statements and receipts cleanly.
- In **Stage 3**, it converts historical records into an enriched, vectorized financial graph.
- In **Stage 4**, it acts as a proactive financial partner capable of answering deep questions, detecting spending leaks, and forecasting future cash positions.

---

## 4. Architectural Principles

1. **Different Ingestion Methods Must NOT Create Different Financial Systems**:
   Whether a record originates from a manual modal, an OCR scanned fuel slip, or a 1,000-row HDFC Bank PDF statement, it must normalize into the exact same `CandidateTransaction` schema before persisting as a canonical `Transaction`.
2. **Vector Retrieval is an Index Over Financial Truth, NOT the Source of Truth**:
   PostgreSQL handles ledger balances, date boundaries, category budgets, and mathematical sums. Vectors handle semantic association, fuzzy document search, and unstructured context retrieval.
3. **Asynchronous Background Indexing**:
   Financial ledger mutations must complete in single-digit milliseconds. Vector generation, LLM embedding calls, and document chunking occur asynchronously via background job workers.
4. **Strict Multi-Tenant User Isolation**:
   `userId` is derived exclusively from cryptographically verified auth tokens. Every database query, vector cosine distance check, document storage path, and LLM context window is strictly bound to `userId`.
5. **Provider Agnostic Reasoning**:
   The user or deployment environment can switch between local LLMs (Ollama), Google Gemini, OpenAI, or Anthropic for reasoning without breaking embedding vector spaces or domain schemas.
6. **Privacy by Default**:
   Financial documents and statements are parsed locally or through secure user-designated endpoints. User data is minimized, fully auditable, and completely exportable or deletable on demand.

---

## 5. Current Architecture

```text
[ React 19 Client (Vite) ]
  ├── AuthContext (localStorage JWT)
  ├── React Router v7 (Landing, Login, Register, Dashboard, Transactions, Budgets, Settings)
  └── QueryBuilder (Frontend Heuristic Parser + Category/Timeframe Wizard)
            │
            ▼ HTTP REST (JSON)
[ Express 5 Monolith (apps/server) ]
  ├── authMiddleware (JWT Verification -> req.user = { userId })
  ├── Domain Controllers (auth, user, transaction, budget, dashboard, health)
  ├── Centralized errorMiddleware (Zod validation, AppError hierarchy, generic 500)
  ├── Repositories (Prisma Client queries)
  └── Isolated AI Subsystem (Unmounted prototypes for Ollama embeddings & skill matching)
            │
            ▼ SQL via @prisma/adapter-pg (pg.Pool)
[ PostgreSQL Database (finance_one) ]
  ├── User
  ├── Transaction (Decimal amount, Category enum, Priority enum, transactionDate)
  ├── Budget (amount, periodType enum, startDate, isLocked)
  └── SkillEmbedding (Unsupported("vector(2560)"), skillId, exampleText)
```

---

## 6. Target Architecture (Modular Monolith)

Finance One will remain a **clean Modular Monolith** inside `apps/server` until scale requires physical service boundaries. Microservices are explicitly rejected at this stage to avoid network latency, distributed transaction complexity, and operational overhead.

```text
apps/server/src/
├── core/                               # Cross-cutting foundational infrastructure
│   ├── auth/                           # JWT, bcrypt, session guards, RBAC
│   ├── database/                       # Prisma client, connection pool, transactions
│   ├── errors/                         # Domain & application error classes
│   ├── events/                         # In-memory / BullMQ async event bus
│   ├── logging/                        # Sanitized structured logging (Pino)
│   └── middleware/                     # Auth, rate limiting, CORS, error handlers
│
├── modules/                            # High-cohesion domain modules
│   ├── identity/                       # User management, profile settings, credentials
│   ├── transactions/                   # Canonical ledger, CRUD, filtering, tags
│   ├── budgets/                        # Category & timeframe budgets, lock rules, alerts
│   ├── analytics/                      # SQL aggregation pipelines, KPI calculators
│   │
│   ├── ingestion/                      # INGESTION SUBSYSTEM
│   │   ├── candidate/                  # CandidateTransaction DTO, validation, dedupe
│   │   ├── parsers/                    # Bank-specific parsers (HDFC, ICICI, SBI, Axis)
│   │   │   ├── csv/                    # CSV / Excel streaming parser
│   │   │   └── pdf/                    # PDF text & table layout extractor
│   │   ├── ocr/                        # Receipt / Invoice OCR visual parser (Gemini / Tesseract)
│   │   ├── review/                     # Batch review, categorization, commit service
│   │   └── adapters/                   # Future webhook / financial connector adapters
│   │
│   ├── knowledge/                      # FINANCIAL KNOWLEDGE SUBSYSTEM
│   │   ├── documents/                  # Statement & receipt raw file storage & metadata
│   │   ├── embeddings/                 # Asynchronous vector generation worker & pgvector repo
│   │   └── patterns/                   # Recurring expense detection & merchant normalizer
│   │
│   └── copilot/                        # FINANCIAL COPILOT & REASONING SUBSYSTEM
│       ├── routing/                    # Skill & capability vector matcher
│       ├── extraction/                 # Structured JSON intent extractor
│       ├── retrieval/                  # Hybrid SQL + semantic vector retriever
│       ├── context/                    # Context builder & verified financial fact envelope
│       ├── reasoning/                  # Provider-agnostic LLM interface (Ollama, Gemini, OpenAI)
│       └── skills/                     # Skill handlers (retrieval, forecast, advisor, audit)
```

---

## 7. Financial Data Model

The database separates **immutable canonical truth** from **semantic retrieval indexes** and **staging candidates**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               RELATIONAL DATA (POSTGRESQL)                             │
│                                (Authoritative Financial Truth)                         │
│                                                                                        │
│  ┌─────────────────────────┐     ┌─────────────────────────┐     ┌──────────────────┐  │
│  │          User           │     │       Transaction       │     │      Budget      │  │
│  ├─────────────────────────┤     ├─────────────────────────┤     ├──────────────────┤  │
│  │ id (PK)                 │◄────┤ id (PK)                 │     │ id (PK)          │  │
│  │ email                   │     │ userId (FK)             │     │ userId (FK)      │  │
│  │ passwordHash            │     │ amount (Decimal 12,2)   │     │ amount           │  │
│  │ name                    │     │ category (Enum)         │     │ periodType       │  │
│  │ defaultCurrency         │     │ priority (Enum)         │     │ startDate        │  │
│  │ createdAt               │     │ transactionDate (UTC)   │     │ isLocked         │  │
│  └─────────────────────────┘     │ title, notes            │     └──────────────────┘  │
│                                  │ source (MANUAL/CSV/OCR) │                           │
│                                  │ sourceDocumentId (FK)   │                           │
│                                  │ merchantNormalized      │                           │
│                                  └─────────────────────────┘                           │
└────────────────────────────────────────────┬───────────────────────────────────────────┘
                                             │
                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                SEMANTIC INDEX (PGVECTOR)                               │
│                             (Fast Search & Retrieval Index)                            │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                FinancialEmbedding                                │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │ id (PK)             │ BigInt auto-increment                                      │  │
│  │ userId (FK)         │ Strict multi-tenant owner isolation                        │  │
│  │ sourceType          │ TRANSACTION | DOCUMENT | RECEIPT | RECURRING_PATTERN       │  │
│  │ sourceId            │ Referenced canonical record ID                             │  │
│  │ provider            │ nomic | qwen | gemini | openai                             │  │
│  │ model               │ nomic-embed-text-v1.5 | text-embedding-004                 │  │
│  │ modelVersion        │ 1.0                                                        │  │
│  │ dimensions          │ 768 / 1536 / 2560                                          │  │
│  │ embedding           │ vector(dimensions)                                         │  │
│  │ contentHash         │ SHA-256 hash of normalized text representation             │  │
│  │ createdAt           │ DateTime (UTC)                                             │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Ingestion Architecture

Every ingestion method flows through a common 7-step pipeline:

```text
1. RAW INPUT SOURCE (Manual Form, CSV Upload, Bank Statement PDF, Receipt Photo)
       │
       ▼
2. FORMAT ADAPTER (Extracts raw tabular rows or raw OCR text blocks)
       │
       ▼
3. NORMALIZATION STAGE
   ├── Date resolution (handles DD/MM/YYYY, MM/DD/YYYY, ISO, relative text)
   ├── Amount cleanup (strips currency symbols, parses Debit vs Credit, handles negative values)
   └── Description tokenization & merchant name cleaning
       │
       ▼
4. DEDUPLICATION ENGINE
   ├── Content Hash Matching: SHA-256 (userId + date + amount + cleanDescription)
   └── Fuzzy Window Matching: Same amount within ±2 days of existing transaction
       │
       ▼
5. CANDIDATE TRANSACTION CREATION
   ├── Status: PENDING_REVIEW | AUTO_ACCEPTED | REJECTED
   ├── Confidence Score: 0.00 – 1.00
   └── Suggested Category & Priority
       │
       ▼
6. USER RECONCILIATION & REVIEW (Single-click batch approval / edits)
       │
       ▼
7. CANONICAL TRANSACTION COMMIT (Atomic PostgreSQL insertion + async vector queue emit)
```

---

## 9. Manual Entry (Quick Add & Detailed Modal)

Manual entry remains the fastest method for daily ad-hoc expenses.

### Components
1. **Detailed Modal**: Comprehensive modal with amount, category dropdown, priority tags, date-picker, notes, and custom titles.
2. **Heuristic Quick Add**: Rule-based regex tokenizer on frontend and backend (`transactionParser.ts`):
   - `"450 lunch"` $\to$ Amount: `450`, Category: `FOOD`, Date: `Today`
   - `"₹1,200 petrol yesterday"` $\to$ Amount: `1200`, Category: `FUEL`, Date: `Today - 1`
   - `"salary 85000 1st"` $\to$ Amount: `85000`, Category: `OTHER`, Date: `1st of current month`

Manual entries bypass the pending review stage and write directly to `Transaction` with `source: MANUAL`.

---

## 10. CSV / Excel Bank Statement Import

Bank statements in tabular formats (CSV, XLS, XLSX) account for large historical backfills.

```text
Upload File (CSV / Excel)
            │
            ▼
[ Stream Parser (PapaParse / ExcelJS) ] ──► Chunked row streaming (avoids high RAM usage)
            │
            ▼
[ Bank Header Auto-Detector ]
  ├── Detects bank templates (HDFC, SBI, ICICI, Axis, Kotak, Chase, Amex, Custom)
  └── Maps column headers (Date, Description, Ref/Chq No, Debit, Credit, Balance)
            │
            ▼
[ Row Normalizer & Rule Engine ]
  ├── Resolves Debit vs Credit into unsigned amount + type
  ├── Cleans UPI strings ("UPI/502919482910/Swiggy/PYTM" -> "Swiggy")
  └── Assigns category heuristics
            │
            ▼
[ Staging Table / Batch Candidate Grid ] ──► Displays duplicates flagged in amber/red
            │
            ▼
[ User Confirm & Bulk Insert ] ──► Atomic batch transaction insertion
```

---

## 11. PDF Statement Import

PDF statements represent the standard export format for retail banking, requiring visual and layout structure parsing.

### Pipeline
1. **Document Upload & Storage**: PDF stored encrypted in local filesystem / private S3 bucket with `sourceDocumentId`.
2. **Password Handling**: Secure, memory-only password prompt for password-protected bank PDFs (never stored on disk).
3. **Table Structure Extraction**: Uses layout-aware table extraction (e.g. `pdf2json` / `pdf-table-extractor` / Python worker) to preserve column alignments across multi-page tables.
4. **Header & Footer Stripping**: Ignores recurring page headers, branch addresses, and disclaimer text.
5. **Convergence into Candidate Pipeline**: Extracted rows feed directly into Step 3 of the Canonical Ingestion Pipeline.

---

## 12. Receipt & Document OCR Pipeline

Enables users to capture photos of physical receipts, fuel bills, or invoices on mobile or desktop.

```text
Receipt Image Capture (JPEG / PNG / WebP)
                  │
                  ▼
[ Image Preprocessing ] (Auto-rotate, contrast enhancement, crop)
                  │
                  ▼
[ Visual OCR Extraction ]
  ├── Cloud Mode: Google Gemini 2.0 Flash / Vision API (High-accuracy structured output)
  └── Local Mode: Tesseract.js / Local OCR engine (Private, on-device)
                  │
                  ▼
[ Structured Key Extraction ]
  ├── Merchant Name
  ├── Transaction Date & Time
  ├── Total Amount & Tax Breakdown (GST/VAT)
  ├── Line Items (Optional itemized breakdown)
  └── Payment Method (Cash / Card ending in 4 digits)
                  │
                  ▼
[ Candidate Transaction with Attached Image Preview ]
                  │
                  ▼
[ User Quick Review & Save ]
```

---

## 13. Financial Embedding Architecture

Semantic indexing must never slow down ledger writes. All embedding generation is decoupled through an **asynchronous job queue**:

```text
Transaction Committed to PostgreSQL
                 │
                 ├──► Return HTTP 201 Success to User (< 10ms)
                 │
                 └──► Emit Job to Queue: `generate-financial-embedding`
                                 │
                                 ▼
                     [ Background Worker Queue ]
                                 │
                                 ▼
                     [ Content Hash Check ]
                     Compute SHA-256(Record Text Representation)
                     Skip if contentHash matches existing index
                                 │
                                 ▼
                     [ Embedding Provider API ]
                     (Generates 768d / 1536d / 2560d Vector)
                                 │
                                 ▼
                     [ Upsert into `FinancialEmbedding` ]
                     Stored with provider, modelVersion, dimensions, userId
```

### Worker Invariants
- **Idempotency**: Repeated worker executions for the same transaction produce zero duplicate vectors.
- **Batched Processing**: Re-indexing runs in batches of 100 to optimize throughput and comply with provider rate limits.
- **Cascade Deletion**: When a user deletes a transaction, its associated `FinancialEmbedding` row is deleted via database foreign key cascade.

---

## 14. Skill Embedding Architecture

Skill embeddings are small, static vectors representing **system capabilities and query intents** rather than user data.

```text
User Question ("Where did my money go this week?")
                        │
                        ▼
             [ Generate Embedding ]
                        │
                        ▼
      [ Cosine Distance Search on SkillEmbedding ]
   SELECT skillId FROM "SkillEmbedding" ORDER BY distance LIMIT 1;
                        │
                        ▼
         Similarity >= 0.70 Threshold
      ├── YES ──► Route to Specific Skill Handler (e.g. `transaction-retrieval`)
      └── NO  ──► Fallback to General Financial Copilot / Heuristic Parser
```

### Registered Skills
- `transaction-retrieval`: Factual lookup, filters, sums, category aggregations.
- `budget-advisory`: Budget utilization checks, affordability checks.
- `anomaly-detection`: Spending spikes, unusual merchant charges, duplicate debits.
- `recurring-audit`: Subscription reviews, price hike detections.
- `cashflow-forecast`: End-of-month trajectory, balance projections.

---

## 15. Hybrid RAG Architecture

Finance One implements a **two-tier Hybrid Retrieval Pipeline**:

```text
                              ┌────────────────────────────────────────┐
                              │          User Financial Query          │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │        Intent & Parameter Router       │
                              └───────────────────┬────────────────────┘
                                                  │
                         ┌────────────────────────┴────────────────────────┐
                         │                                                 │
                         ▼                                                 ▼
        ┌────────────────────────────────┐                ┌────────────────────────────────┐
        │       STRUCTURED QUERIES       │                │       SEMANTIC QUERIES         │
        │ ("How much spent on food?")    │                │ ("What did my Goa trip cost?") │
        └────────────────┬───────────────┘                └────────────────┬───────────────┘
                         │                                                 │
                         ▼                                                 ▼
        ┌────────────────────────────────┐                ┌────────────────────────────────┐
        │   Deterministic SQL Query      │                │   Vector Search + SQL Filter   │
        │   (Category, Date, Amount)     │                │   (pgvector cosine retrieval)  │
        └────────────────┬───────────────┘                └────────────────┬───────────────┘
                         │                                                 │
                         └────────────────────────┬────────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │       Verified Fact Context Envelope   │
                              │ • Exact total, count, average, records │
                              │ • Category distributions & time series │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │       Grounded LLM Prompt Builder      │
                              │  "Answer using ONLY verified facts"    │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │       Financial Copilot Response       │
                              │  (Conversational Text + Rich UI Cards) │
                              └────────────────────────────────────────┘
```

---

## 16. Query & Intent Extraction Architecture

The `LLMQueryExtractor` converts unstructured text into a canonical `TransactionQuery` DTO via strict JSON Schema mode:

```typescript
export interface CanonicalTransactionQuery {
  operation: "SUM" | "COUNT" | "LIST" | "AVERAGE" | "MAX" | "MIN" | "BREAKDOWN";
  categories?: Category[];
  priorities?: Priority[];
  startDate?: string;       // ISO 8601 UTC
  endDate?: string;         // ISO 8601 UTC
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
  sortBy?: "transactionDate" | "amount";
  sortDirection?: "asc" | "desc";
  limit?: number;
  offset?: number;
}
```

Relative terms like *"last 3 months"*, *"since last Friday"*, or *"Q1 2026"* are converted into deterministic UTC timestamps using pure TypeScript date arithmetic ([`date-range.utils.ts`](file:///c:/Users/777su/Desktop/Finance_one/apps/server/src/ai/utils/date-range.utils.ts)).

---

## 17. Financial Copilot Architecture

The Copilot answers three distinct classes of financial inquiries:

```text
┌─────────────────────────┬──────────────────────────────────┬────────────────────────────────────────────────────────┐
│ Query Type              │ Execution Engine                 │ Example Question                                       │
├─────────────────────────┼──────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 1. Deterministic Facts  │ Pure SQL / Aggregate Engine      │ "How much did I spend on groceries in January?"        │
│ 2. Semantic Context     │ Vector Retrieval + SQL Metadata  │ "What did my Mumbai conference trip cost in total?"    │
│ 3. Complex Reasoning    │ Verified Facts + Constrained LLM │ "Can I afford a ₹35,000 vacation next month?"          │
└─────────────────────────┴──────────────────────────────────┴────────────────────────────────────────────────────────┘
```

### Guardrails
- If a query asks for factual calculations, the Copilot must pull the exact number from the SQL execution envelope.
- If data is missing or insufficient (e.g. no transactions recorded for an asked category), the Copilot explicitly reports the lack of records rather than guessing.

---

## 18. LLM Provider Abstraction

The system decouples **Embedding Providers** from **Reasoning LLM Providers**:

```typescript
export interface EmbeddingProvider {
  name: string;
  dimensions: number;
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
}

export interface ReasoningProvider {
  name: string;
  generateCompletion(prompt: string, context: FinancialFactEnvelope): Promise<string>;
  generateStructuredQuery(prompt: string, schema: object): Promise<object>;
}
```

### Supported Backends
- **Google Gemini API**: Primary cloud provider (Gemini 2.0 Flash for sub-second structured extraction & reasoning).
- **Local Ollama**: Local privacy mode (Qwen 2.5 / Llama 3.2 for zero-cloud offline operations).
- **OpenAI / Anthropic**: Optional alternative cloud adapters.

---

## 19. Model & Embedding Versioning Strategy

Embedding models change over time. To prevent index corruption:
1. **Model Tagging**: Every entry in `FinancialEmbedding` stores `model`, `modelVersion`, and `dimensions`.
2. **Dual-Index Migration**: During an embedding model upgrade, the background worker builds vectors under the new model version alongside the old one. Once migration reaches 100%, the active search pointer switches atomically.
3. **Content Hash Invalidation**: When a transaction record's amount, category, or note changes, the computed `contentHash` diverges, triggering automatic re-indexing.

---

## 20. Privacy Architecture

```text
USER FINANCIAL DATA
         │
         ▼
[ Local Normalization & Masking ] ──► PII stripped (Account numbers, raw PAN/SSN masked)
         │
         ▼
[ User-Designated Processing Boundary ]
  ├── Mode A (Local / Private): 100% processed via Local Ollama & local PostgreSQL
  └── Mode B (Cloud Accelerated): TLS 1.3 encrypted transit to zero-data-retention AI APIs
         │
         ▼
[ Verifiable Audit Logs & Provenance Tracking ]
  └── Every record traces back to its exact origin (Manual modal, CSV filename, Receipt scan)
```

Users maintain absolute data sovereignty:
- **Right to Export**: Full JSON / CSV database export in one click.
- **Right to Erasure**: Hard cascade deletion of user records, attachments, embeddings, and logs.

---

## 21. Security & Multi-Tenancy

Data leakage between users is prevented at the database and application levels:
1. **Server-Enforced `userId`**: `userId` is never accepted as a client-provided parameter in query strings or JSON bodies. It is extracted strictly from the verified JWT in `authMiddleware`.
2. **SQL Isolation**: All Prisma and raw SQL queries append `WHERE "userId" = $userId`.
3. **Vector Isolation**: All pgvector similarity queries mandate `"userId" = $userId`:
   ```sql
   SELECT "sourceId", "embedding" <=> $queryVector::vector AS distance
   FROM "FinancialEmbedding"
   WHERE "userId" = $userId AND "model" = $activeModel
   ORDER BY distance LIMIT 20;
   ```
4. **Context Window Sanitization**: Context builders verify ownership of all included records before serializing prompt payloads.

---

## 22. AI Evaluation & Reliability Strategy

To guarantee continuous precision, the AI pipeline is evaluated against automated test suites:

```text
┌────────────────────────────┬─────────────────────────────┬────────────────────────────────────────────────────────┐
│ Evaluation Area            │ Metric Target               │ Test Mechanism                                         │
├────────────────────────────┼─────────────────────────────┼────────────────────────────────────────────────────────┤
│ Intent Classification      │ >= 98% Accuracy             │ 200 synthetic prompts tested against SkillMatcher      │
│ Query Parameter Extraction │ 100% Valid Schema Output    │ Zod schema validation & date arithmetic assertions     │
│ Vector Retrieval Recall    │ >= 90% Recall@10            │ Benchmark test queries with labeled ground-truth IDs   │
│ Financial Math Accuracy    │ 100.00% Zero-Variance       │ Ledger test cases matching database aggregates exactly │
│ LLM Hallucination Rate     │ 0.00% Unsupported Figures   │ Fact-checking validator comparing response to envelope │
└────────────────────────────┴─────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 23. Cost & Scaling Strategy

To maintain sub-second response times and near-zero operating costs:
- **Tier 1 (Free & Fast - 75% of queries)**: Deterministic SQL & Frontend heuristic parser (0 API tokens).
- **Tier 2 (Cheap - 15% of queries)**: Local/cloud vector embedding search (~0.0001¢ per query).
- **Tier 3 (Targeted - 10% of queries)**: Full LLM reasoning with compact, pre-aggregated financial facts (sub-500 token contexts).
- **Caching**: Aggregated monthly category totals cached in-memory and invalidated only on ledger mutations.

---

## 24. Mobile & React Native Strategy

Finance One's backend API is client-agnostic. The same REST and ingestion endpoints serve:
- **Web App (Vite + React 19)**: Desktop & laptop dashboard, full-screen Query Explorer, bulk statement import.
- **PWA (Mobile Web)**: Standalone installable client on iOS/Android.
- **Future React Native Client**: Native camera receipt scanning, biometric auth (FaceID/Fingerprint), OS Share Sheet integration.

---

## 25. Future Automatic Ingestion (Adapters)

OS-level SMS / push notification parsing will be implemented as **optional, platform-specific edge adapters**:
- Ingestion happens on-device inside the client app.
- Extracted candidates feed into the standard `POST /api/ingestion/candidates` endpoint.
- Server core remains 100% decoupled from Android SMS permissions or proprietary bank APIs.

---

## 26. Technical Trade-Offs

| Decision | Chosen Approach | Alternative Considered | Rationale |
| :--- | :--- | :--- | :--- |
| **Architecture** | Modular Monolith in Express 5 | Microservices | Eliminates distributed transaction bugs and operational complexity. |
| **Vector Store** | PostgreSQL `pgvector` | Dedicated Pinecone / Qdrant | Single ACID database for relational ledger + vector search; zero sync lag. |
| **Calculations** | Deterministic SQL math | LLM numerical reasoning | Eliminates financial hallucinations completely. |
| **Ingestion** | User review candidate staging | Silent automatic insertion | Protects ledger integrity from misclassified or duplicate entries. |
| **Embedding** | Asynchronous worker queue | Synchronous on-save embedding | Prevents network latency from blocking ledger write operations. |

---

## 27. What We Should NOT Build Yet

To maintain execution focus and code quality, the team must **NOT** build:
1. Direct live bank scraping / reverse-engineered bank login bots.
2. Uncontrolled natural-language SQL generation (e.g. `text-to-sql` directly executing on production DB).
3. Complex microservices architectures.
4. Social / peer-to-peer money transfers.
5. Stock / crypto trading integrations.
6. Premature multi-currency forex arbitrage engines.

---

## 28. Phased Development Roadmap

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Ingestion Foundation & CSV/Excel Parser                                       │
│ Phase 2: PDF Bank Statement Engine & Layout Parser                                     │
│ Phase 3: Receipt OCR Pipeline & Visual Ingestion                                       │
│ Phase 4: Financial Embedding Subsystem & Async Queue                                   │
│ Phase 5: Hybrid RAG & Financial Fact Context Builder                                   │
│ Phase 6: Multi-Provider Financial Copilot & Conversational UI                          │
│ Phase 7: Advanced Advisory (Anomaly Detection & Cashflow Forecast)                     │
│ Phase 8: Mobile Native App (React Native) & Edge Ingestion                             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 1 — Ingestion Foundation & CSV/Excel Parser

- **Goal**: Enable users to import historical transactions from CSV and Excel files with automated duplicate detection.
- **User Value**: Eliminates manual backfilling; users can import a full year of bank activity in seconds.
- **Current Repository State**: Manual entry and Quick Add heuristic parser exist; staging tables not yet created.
- **Features**: Drag-and-drop file upload, auto-header mapping, bank template detection (HDFC, SBI, ICICI, etc.), duplicate flagging, batch confirmation screen.
- **Backend Work**: `modules/ingestion/parsers/csv`, `modules/ingestion/candidate`, batch transaction insert endpoint.
- **Frontend Work**: File upload dropzone, interactive column mapping modal, candidate review table with approve/reject actions.
- **Database Work**: Add `source` enum (`MANUAL`, `CSV`, `PDF`, `OCR`) and `sourceDocumentId` to `Transaction`.
- **AI / RAG Work**: None (deterministic parsing).
- **Security**: File size limit (10MB), MIME validation, strict user isolation on batch commit.
- **Testing**: Integration tests with 20 sample CSV formats from major banks; deduplication edge case tests.
- **Dependencies**: Current MVP 1 core ledger.
- **Risks**: Corrupted CSV encodings or unusual date formats.
- **Estimated Complexity**: `Medium` (High domain variety in bank exports).
- **Definition of Done**: User can upload an HDFC or custom CSV, view parsed candidates, approve them, and see them reflected in the dashboard with zero duplicates.
- **Exit Criteria**: 100% test pass rate across all sample bank formats.

---

### Phase 2 — PDF Bank Statement Engine & Layout Parser

- **Goal**: Ingest native password-protected and standard PDF bank statements.
- **User Value**: Users can directly drop standard bank statement downloads without manual CSV conversion.
- **Current Repository State**: Not started.
- **Features**: PDF upload, memory-safe password decrypt prompt, multi-page tabular structure extraction, candidate preview.
- **Backend Work**: Layout-aware PDF extractor (`pdf2json` / table layout service), background parsing queue.
- **Frontend Work**: PDF upload UI with password unlock modal, parsing progress spinner, candidate reconciliation table.
- **Database Work**: Add `Document` model for storing statement metadata and import logs.
- **AI / RAG Work**: Optional fallback to LLM table extraction for malformed PDF layouts.
- **Security**: Passwords kept in memory only during decryption; files encrypted at rest.
- **Testing**: Tests against sample PDF statements with multi-page table splits and running balances.
- **Dependencies**: Phase 1 Ingestion Foundation.
- **Risks**: Scanned image PDFs without text layer (addressed in Phase 3).
- **Estimated Complexity**: `High` (PDF layout parsing across banks is notoriously variable).
- **Definition of Done**: 5 major bank PDF formats parse successfully into canonical transactions.
- **Exit Criteria**: Zero data loss on multi-page statement splits.

---

### Phase 3 — Receipt OCR Pipeline & Visual Ingestion

- **Goal**: Extract merchant, amount, tax, and date from receipt photos and invoice PDFs.
- **User Value**: Snap a picture of a restaurant bill or fuel receipt on mobile and add it instantly.
- **Current Repository State**: Not started.
- **Features**: Mobile camera capture / upload, visual bounding box review, auto-categorization.
- **Backend Work**: OCR service integration (Gemini 2.0 Flash Vision / Tesseract), image thumbnail generator.
- **Frontend Work**: Camera capture component, interactive receipt visual preview alongside extracted fields.
- **Database Work**: Add `ReceiptAttachment` model linked to `Transaction`.
- **AI / RAG Work**: Multimodal vision prompt returning strict JSON transaction candidates.
- **Security**: Image payload sanitized, metadata stripped, stored in private storage.
- **Testing**: Unit tests on crumpled, dim, and handwritten receipts.
- **Dependencies**: Phase 1 Candidate Pipeline.
- **Risks**: Poor lighting or blurry camera shots causing amount extraction errors.
- **Estimated Complexity**: `Medium` (Standardized multimodal LLMs make OCR extraction robust).
- **Definition of Done**: User uploads a receipt image, verifies extracted amounts in modal, and saves canonical transaction.
- **Exit Criteria**: >= 95% extraction accuracy on standard printed retail receipts.

---

### Phase 4 — Financial Embedding Subsystem & Async Queue

- **Goal**: Build an asynchronous embedding generation queue and store semantic vectors for all user financial activity.
- **User Value**: Lays the foundation for semantic search ("Find what I spent during my Goa trip").
- **Current Repository State**: `SkillEmbedding` exists for system skills; user transactions are not yet vectorized.
- **Features**: Background worker, content-hash deduplication, model versioning, batch re-indexing CLI.
- **Backend Work**: `FinancialEmbedding` repository, asynchronous job worker (BullMQ / PgBoss), vector upsert listener.
- **Frontend Work**: None (pure backend infrastructure).
- **Database Work**: Create `FinancialEmbedding` table with `userId`, `sourceType`, `sourceId`, `model`, `dimensions`, `embedding`.
- **AI / RAG Work**: Generate 768d / 1536d / 2560d embeddings via unified `EmbeddingProvider`.
- **Security**: Strict `userId` filtering on all vector queries.
- **Testing**: Tests verifying asynchronous worker execution, idempotency, and cascade deletions.
- **Dependencies**: Phase 1, Phase 2, Phase 3.
- **Risks**: Database storage growth (mitigated by compact 768d vectors and HNSW indexes).
- **Estimated Complexity**: `Medium`.
- **Definition of Done**: Every transaction automatically has an up-to-date vector embedding in PostgreSQL within 5 seconds of creation.
- **Exit Criteria**: Zero impact on HTTP transaction creation response time.

---

### Phase 5 — Hybrid RAG & Financial Fact Context Builder

- **Goal**: Connect structured SQL queries with semantic vector retrieval to construct verified financial fact envelopes.
- **User Value**: Users can ask complex multi-attribute questions that combine dates, fuzzy names, and amounts.
- **Current Repository State**: Heuristic `parseNaturalLanguageIntent` exists on frontend; backend RAG pipeline is unmounted.
- **Features**: Hybrid retriever, verified fact context envelope builder, guardrail validator.
- **Backend Work**: `modules/copilot/retrieval`, `modules/copilot/context`, `prompt.builder.ts`.
- **Frontend Work**: Query Explorer result view integration.
- **Database Work**: Optimize HNSW vector indexes on `FinancialEmbedding`.
- **AI / RAG Work**: PromptBuilder with strict context boundary rules ("Answer using ONLY supplied data").
- **Security**: Fact envelope sanitizer ensuring zero cross-tenant record inclusion.
- **Testing**: 100 test queries evaluated for precision, recall, and mathematical agreement with SQL.
- **Dependencies**: Phase 4 Embedding Subsystem.
- **Risks**: Context window token bloat (mitigated by pre-aggregation in SQL).
- **Estimated Complexity**: `High`.
- **Definition of Done**: Complex natural language queries retrieve exact financial context and produce grounded text summaries.
- **Exit Criteria**: 0% numerical hallucination across test benchmark.

---

### Phase 6 — Multi-Provider Financial Copilot & Conversational UI

- **Goal**: Full conversational Copilot drawer on desktop and mobile supporting multi-turn questions and Generative UI cards.
- **User Value**: Instant financial advice, spending breakdowns, and comparisons in natural conversational language.
- **Current Repository State**: `FinanceAIPanel` exists as drawer container; lacks multi-turn chat and streaming LLM integration.
- **Features**: Streaming chat UI, Generative UI widgets (inline charts, transaction tables, action buttons), provider selector (Ollama / Gemini / OpenAI).
- **Backend Work**: SSE streaming endpoint (`GET /api/copilot/stream`), conversation session manager, provider abstraction layer.
- **Frontend Work**: Chat drawer with markdown rendering, streaming tokens, interactive charts, and suggested prompt chips.
- **Database Work**: Add `CopilotConversation` and `CopilotMessage` models.
- **AI / RAG Work**: Multi-turn context maintenance, structured output streaming.
- **Security**: Rate limiting per user, token usage budget tracking.
- **Testing**: End-to-end multi-turn conversation tests; network disconnect recovery tests.
- **Dependencies**: Phase 5 Hybrid RAG.
- **Risks**: API latency on cloud providers (mitigated by streaming responses and fast models like Gemini 2.0 Flash).
- **Estimated Complexity**: `High`.
- **Definition of Done**: User can chat with Copilot, ask follow-up questions, and receive streaming answers with inline visual cards.
- **Exit Criteria**: First token rendered within < 800ms.

---

### Phase 7 — Advanced Advisory (Anomaly Detection & Cashflow Forecast)

- **Goal**: Proactive financial intelligence: anomaly detection, recurring charge audit, and cashflow projections.
- **User Value**: Alerts users to price hikes, forgotten subscriptions, and impending budget overruns before they happen.
- **Current Repository State**: Basic budget overlap guards; no statistical forecasting or anomaly detection.
- **Features**: Anomaly detection alerts on dashboard, recurring expense audit tab, cashflow trajectory gauge.
- **Backend Work**: Recurring expense pattern detector, linear regression & ARIMA trajectory calculator, daily digest worker.
- **Frontend Work**: Anomaly alert cards, subscription review widget, future cashflow projection chart.
- **Database Work**: Add `RecurringPattern` and `FinancialInsight` models.
- **AI / RAG Work**: `anomaly-detection` and `forecast` skill implementations.
- **Security**: Proactive insights generated entirely inside user tenant boundary.
- **Testing**: Statistical validation against historical test datasets with simulated price spikes.
- **Dependencies**: Phase 5, Phase 6.
- **Risks**: False-positive anomaly alerts causing notification fatigue (mitigated by conservative threshold tuning).
- **Estimated Complexity**: `High`.
- **Definition of Done**: System detects recurring charges, alerts user to a simulated 30% price hike, and forecasts month-end balance.
- **Exit Criteria**: < 5% false-positive rate on recurring charge detection.

---

### Phase 8 — Mobile Native App (React Native) & Edge Ingestion

- **Goal**: Standalone iOS and Android native apps with biometric authentication, camera scanner, and optional edge adapters.
- **User Value**: Native mobile experience with zero-friction camera receipt capture and biometric security.
- **Current Repository State**: Vite PWA web client; no React Native repository yet.
- **Features**: Biometric login (FaceID / Fingerprint), native camera OCR, push notifications, offline candidate queue.
- **Backend Work**: Push notification service (APNs / FCM), mobile token refresh endpoints.
- **Frontend Work**: React Native client codebase sharing domain TypeScript types and API contracts.
- **Database Work**: None.
- **AI / RAG Work**: On-device edge tokenization and receipt preprocessing.
- **Security**: Secure storage for refresh tokens (Keychain / Keystore).
- **Testing**: iOS and Android real-device test suites.
- **Dependencies**: All previous phases.
- **Risks**: Platform store review delays.
- **Estimated Complexity**: `Very High`.
- **Definition of Done**: App published on Apple TestFlight and Google Play Internal Track, authenticating and ingesting receipts natively.
- **Exit Criteria**: Feature parity with web client for transaction, budget, and copilot flows.

---

## 29. Dependency Graph

```text
Phase 1: Ingestion Foundation (CSV / Excel)
   │
   ├──────────────────────────────┐
   ▼                              ▼
Phase 2: PDF Statement Engine   Phase 3: Receipt OCR
   │                              │
   └──────────────┬───────────────┘
                  │
                  ▼
Phase 4: Financial Embedding Subsystem
                  │
                  ▼
Phase 5: Hybrid RAG & Context Builder
                  │
                  ▼
Phase 6: Multi-Provider Copilot & Conversational UI
                  │
                  ▼
Phase 7: Advanced Advisory (Anomalies & Forecasts)
                  │
                  ▼
Phase 8: Mobile Native App (React Native)
```

---

## 30. Definition of Done for Each Phase

A phase is considered **Complete and Ready for Production** only when:
1. **Schema & Migrations**: All database schema changes have corresponding idempotent Prisma migrations tested against PostgreSQL.
2. **Deterministic Fallbacks**: Every AI-augmented feature has a 100% functional deterministic fallback if the AI provider is unreachable.
3. **Multi-Tenant Security**: Automated unit/integration tests explicitly verify that User A cannot read, query, or vectorize User B's records.
4. **Performance Budgets**:
   - HTTP ledger writes: $< 50\text{ ms}$
   - Vector similarity lookups: $< 100\text{ ms}$
   - LLM Streaming Time-to-First-Token: $< 800\text{ ms}$
5. **Code & Documentation**: Code passes `tsc`, unit test coverage $\ge 90\%$ on domain logic, and `docs/` updated.

---

## 31. Technical Risks & Mitigations

```text
┌──────────────────────────────┬──────────────────────────────┬────────────────────────────────────────────────────────┐
│ Identified Risk              │ Severity                     │ Architectural Mitigation Strategy                      │
├──────────────────────────────┼──────────────────────────────┼────────────────────────────────────────────────────────┤
│ Financial Hallucinations     │ CRITICAL                     │ Math strictly in SQL; LLM constrained by fact envelope │
│ Database Vector Bloat        │ MEDIUM                       │ Compact 768d vectors, HNSW index, async indexing queue │
│ Statement Format Drift       │ MEDIUM                       │ Community template configs + candidate review staging  │
│ Cloud AI Provider Outages    │ LOW                          │ Multi-provider abstraction + Local Ollama fallback     │
│ Ingestion Duplicates         │ HIGH                         │ Multi-factor deduplication (Hash + Fuzzy date window)  │
│ Tenant Data Bleed            │ CRITICAL                     │ Mandatory `WHERE userId = $userId` in SQL and vectors  │
└──────────────────────────────┴──────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 32. Long-Term Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           CLIENT EXPERIENCES                                           │
│       Web SPA (React 19)       │       Mobile PWA (Workbox)       │    Native App (React Native)       │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │
                                                    ▼ HTTPS / TLS 1.3 / SSE Streaming
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       API GATEWAY & SECURITY LAYER                                     │
│               Rate Limiting · JWT Authentication · CORS Whitelist · Sanitized Logging                  │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        FINANCE ONE CORE ENGINE                                         │
│                                                                                                        │
│   ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐                  │
│   │   Ingestion Service    │  │  Canonical Ledger      │  │  Budget Engine         │                  │
│   │   • CSV/Excel Parser   │  │  • Transaction CRUD    │  │  • Monthly/Weekly      │                  │
│   │   • PDF Table Parser   │  │  • Tagging & Filters   │  │  • Overlap Guard       │                  │
│   │   • OCR Vision Pipeline│  │  • Category Mapping    │  │  • Utilization Alerts  │                  │
│   │   • Candidate Staging  │  │  • Audit Provenance    │  │  • Lock Controls       │                  │
│   └───────────┬────────────┘  └───────────┬────────────┘  └───────────┬────────────┘                  │
│               │                           │                           │                               │
│               └───────────────────────────┼───────────────────────────┘                               │
│                                           │                                                           │
│                                           ▼                                                           │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                  FINANCIAL INTELLIGENCE SYSTEM                                 │  │
│   │                                                                                                │  │
│   │   ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────────────────┐   │  │
│   │   │  Skill Router         │  │  Intent Extractor     │  │  Hybrid Fact Retriever           │   │  │
│   │   │  • pgvector Cosine    │  │  • Zod JSON Validator │  │  • Structured SQL Aggregator     │   │  │
│   │   │  • Confidence Filter  │  │  • Date Resolver      │  │  • Semantic Vector Context Search│   │  │
│   │   └───────────────────────┘  └───────────────────────┘  └──────────────────────────────────┘   │  │
│   │                                                                                                │  │
│   │   ┌────────────────────────────────────────────────────────────────────────────────────────┐   │  │
│   │   │                                  Grounded Copilot Engine                               │   │  │
│   │   │     PromptBuilder (Fact Envelope) ──► Reasoning Adapter (Gemini / Ollama / OpenAI)     │   │  │
│   │   └────────────────────────────────────────────────────────────────────────────────────────┘   │  │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       PERSISTENCE & STORAGE LAYER                                      │
│                                                                                                        │
│   ┌────────────────────────────────────────────────────┐  ┌────────────────────────────────────────┐   │
│   │            PostgreSQL Relational Storage           │  │            pgvector Vector Store       │   │
│   │  User · Transaction · Budget · Document · Insight  │  │  SkillEmbedding · FinancialEmbedding   │   │
│   └────────────────────────────────────────────────────┘  └────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 33. Final Engineering Principles

1. **Precision Over Cleverness**: An assistant that gives a clear, 100% correct table of 5 transactions is infinitely more valuable than an assistant that writes poetic paragraphs with hallucinated totals.
2. **No Broken Windows**: Every new ingestion source, skill, or provider must pass strict automated validation before merging to `main`.
3. **User in the Loop**: Automation proposes; the user approves. Financial control remains in the hands of the human owner.
4. **Clean Code, Clean Commits**: Features are built, verified, and committed in atomic, meaningful milestones following the repository Git discipline.

---

## 34. The North Star

```text
Finance One
    │
    ├── Ingestion
    │     ├── Manual (Quick Add & Validated Modal)
    │     ├── Bank Statements (CSV, Excel, PDF Table Extraction)
    │     ├── OCR (Receipt & Invoice Visual Scanner)
    │     └── Future Automatic Sources (Edge Mobile Adapters)
    │
    ├── Financial Knowledge
    │     ├── PostgreSQL (Authoritative Relational Truth)
    │     ├── Financial Embeddings (pgvector Semantic Association)
    │     └── Historical Context (Documents & Recurring Graph)
    │
    ├── Intelligence
    │     ├── Skill Retrieval (pgvector Capability Matching)
    │     ├── Intent Extraction (Structured JSON Parameter Parsing)
    │     ├── SQL Aggregation (Zero-Variance Mathematical Engine)
    │     ├── Hybrid RAG (Verified Fact Context Construction)
    │     └── Reasoning (Provider-Agnostic LLM Engine)
    │
    └── Financial Copilot
          ├── Understand (Natural language query exploration)
          ├── Explain (Grounded financial narrative summaries)
          ├── Compare (Time-series spending & category shifts)
          ├── Detect (Anomalies, price hikes, duplicate debits)
          ├── Forecast (Cashflow trajectory & balance predictions)
          └── Assist (Proactive budgeting & affordability checks)
```

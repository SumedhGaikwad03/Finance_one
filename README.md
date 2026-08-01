# Finance_one

**Status: in development.** This is a build-in-progress, not a finished product — this README is the plan I'm building against.

An AI-powered personal finance tracker, built backend-first. The goal is a system with a correct, well-modeled financial data layer before any AI features get layered on top of it.

---

## Why backend-first

Most personal finance tools lead with the UI and retrofit the data model later. Financial data doesn't forgive that — transactions need to stay consistent, categorization needs to be auditable, and a schema change six months in is expensive. So the plan here is the reverse: get the ledger, the data model, and the API right first. The AI features come after, sitting on top of a foundation that already works.

## What it will do

- **Track income and expenses** with a data model that stays consistent under real usage, not just in a demo.
- **Categorize and report on spending** through a clean API layer, independent of whatever frontend eventually consumes it.
- **Surface AI-powered insights** — spending patterns, anomaly detection, basic forecasting — once the core ledger is solid enough to trust.

The scope beyond that is intentionally open. This is being built as a monorepo so it can grow into more than a single app if it needs to, without a rewrite.

## Current focus

Right now, work is concentrated on `apps/server` — the core backend and data model. Nothing user-facing exists yet, and that's deliberate.

## Planned architecture

```
apps/
├── server/     # core backend: API, data model, ledger logic (in progress)
├── web/        # frontend client (planned)
└── ai/         # AI/insights service (planned)
```

- **Ledger service** — the source of truth for transactions and balances, designed around transactional integrity first.
- **Reporting layer** — a read-optimized layer for spending summaries and categorization, kept separate from the ledger so reporting queries never risk the core data's consistency.
- **AI layer (later)** — planned as an additive service that reads from the reporting layer rather than being baked into the core, so the backend works correctly with or without it.

## Tech stack

| Layer | Technology |
|---|---|
| Monorepo tooling | pnpm workspaces |
| Backend | Node.js |
| Database | PostgreSQL (planned) |
| Caching / jobs | Redis (planned) |
| AI / insights | Python or Node-based inference service (undecided) |

## Roadmap

- [ ] Core ledger data model (accounts, transactions, categories)
- [ ] Transaction API with validation and consistency guarantees
- [ ] Reporting layer for spending summaries
- [ ] Basic web client
- [ ] AI-powered spending insights
- [ ] Forecasting based on historical transaction data

This list will change as the project takes shape — it's a plan, not a promise.

---

Built by [Sumedh Gaikwad](https://github.com/SumedhGaikwad03) — [Portfolio](https://sumedh-portfolio-cyan.vercel.app/)

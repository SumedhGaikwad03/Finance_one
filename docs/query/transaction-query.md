# TransactionQuery Architecture & Domain Contract

`TransactionQuery` is the canonical domain contract defining structured search, filtering, and pagination across the transaction ledger.

---

## 1. Architectural Model & Convergence

```text
┌──────────────────────┐
│   UI Query Builder   │
└──────────┬───────────┘
           │
           │ (Produces canonical TransactionQuery)
           ▼
   TransactionQuery ◄──────────────────────── Future AI Intent Parser
           │                                  (Translates NL to TransactionQuery)
           │
           ▼
    Query Validation
(transactionQueryInputSchema)
           │
           ▼
   Transaction Service
(queryTransactions(userId, query))
           │
           ▼
  Transaction Repository
(findTransactions(userId, query))
           │
           ▼
  Prisma 7 / PostgreSQL 18
```

### Key Architectural Principle
> The Transaction Service does not care whether a `TransactionQuery` originated from the UI Query Builder, an AI Intent Parser, voice input, or another future integration.

---

## 2. Canonical Domain Interface

```typescript
import { Category, Priority } from "../generated/prisma/enums";

export type SortField = "transactionDate" | "amount" | "createdAt";
export type SortDirection = "asc" | "desc";

export interface TransactionQuery {
    /** Categories to filter by (OR condition across multiple categories) */
    categories?: Category[];

    /** Priorities to filter by (OR condition across multiple priorities) */
    priorities?: Priority[];

    /** Inclusive lower bound date */
    startDate?: Date;

    /** Inclusive upper bound date */
    endDate?: Date;

    /** Inclusive minimum amount */
    minAmount?: number;

    /** Inclusive maximum amount */
    maxAmount?: number;

    /** Case-insensitive substring search across title and notes */
    search?: string;

    /** Maximum records to return (Default: 50, Max: 100) */
    limit?: number;

    /** Number of records to skip for pagination (Default: 0) */
    offset?: number;

    /** Field to sort by (Default: "transactionDate") */
    sortBy?: SortField;

    /** Sort direction (Default: "desc") */
    sortDirection?: SortDirection;
}
```

---

## 3. Security Boundary

- **Client/Caller Query**: `TransactionQuery` deliberately **never contains `userId`**.
- **Enforcement**: The authenticated user ID is obtained solely from the verified JWT payload (`req.user.userId` via `authMiddleware`).
- **Signature**:
  ```typescript
  queryTransactions(userId: number, query: TransactionQuery): Promise<Transaction[]>
  ```
  The caller can never query, inspect, or enumerate transactions belonging to other users.

---

## 4. Query Validation & Parsing (Zod)

`transactionQueryInputSchema` validates raw query inputs, coercing query-string parameters and enforcing logical invariants:

- `minAmount >= 0`, `maxAmount >= 0`, and `minAmount <= maxAmount`
- `startDate <= endDate`
- `limit >= 1` and `limit <= 100` (default: 50)
- `offset >= 0` (default: 0)
- `sortBy` $\in \{$ `"transactionDate"`, `"amount"`, `"createdAt"` $\}$ (default: `"transactionDate"`)
- `sortDirection` $\in \{$ `"asc"`, `"desc"` $\}$ (default: `"desc"`)

---

## 5. Future Producers Convergence Point

1. **Gamified UI Query Builder**:
   - Converts visual interactive filters (chips, sliders, calendars) directly into `TransactionQueryParams`.
   - Dispatches via `transactionService.queryTransactions(params)`.
2. **AI Intent Parser**:
   - Classifies natural language prompts (e.g. *"Show me last month's luxury groceries"*).
   - Extracts date ranges, amounts, categories, and priorities.
   - Converts them into the identical `TransactionQuery` domain object.
   - Calls the exact same `transactionService.queryTransactions(userId, query)`.

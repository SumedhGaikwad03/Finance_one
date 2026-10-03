# Product MVP Definition

Finance One MVP provides core personal finance management and a structured query experience.

---

## 1. Implemented MVP Capabilities

### User & Authentication
- User registration with bcrypt password hashing.
- JWT-based login and authenticated session management.

### Transactions
- Create, view, edit, and delete transactions.
- Categorization across 11 standard financial categories.
- Priority classification (`ESSENTIAL`, `GOOD_TO_HAVE`, `LUXURY`) with neutral styling.
- Date tracking and notes.

### Budgets
- Create, view, edit, and delete budgets across Weekly, Monthly, and Quarterly periods.
- Overlap prevention algorithm.
- Budget locking mechanism to prevent accidental modifications.

### Dashboard
- Aggregated financial overview (Total budget, Total spent, Remaining budget, Budget usage).
- Visual charts: Category breakdown, Priority breakdown, Budget vs Spending gauge.
- Recent transaction history.

---

## 2. Next MVP Phase: The Query Experience

1. **Gamified UI Query Builder**: Step-by-step query creator generating a `TransactionQuery` DTO.
2. **Unified Backend Query Engine**: Common `TransactionQueryService` executing aggregations (`SUM`, `COUNT`, `AVERAGE`, `MAX`, `MIN`, `FIND`).
3. **AI Explanation & NLP Extraction**: Optional natural-language intent extractor feeding into the same query engine and explaining results cleanly.

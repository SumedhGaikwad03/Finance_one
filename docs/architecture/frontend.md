# Frontend Architecture

Finance One's web client is located at [`apps/web`](file:///c:/Users/777su/Desktop/Finance_one/apps/web) and operates as a single-page Progressive Web App (PWA).

---

## 1. Structure and Component Hierarchy

```text
apps/web/src/
├── api/
│   ├── axios.ts           # Axios instance with request/auth interceptor
│   └── endpoints.ts       # Centralized REST route definitions
├── components/
│   ├── budgets/           # BudgetCard component & styles
│   ├── common/            # ProtectedRoute wrapper
│   ├── dashboard/         # StatCard, StatsSection, ChartsSection, RecentTransactions
│   ├── forms/             # CreateTransactionForm, CreateBudgetForm, EditBudgetForm
│   ├── transaction/       # TransactionCard component & styles
│   └── ui/                # Shared base UI primitives
├── pages/
│   ├── Login/             # Authentication login page
│   ├── Register/          # User registration page
│   ├── Dashboard/         # Aggregated financial overview & visualizations
│   ├── Transactions/      # Transaction CRUD list & form management
│   ├── Budgets/           # Budget list, creation, editing, & locking
│   └── NotFound/          # 404 handler
├── routes/
│   └── index.tsx          # React Router route tree definitions
├── services/
│   ├── auth.service.ts    # Login, register, profile calls
│   ├── transaction.service.ts # Transaction CRUD requests
│   ├── budget.service.ts  # Budget CRUD requests
│   └── dashboard.service.ts # Aggregated dashboard metric fetch
├── types/                 # Frontend TypeScript interfaces & DTOs
└── utils/                 # Zod validation schemas for forms
```

---

## 2. State & Data Fetching (TanStack Query)

Server state is managed entirely through `@tanstack/react-query`. Client React components do not duplicate server state into local `useState` buckets.

### Key Query Keys
- `["transactions"]`: List of user transactions.
- `["budgets"]`: List of user budgets.
- `["budgets", "active"]`: Currently active budget.
- `["dashboard"]`: Aggregated dashboard metrics.

### Mutation Invalidation Policy
Any mutation that alters financial state invalidates dependent queries immediately:
- **Transaction Mutation** (Create / Update / Delete):
  ```typescript
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  ```
- **Budget Mutation** (Create / Update / Delete / Lock):
  ```typescript
  queryClient.invalidateQueries({ queryKey: ["budgets"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  ```

---

## 3. Form & Validation Strategy

Forms utilize **React Hook Form** coupled with **Zod** schemas via `@hookform/resolvers/zod`:
- **Schemas**: Located in `src/utils/` (e.g., [`transaction.schema.ts`](file:///c:/Users/777su/Desktop/Finance_one/apps/web/src/utils/transaction.schema.ts)).
- **Responsibility**: Forms handle field inputs, validation errors, and packaging structured data.
- **Submission**: Forms trigger parent page mutation handlers rather than making API requests directly inside reusable form components.

---

## 4. Visual Philosophy: Priority & Categories

1. **Transaction Categories**: Standardized enums (`FOOD`, `FUEL`, `SHOPPING`, `BILLS`, `ENTERTAINMENT`, `HEALTH`, `TRAVEL`, `EDUCATION`, `SUBSCRIPTION`, `GIFT`, `OTHER`).
2. **Spending Priority**:
   - Values: `ESSENTIAL`, `GOOD_TO_HAVE`, `LUXURY`.
   - **Neutral Treatment**: Avoid moralizing color schemes (e.g., do not style `ESSENTIAL` green and `LUXURY` red). The UI uses neutral tones (teals, blues, purples) to present spending preferences objectively.

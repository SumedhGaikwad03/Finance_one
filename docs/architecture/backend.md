# Backend Architecture

The Finance One backend service is located at [`apps/server`](file:///c:/Users/777su/Desktop/Finance_one/apps/server) and built with **Node.js**, **Express**, **TypeScript**, and **Prisma ORM**.

---

## 1. Layered Architecture

The backend strictly separates transport, validation, domain logic, and data access:

```text
HTTP Request
     │
     ▼
[ Route ]           (apps/server/src/routes/)
     │
     ▼
[ Middleware ]      (apps/server/src/middleware/auth.middleware.ts)
     │
     ▼
[ Controller ]      (apps/server/src/controllers/)
     │
     ▼
[ Schema Validation ] (apps/server/src/schemas/ - Zod)
     │
     ▼
[ Service Layer ]   (apps/server/src/services/ - Business Rules)
     │
     ▼
[ Repository ]      (apps/server/src/repositories/ - Database Access)
     │
     ▼
[ Prisma Client ]   (apps/server/src/generated/prisma/)
     │
     ▼
[ PostgreSQL ]
```

---

## 2. Layer Responsibilities

### Routes
- Define HTTP endpoints and mount middleware.
- Wrap controller invocations with `asyncHandler` to safely forward rejected promises to the global error middleware.

### Middleware
- **`authMiddleware`**: Verifies JWT from the `Authorization: Bearer <token>` header, decodes payload, and attaches `req.user = { userId, email }`. Rejects unauthenticated requests with `401 Unauthorized`.
- **`errorMiddleware`**: Catches errors, maps known application errors (`AppError`, `TransactionNotFoundError`, `BudgetNotFoundError`, `BudgetLockedError`) to HTTP status codes, and sanitizes production error messages.

### Controllers
- Extract parameters from `req.body`, `req.params`, and `req.query`.
- Trigger Zod runtime validation.
- Pass validated DTOs and `req.user.userId` to the service layer.
- Format and send HTTP responses (`200 OK`, `201 Created`, `204 No Content`).

### Services
- House core business rules, domain invariants, ownership verifications, and financial calculations.
- Reject invalid operations (e.g., updating locked budgets or accessing transactions belonging to another user).
- Independent of HTTP transport details (`req`, `res`).

### Repositories
- Isolate all Prisma ORM queries.
- Do not contain business logic or HTTP concepts.

---

## 3. Endpoints Matrix

| Domain | Route | Method | Protected | Handler | Status |
|---|---|---|---|---|---|
| Health | `/health` | `GET` | No | `getHealth` | Implemented |
| Auth | `/api/auth/register` | `POST` | No | `register` | Implemented |
| Auth | `/api/auth/login` | `POST` | No | `login` | Implemented |
| Auth | `/api/auth/me` | `GET` | Yes | `me` | Implemented |
| Users | `/api/users/` | `GET` | Yes | `getUsers` | Implemented |
| Users | `/api/users/:id` | `GET` | Yes | `finduser` | Implemented |
| Users | `/api/users/:id` | `PATCH` | Yes | `updateUserdata` | Implemented |
| Transactions | `/api/transactions/` | `POST` | Yes | `createTransaction` | Implemented |
| Transactions | `/api/transactions/getMyTransactions` | `GET` | Yes | `getMyTransactions` | Implemented |
| Transactions | `/api/transactions/:id` | `PATCH` | Yes | `updateTransaction` | Implemented |
| Transactions | `/api/transactions/:id` | `DELETE` | Yes | `deleteTransaction` | Implemented |
| Budgets | `/api/budgets/` | `POST` | Yes | `createBudget` | Implemented |
| Budgets | `/api/budgets/` | `GET` | Yes | `getMyBudgets` | Implemented |
| Budgets | `/api/budgets/active` | `GET` | Yes | `getActiveBudget` | Implemented |
| Budgets | `/api/budgets/:id` | `PATCH` | Yes | `updateBudget` | Implemented |
| Budgets | `/api/budgets/:id` | `DELETE` | Yes | `deleteBudget` | Implemented |
| Budgets | `/api/budgets/:id/lock` | `PATCH` | Yes | `lockBudget` | Implemented |
| Dashboard | `/api/dashboard/` | `GET` | Yes | `getDashboard` | Implemented |
| Query (Planned) | `/api/transactions/query` | `POST` | Yes | `queryTransactions` | Planned |

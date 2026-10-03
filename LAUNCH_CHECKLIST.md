# Finance One — MVP 1 Launch Checklist & Production Runbook

**Product Version:** MVP 1 — Early Beta  
**Target Release:** Production Candidate 1.0.0  
**Verification Date:** March 2026  

---

## 1. Production Launch Checklist

### Product & Features
- [x] **Landing Page (`/`)**: Public entry point communicating Early Beta / MVP 1, core capabilities, and AI & Privacy principles.
- [x] **Registration (`/register`)**: Strong password validation (min 8 chars), bcrypt password hashing, duplicate email conflict protection.
- [x] **Login (`/login`)**: Secure JWT generation (10h expiration), sanitized error responses without user enumeration.
- [x] **Dashboard (`/dashboard`)**: Active budget metrics, monthly spent gauges, recent ledger log, quick category distribution.
- [x] **Transactions (`/transactions`)**: CRUD operations, date/category/priority filtering, Quick Transaction natural parser with fallback overrides.
- [x] **Budgets (`/budgets`)**: Category budget creation, period overlap validation, budget lock toggle, live progress tracking.
- [x] **Query Explorer**: Deterministic spending breakdown builder ("Where did I spend?") with category, time period, and visual chart controls.
- [x] **Account Settings (`/settings`)**: Profile name updates, password change flow with current password verification.

### Authentication & Security
- [x] **Passwords Hashed**: bcrypt salted hashes (cost factor 10); plaintext passwords never stored.
- [x] **JWT Token Handling**: Signed with `JWT_SECRET` via environment variables; verified on every protected request.
- [x] **Zero Sensitive Logging**: Sanitized server logs. Passwords, authorization tokens, and credentials are never printed.
- [x] **Strict Data Isolation**: `userId` is strictly extracted from verified JWT tokens on the server; clients cannot query or modify another user's financial records by tampering with request IDs.
- [x] **Protected Routes**: React router `ProtectedRoute` guards authenticated routes; `GuestRoute` prevents re-authenticating over existing sessions.
- [x] **Automatic 401 Interception**: Expired or invalid tokens clear local session storage and redirect to login (excluding public landing pages).

### Database & Migrations
- [x] **PostgreSQL Schema**: Clean relational schema with `User`, `Transaction`, `Budget`, and `SkillEmbedding` tables.
- [x] **Prisma Migration History**: 9 sequential migrations verified and synchronized (`pnpm --filter server exec prisma migrate status`).
- [x] **Production Migration Mechanism**: Automated using `pnpm --filter server exec prisma migrate deploy`.
- [x] **Connection Pooling**: Uses `@prisma/adapter-pg` and `pg.Pool` for connection reuse.
- [x] **Graceful Teardown**: Server traps `SIGTERM` / `SIGINT` and cleanly disconnects Prisma ORM connections before process termination.

### Backend Infrastructure
- [x] **Environment Variables**: Managed via `.env.example` templates; `.env` strictly ignored by `.gitignore`.
- [x] **Health Check Endpoint (`GET /health`)**: Returns JSON health status, process uptime, and actively probes database connectivity with `SELECT 1`.
- [x] **CORS Configuration**: Supports dynamic whitelist from `CLIENT_URL` / `FRONTEND_URL` / `CORS_ORIGIN` with credentials enabled.
- [x] **Error Handling**: Centralized `errorMiddleware` formats Zod validation errors (400), AppErrors (401/404/409), and returns generic 500 without leaking stack traces.

### Frontend Production Build
- [x] **Build Validation**: TypeScript typechecking (`tsc -b`) and Vite production bundler pass with zero errors.
- [x] **API Base URL Resolution**: Resolves dynamically from `VITE_API_URL` or defaults to origin in production.
- [x] **Mobile Responsiveness**: Verified across 320px, 375px, 390px, 414px, and 430px viewports without horizontal overflow.
- [x] **PWA Configuration**: Service worker generation enabled without experimental or blocking offline interceptors.

---

## 2. Environment Configuration Reference

### Backend (`apps/server/.env`)

```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public&sslmode=require
JWT_SECRET=generate_a_64_character_crypto_random_secret_here
CLIENT_URL=https://financeone.app,https://www.financeone.app
```

### Frontend (`apps/web/.env`)

```env
VITE_API_URL=https://api.financeone.app
```

---

## 3. Production Deployment Runbook

```text
1. Database Setup
   ├── Provision Managed PostgreSQL (Supabase, Neon, AWS RDS, Railway, Render)
   └── Acquire SSL-enabled connection string

2. Backend Deployment
   ├── Clone Repository
   ├── Configure Environment Variables (DATABASE_URL, JWT_SECRET, CLIENT_URL, PORT)
   ├── Install Dependencies: pnpm install --frozen-lockfile
   ├── Apply Migrations: pnpm --filter server exec prisma migrate deploy
   ├── Build Server: pnpm --filter server build
   └── Start Service: pnpm --filter server start (or node apps/server/dist/index.js)

3. Frontend Deployment (Vercel, Cloudflare Pages, Netlify)
   ├── Configure Build Command: pnpm --filter web build
   ├── Configure Output Directory: apps/web/dist
   └── Set Environment Variable: VITE_API_URL=https://api.yourdomain.com

4. Verification
   ├── Check Health: curl https://api.yourdomain.com/health
   └── Perform Smoke Test via Web Browser
```

---

## 4. Database Backup & Disaster Recovery Strategy

For MVP 1 production:

1. **Automated Point-in-Time Backups (PITR)**:
   - Enable daily automated snapshots and 7-day PITR on the managed PostgreSQL provider (e.g. AWS RDS / Neon / Supabase).
2. **Pre-Migration Manual Backup**:
   - Before applying schema migrations in production, take a logical snapshot:
     ```bash
     pg_dump -h <HOST> -U <USER> -d finance_one -F c -b -v -f "finance_one_backup_$(date +%Y%m%d_%H%M%S).dump"
     ```
3. **Recovery Path**:
   - In case of catastrophic rollback:
     ```bash
     pg_restore -h <HOST> -U <USER> -d finance_one -v -c "finance_one_backup_TIMESTAMP.dump"
     ```

---

## 5. Verification Commands

```bash
# 1. Run all backend unit & security integration tests
pnpm --filter server test

# 2. Check Prisma schema migration sync
pnpm --filter server exec prisma migrate status

# 3. Compile backend TypeScript bundle
pnpm --filter server build

# 4. Compile frontend web production bundle
pnpm --filter web build
```

# Finance One — Manual Ingestion Acceptance Testing Guide

This document provides step-by-step instructions for executing manual end-to-end acceptance testing of the complete Finance One transaction ingestion pipeline: **Manual Entry**, **CSV Bank Statements**, **XLSX Spreadsheets**, and **Text-Based PDF Statements**.

All instructions and commands use exact scripts, routes, and environment variables discovered directly from the repository.

---

## 1. Environment Prerequisites

- **Node.js**: v20.x or v22.x (`node -v` $\ge$ 20.0.0, tested on v22.13.1)
- **Package Manager**: pnpm v10.x (`pnpm -v` $\ge$ 10.13.0)
- **PostgreSQL**: PostgreSQL 14+ running locally on port 5432
- **Web Browser**: Google Chrome or any modern Chromium/Firefox browser

---

## 2. Dedicated Test Database Configuration

To guarantee that manual testing never affects production data or existing ledgers, run acceptance testing on a dedicated test database (e.g. `finance_one_test`).

### Step A: Create Test Database
In PowerShell or terminal:
```bash
# Connect to PostgreSQL and create a clean test database
psql -U postgres -c "CREATE DATABASE finance_one_test;"
```

### Step B: Configure Server Environment
In `apps/server/.env`, set the `DATABASE_URL` to point to the dedicated test database:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finance_one_test?schema=public"
JWT_SECRET="finance_one_test_secret_key_minimum_32_characters_long"
CLIENT_URL="http://localhost:5173"
```
*(Adjust the database credentials `postgres:postgres` to match your local PostgreSQL credentials).*

### Step C: Apply Database Migrations
Deploy the Prisma schema and run all migrations against the test database:
```bash
# In apps/server
cd apps/server
npx prisma migrate deploy
npx prisma generate
```

### Step D: Configure Web Frontend Environment
Verify `apps/web/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

---

## 3. Starting the Applications

Open two terminal windows:

### Terminal 1: Backend Server
```bash
# From workspace root
pnpm --filter server dev
```
- **Expected Output**:
  ```text
  🚀 Finance One server running on port 3000
  ```
- **Health Check**: Visit `http://localhost:3000/health` in your browser. Expected response:
  ```json
  {"status":"UP","timestamp":"...","environment":"development"}
  ```

### Terminal 2: Web Frontend
```bash
# From workspace root
pnpm --filter web dev
```
- **Expected Output**:
  ```text
  VITE v8.2.0 ready in ... ms
  ➜  Local:   http://localhost:5173/
  ```

---

## 4. Test User Setup & Navigation

1. Navigate to: `http://localhost:5173/register`
2. Register a new test account:
   - **Name**: `Acceptance Tester`
   - **Email**: `tester@financeone.local`
   - **Password**: `Password123!`
3. You will be redirected to `http://localhost:5173/dashboard`.
4. In the top navigation bar, click **Transactions** to navigate to `http://localhost:5173/transactions`.

---

## 5. Synthetic Fixture Preparation

Prepare the following synthetic test fixtures on your machine:

### Fixture A: `statement_reconciliation.csv`
Create a file named `statement_reconciliation.csv` with the following content:
```csv
Date,Narration,Ref,Debit,Credit,Balance
2026-10-01,Opening Balance,,,2500.00,2500.00
2026-10-02,Fresh Basket groceries,TXN_CSV_001,850.00,,1650.00
2026-10-03,Metro travel pass,TXN_CSV_002,200.00,,1450.00
2026-10-04,Salary credit,TXN_CSV_003,,50000.00,51450.00
2026-10-05,Electricity utility bill,TXN_CSV_004,849.00,,50601.00
2026-10-06,Coffee House,TXN_CSV_005,180.00,,50421.00
```

### Fixture B: `statement_reconciliation.xlsx`
Open Excel, Google Sheets, or LibreOffice, paste the table above, and save it as `statement_reconciliation.xlsx`. Ensure the sheet name is `Sheet1` or `Expenses`.

### Fixture C: `statement_reconciliation.pdf` (Text-Based PDF)
Generate a text-layer PDF fixture using the repository's bundled `pdf-lib` by running this single command in `apps/server`:
```bash
npx tsx -e "
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function makePdf() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([650, 450]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  page.drawText('GLOBAL BANK STATEMENT', { x: 50, y: 400, size: 14, font: bold });
  page.drawText('Account: 1029384756 | Period: Oct 2026', { x: 50, y: 380, size: 9, font });

  const yH = 340;
  page.drawText('Date', { x: 50, y: yH, size: 10, font: bold });
  page.drawText('Narration', { x: 130, y: yH, size: 10, font: bold });
  page.drawText('Ref', { x: 340, y: yH, size: 10, font: bold });
  page.drawText('Debit', { x: 420, y: yH, size: 10, font: bold });
  page.drawText('Credit', { x: 490, y: yH, size: 10, font: bold });
  page.drawText('Balance', { x: 560, y: yH, size: 10, font: bold });

  const rows = [
    ['2026-10-01', 'Opening Balance', '', '', '2500.00', '2500.00'],
    ['2026-10-02', 'Fresh Basket groceries', 'TXN_PDF_001', '850.00', '', '1650.00'],
    ['2026-10-03', 'Metro travel pass', 'TXN_PDF_002', '200.00', '', '1450.00'],
    ['2026-10-04', 'Salary credit', 'TXN_PDF_003', '', '50000.00', '51450.00'],
    ['2026-10-05', 'Electricity utility bill', 'TXN_PDF_004', '849.00', '', '50601.00'],
    ['2026-10-06', 'Coffee House', 'TXN_PDF_005', '180.00', '', '50421.00'],
  ];

  let y = 310;
  for (const r of rows) {
    page.drawText(r[0], { x: 50, y, size: 9, font });
    page.drawText(r[1], { x: 130, y, size: 9, font });
    page.drawText(r[2], { x: 340, y, size: 9, font });
    page.drawText(r[3], { x: 420, y, size: 9, font });
    page.drawText(r[4], { x: 490, y, size: 9, font });
    page.drawText(r[5], { x: 560, y, size: 9, font });
    y -= 25;
  }

  const bytes = await doc.save();
  fs.writeFileSync('statement_reconciliation.pdf', Buffer.from(bytes));
  console.log('Created statement_reconciliation.pdf');
}
makePdf();
"
```

---

## 6. Acceptance Test Suite Execution

### Test 1: Manual Transaction Entry (Phase 1 Baseline)
1. Navigate to `/transactions`.
2. Click the **"Add Transaction"** button.
3. Fill in the form:
   - **Amount**: `450.00`
   - **Title**: `Weekly Organic Produce`
   - **Category**: `FOOD`
   - **Priority**: `ESSENTIAL`
   - **Date**: Select today's date
4. Click **"Save Transaction"**.
5. **Expected Results**:
   - Modal closes with toast *"Transaction recorded successfully."*
   - Ledger updates immediately showing `Weekly Organic Produce`, `₹450.00`, category badge `FOOD`, priority badge `ESSENTIAL`, and source badge `MANUAL`.
   - Navigate to `/dashboard`: KPI card "Total Spend" reflects `₹450.00`.

---

### Test 2: CSV Bank Statement Import Workflow
1. Navigate to `/transactions`.
2. Click **"Import Statement"**.
3. **Step 1: Upload**:
   - Drag and drop or browse to select `statement_reconciliation.csv`.
   - Verify file metadata: Format `CSV`, row count `6`.
4. **Step 2: Column Mapping**:
   - Verify auto-mapping:
     - `Date` $\rightarrow$ Date Column
     - `Narration` $\rightarrow$ Description Column
     - Amount Mode $\rightarrow$ Debit / Credit Separate Columns
     - `Debit` $\rightarrow$ Debit Column
     - `Credit` $\rightarrow$ Credit Column
     - `Ref` $\rightarrow$ Reference / External ID
     - `Balance` $\rightarrow$ Unmapped (verify `Balance` is NOT mapped as Debit or Amount)
5. Click **"Review Preview"**.
6. **Step 3: Preview Verification**:
   - **Total Rows**: 6
   - **Ready to Import**: 4 debits
   - **Excluded (Non-Expense)**: 2 rows
     - `Opening Balance` is flagged `EXCLUDED_NON_EXPENSE` (reason: balance row)
     - `Salary credit` is flagged `EXCLUDED_NON_EXPENSE` (reason: credit/deposit)
   - **Expected Total Expense**: **₹2,079.00**
7. **Cancellation Test**:
   - Click the "Cancel" or "Close" button.
   - Verify modal closes.
   - Verify ledger has NOT changed (still only ₹450 from Test 1).
8. **Confirmation & Commit**:
   - Re-open "Import Statement", select `statement_reconciliation.csv`, proceed to preview, and click **"Confirm & Import"**.
   - Verify Step 4 Summary: *"Imported 4 expenses successfully. Excluded 2 non-expense entries."*
   - Close modal.
9. **Ledger & Dashboard Verification**:
   - `/transactions` shows 4 new rows tagged with source `CSV_IMPORT`.
   - `/dashboard`: Total Spend is now ₹450.00 + ₹2,079.00 = **₹2,529.00**.

---

### Test 3: Re-Import Idempotency Check (CSV)
1. On `/transactions`, click **"Import Statement"** again.
2. Select the identical `statement_reconciliation.csv`.
3. Proceed to preview.
4. **Expected Preview Results**:
   - **Ready to Import**: `0`
   - **Already in Ledger (Confirmed Duplicates)**: `4` (all 4 debits matched by external ID `TXN_CSV_...`)
   - **Excluded Non-Expenses**: `2`
   - **Expected Total Expense**: `₹0.00`
5. Click **"Confirm & Import"**.
6. **Expected Results**:
   - Summary: *"Imported 0 expenses."*
   - Ledger total on `/dashboard` remains strictly **₹2,529.00** (zero ledger inflation).

---

### Test 4: XLSX Spreadsheet Import Workflow
1. Click **"Import Statement"**.
2. Upload `statement_reconciliation.xlsx`.
3. Verify worksheet detection (`Sheet1` or `Expenses`).
4. Proceed through mapping and preview.
5. Verify 4 rows ready to import, 2 excluded rows.
6. Click **"Confirm & Import"**.
7. Verify imported transactions receive source `BANK_STATEMENT`.

---

### Test 5: Text-Based PDF Statement Import Workflow
1. Click **"Import Statement"**.
2. Upload `statement_reconciliation.pdf`.
3. Verify file detection badge displays `PDF`, size $\le$ 5MB.
4. Step 2 auto-mapping:
   - Verify coordinate parser mapped `Date`, `Narration`, `Debit`, `Credit`, and `Ref`.
   - Verify `Balance` column is unmapped.
5. Step 3 preview:
   - 4 debits marked `READY` (Total: ₹2,079.00).
   - 1 `Salary credit` marked `EXCLUDED_NON_EXPENSE`.
   - 1 `Opening Balance` marked `EXCLUDED_NON_EXPENSE`.
6. Click **"Confirm & Import"**.
7. Verify transactions in database have `source: "BANK_STATEMENT"`.
8. Re-upload `statement_reconciliation.pdf` and verify 0 rows imported on re-run.

---

### Test 6: User-Confirmed Classification Persistence
1. In `/transactions`, find the imported transaction for `Fresh Basket groceries` (Amount ₹850.00).
2. Click the Edit button (pencil icon).
3. Change its category from `FOOD` to `SHOPPING`, and its priority from `GOOD_TO_HAVE` to `ESSENTIAL`.
4. Click **"Save Changes"**.
5. Now re-import `statement_reconciliation.csv`.
6. **Expected Result**:
   - The row is skipped as a confirmed duplicate.
   - The user's modified category (`SHOPPING`) and priority (`ESSENTIAL`) remain intact and are NOT overwritten.

---

### Test 7: Error Safeguards & Invalid Files
Attempt uploading each of the following files and verify error handling:
1. **Empty File**: Create an empty file `empty.csv` (0 bytes).
   - **Expected Result**: Error banner: *"Uploaded file is empty"*.
2. **Scanned PDF (No Text)**: Upload an image-only PDF.
   - **Expected Result**: Error banner: *"This PDF appears to be a scanned document or contains no extractable text. Scanned PDFs requiring OCR are not supported in this version."*
3. **Corrupted File Extension**: Rename a JPEG or text file to `fake.pdf`.
   - **Expected Result**: Error banner: *"Corrupted or invalid PDF file. File content does not match .pdf format."*
4. **Unsupported Extension**: Upload a `.exe` or `.docx` file.
   - **Expected Result**: Rejected immediately in file picker and backend error: *"Unsupported file format"*.

---

### Test 8: Tenant Isolation & Multi-User Security
1. Log out of `tester@financeone.local`.
2. Register a second test user: `user2@financeone.local` / `Password123!`.
3. Navigate to `/transactions`:
   - Verify the ledger is completely empty.
   - None of User 1's transactions or imported files are visible.
4. In browser DevTools Network tab, copy the `fileId` from User 1's upload session and attempt to query `/api/transactions/import/preview` with User 2's token.
   - **Expected Result**: HTTP `403 Forbidden` (`ForbiddenError: You do not have permission to access this import session`).

---

## 7. Spending Tier Audit & Known Architectural Findings

During acceptance testing, observe the following architectural behaviors regarding **Spending Tier** (represented internally by the `Priority` enum):

1. **Separation of Category and Spending Tier**:
   - `category` (`Category` enum: `FOOD`, `BILLS`, `SHOPPING`, etc.) and `priority` (`Priority` enum: `ESSENTIAL`, `GOOD_TO_HAVE`, `LUXURY`) are separate fields in both the UI and database.
2. **Current Schema Constraint**:
   - In PostgreSQL and Prisma, `Transaction.priority` is defined as `priority Priority NOT NULL`.
   - The `Priority` enum contains: `ESSENTIAL`, `GOOD_TO_HAVE`, `LUXURY`. It does NOT contain `UNCLASSIFIED` or accept `NULL`.
3. **Defaulting Behavior on Statements**:
   - Because bank statements (CSV/XLSX/PDF) standardly do not include priority/spending tier columns, missing priorities in statement imports currently fall back to `GOOD_TO_HAVE` to satisfy the non-null database constraint.
   - In manual entry, the user selects a priority or defaults to `ESSENTIAL`.
   - Persisting an unclassified/null spending tier requires a future schema migration to add `UNCLASSIFIED` to the `Priority` enum or make the column nullable.

---

## 8. Safe Test Data Cleanup

When manual acceptance testing is complete, clean up test records using isolated, user-scoped commands that cannot affect other data:

```sql
-- Connect to the test database
-- Replace <test_user_id> with the ID of tester@financeone.local (e.g. SELECT id FROM "User" WHERE email = 'tester@financeone.local';)

BEGIN;

-- Delete only transactions belonging to the test user
DELETE FROM "Transaction" WHERE "userId" IN (
    SELECT id FROM "User" WHERE email LIKE '%@financeone.local'
);

-- Delete budgets belonging to the test user
DELETE FROM "Budget" WHERE "userId" IN (
    SELECT id FROM "User" WHERE email LIKE '%@financeone.local'
);

-- Delete test users
DELETE FROM "User" WHERE email LIKE '%@financeone.local';

COMMIT;
```

> **Warning**: Never run un-scoped commands such as `DELETE FROM "Transaction" WHERE "externalId" LIKE 'TEST%'` or delete without a `userId` predicate. Always use specific test user email filters or drop the dedicated test database entirely (`DROP DATABASE finance_one_test;`).

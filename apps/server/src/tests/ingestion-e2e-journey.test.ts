import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts } from "pdf-lib";
import app from "../app";
import prisma from "../lib/prisma";
import { Category, Priority, TransactionSource } from "../generated/prisma/enums";
import { importSessionStore } from "../import/session/import-session.store";

describe("Workstream 08: End-to-End Ingestion Validation Suite", () => {
  let server: http.Server;
  let baseUrl: string;

  // Test Users
  let userA: { id: number; email: string };
  let userB: { id: number; email: string };
  let tokenA: string;
  let tokenB: string;

  // Helper: Generates a text-based synthetic PDF bank statement
  async function generateSyntheticPdf(): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([650, 500]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header metadata
    page.drawText("SYNTHETIC TRUST BANK", { x: 50, y: 470, size: 14, font: boldFont });
    page.drawText("Account Statement: 9876543210 | Currency: INR", { x: 50, y: 450, size: 9, font });
    page.drawText("Period: 01-Oct-2026 to 15-Oct-2026", { x: 50, y: 435, size: 9, font });

    // Table Headers
    const yHeader = 400;
    page.drawText("Date", { x: 50, y: yHeader, size: 10, font: boldFont });
    page.drawText("Narration", { x: 130, y: yHeader, size: 10, font: boldFont });
    page.drawText("Ref", { x: 330, y: yHeader, size: 10, font: boldFont });
    page.drawText("Debit", { x: 410, y: yHeader, size: 10, font: boldFont });
    page.drawText("Credit", { x: 480, y: yHeader, size: 10, font: boldFont });
    page.drawText("Balance", { x: 550, y: yHeader, size: 10, font: boldFont });

    // Row 1: Valid debit
    page.drawText("2026-10-10", { x: 50, y: 370, size: 9, font });
    page.drawText("Apollo Pharmacy Medicine", { x: 130, y: 370, size: 9, font });
    page.drawText("PDF001", { x: 330, y: 370, size: 9, font });
    page.drawText("640.00", { x: 410, y: 370, size: 9, font });
    page.drawText("57774.50", { x: 550, y: 370, size: 9, font });

    // Row 2: Salary/Interest credit (non-expense)
    page.drawText("2026-10-11", { x: 50, y: 340, size: 9, font });
    page.drawText("Quarterly Interest Paid", { x: 130, y: 340, size: 9, font });
    page.drawText("PDF002", { x: 330, y: 340, size: 9, font });
    page.drawText("210.00", { x: 480, y: 340, size: 9, font });
    page.drawText("57984.50", { x: 550, y: 340, size: 9, font });

    // Row 3: Valid debit
    page.drawText("2026-10-12", { x: 50, y: 310, size: 9, font });
    page.drawText("Shell Fuel Station Petrol", { x: 130, y: 310, size: 9, font });
    page.drawText("PDF003", { x: 330, y: 310, size: 9, font });
    page.drawText("2500.00", { x: 410, y: 310, size: 9, font });
    page.drawText("55484.50", { x: 550, y: 310, size: 9, font });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // Helper: Generates a scanned/empty image-only PDF without extractable text
  async function generateScannedMockupPdf(): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 400]); // Blank page with no text streams
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // Helper: Upload file through HTTP multipart endpoint
  async function uploadStatementHttp(
    token: string,
    buffer: Buffer,
    filename: string
  ): Promise<{ status: number; body: any }> {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)]);
    formData.append("file", blob, filename);

    const res = await fetch(`${baseUrl}/api/transactions/import/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const contentType = res.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await res.json()
      : { message: await res.text() };
    return { status: res.status, body };
  }

  before(async () => {
    // Start HTTP server on ephemeral port
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    // Cleanup users and server
    if (userA?.id) {
      await prisma.transaction.deleteMany({ where: { userId: userA.id } });
      await prisma.user.delete({ where: { id: userA.id } }).catch(() => {});
    }
    if (userB?.id) {
      await prisma.transaction.deleteMany({ where: { userId: userB.id } });
      await prisma.user.delete({ where: { id: userB.id } }).catch(() => {});
    }
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  beforeEach(() => {
    importSessionStore.clearAllForTesting();
  });

  // =========================================================================
  // 1. User Registration & Login (Step 1)
  // =========================================================================
  describe("Step 1: User Registration & Authentication", () => {
    it("registers User A and User B and acquires valid authentication tokens", async () => {
      const emailA = `  IngestUserA_${Date.now()}@Internal.Test  `;
      const emailB = `IngestUserB_${Date.now()}@internal.test`;

      // 1. Register User A
      const regResA = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "User A Ingestion Tester",
          email: emailA,
          password: "SecurePassword123!",
        }),
      });
      assert.equal(regResA.status, 201);
      const regDataA = await regResA.json();
      assert.ok(regDataA.id);
      userA = { id: regDataA.id, email: regDataA.email };

      // Login User A with normalized email
      const loginResA = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailA.trim().toLowerCase(),
          password: "SecurePassword123!",
        }),
      });
      assert.equal(loginResA.status, 200);
      const loginDataA = await loginResA.json();
      assert.ok(loginDataA.token);
      tokenA = loginDataA.token;

      // 2. Register and Login User B (for cross-tenant checks)
      const regResB = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "User B Tenant Isolation",
          email: emailB,
          password: "SecurePassword123!",
        }),
      });
      assert.equal(regResB.status, 201);
      const regDataB = await regResB.json();
      userB = { id: regDataB.id, email: regDataB.email };

      const loginResB = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailB,
          password: "SecurePassword123!",
        }),
      });
      assert.equal(loginResB.status, 200);
      const loginDataB = await loginResB.json();
      tokenB = loginDataB.token;
    });
  });

  // =========================================================================
  // 2. Upload Supported CSV and XLSX Statements (Step 2)
  // =========================================================================
  describe("Step 2: Upload Supported CSV and XLSX Statements", () => {
    it("uploads synthetic CSV statement and generates structured session metadata", async () => {
      const csv = `Date,Description,Amount,Type
2026-10-01,Starbucks Reserve Coffee,450.00,Debit
2026-10-02,Trader Joes Organic Groceries,1250.75,Debit
2026-10-03,Monthly Salary Tech Corp,75000.00,Credit
2026-10-04,Transfer to High Yield Savings,15000.00,Debit
2026-10-05,Opening Ledger Balance,50000.00,Credit
2026-10-06,Unbranded Vendor X99,800.00,Debit`;

      const { status, body } = await uploadStatementHttp(
        tokenA,
        Buffer.from(csv, "utf8"),
        "october_expenses.csv"
      );

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.ok(body.data.fileId);
      assert.equal(body.data.fileType, "csv");
      assert.equal(body.data.totalRows, 6);
      assert.deepEqual(body.data.headers, ["Date", "Description", "Amount", "Type"]);
      assert.equal(body.data.suggestedMapping.descriptionColumn, "Description");
      assert.equal(body.data.suggestedMapping.amountColumn, "Amount");
    });

    it("uploads synthetic XLSX statement with multiple columns", async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("October Transactions");
      sheet.addRow(["Date", "Description", "Debit", "Credit", "Balance"]);
      sheet.addRow(["2026-10-07", "Amazon Cloud Hosting AWS", 3200.0, "", 46800.0]);
      sheet.addRow(["2026-10-08", "Client Consulting Fee Credit", "", 12000.0, 58800.0]);
      sheet.addRow(["2026-10-09", "Uber City Ride", 385.5, "", 58414.5]);

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      const { status, body } = await uploadStatementHttp(tokenA, buffer, "transactions.xlsx");

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.ok(body.data.fileId);
      assert.equal(body.data.fileType, "xlsx");
      assert.equal(body.data.totalRows, 3);
      assert.ok(body.data.worksheets.includes("October Transactions"));
    });
  });

  // =========================================================================
  // 3. Upload Text-Based PDF Statements (Step 3)
  // =========================================================================
  describe("Step 3: Upload Text-Based PDF Statements", () => {
    it("uploads synthetic text-based PDF statement and extracts tabular layout", async () => {
      const pdfBuffer = await generateSyntheticPdf();
      const { status, body } = await uploadStatementHttp(tokenA, pdfBuffer, "bank_statement.pdf");

      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.ok(body.data.fileId);
      assert.equal(body.data.fileType, "pdf");
      assert.ok(body.data.totalRows >= 3);
      assert.ok(body.data.headers.includes("Narration") || body.data.headers.includes("Description"));
    });
  });

  // =========================================================================
  // 4. Reject Unsupported or Malformed Files (Step 4)
  // =========================================================================
  describe("Step 4: Rejection of Unsupported and Malformed Files", () => {
    it("rejects unsupported extensions (.exe, .docx) with 400 and useful message", async () => {
      const { status, body } = await uploadStatementHttp(
        tokenA,
        Buffer.from("MZ malicious exe dummy", "utf8"),
        "virus.exe"
      );
      assert.equal(status, 400);
      assert.ok(body.message.includes("Invalid file format") || body.message.includes("Unsupported"));
    });

    it("rejects binary content masquerading as CSV", async () => {
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe]);
      const { status, body } = await uploadStatementHttp(tokenA, binaryData, "fake.csv");
      assert.equal(status, 400);
      assert.ok(body.message.includes("Binary content detected"));
    });

    it("rejects empty uploaded files (0 bytes)", async () => {
      const { status, body } = await uploadStatementHttp(tokenA, Buffer.alloc(0), "empty.csv");
      assert.equal(status, 400);
      assert.ok(body.message.includes("empty"));
    });

    it("rejects scanned / image-only PDFs without extractable text clearly", async () => {
      const scannedBuffer = await generateScannedMockupPdf();
      const { status, body } = await uploadStatementHttp(tokenA, scannedBuffer, "scanned_doc.pdf");
      assert.equal(status, 400);
      assert.ok(
        body.message.includes("scanned document") ||
          body.message.includes("OCR") ||
          body.message.includes("no extractable text") ||
          body.message.includes("No machine-readable text") ||
          body.message.includes("Scanned or image-only") ||
          body.message.includes("supported bank statement")
      );
    });
  });

  // =========================================================================
  // 5, 6, 7 & 8: Preview, Row Corrections, Confirm, and Persistence (Steps 5-8)
  // =========================================================================
  describe("Steps 5 to 8: Preview, Row Corrections, Confirmation, and DB Persistence", () => {
    let activeFileId: string;
    const mapping = {
      descriptionColumn: "Description",
      amountMode: "single_amount" as const,
      amountColumn: "Amount",
      dateColumn: "Date",
      externalIdColumn: "Ref",
    };
    const options = {
      amountConvention: "all_positive" as const,
    };

    beforeEach(async () => {
      const csv = `Date,Description,Amount,Type,Ref
2026-10-01,Starbucks Reserve Coffee,450.00,Debit,REF001
2026-10-02,Trader Joes Organic Groceries,1250.75,Debit,REF002
2026-10-03,Monthly Salary Tech Corp,75000.00,Credit,REF003
2026-10-04,Transfer to High Yield Savings,15000.00,Debit,REF004
2026-10-05,Opening Ledger Balance,50000.00,Credit,REF005
2026-10-06,Unbranded Vendor X99,800.00,Debit,REF006`;

      const upload = await uploadStatementHttp(tokenA, Buffer.from(csv, "utf8"), "journey_statement.csv");
      activeFileId = upload.body.data.fileId;
    });

    it("generates preview and accurately separates expenses from credits, transfers, and balances", async () => {
      const res = await fetch(`${baseUrl}/api/transactions/import/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: activeFileId,
          mapping,
          options,
        }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      const { summary, sampleRows } = json.data;

      // Total 6 rows:
      // Row 1 (Starbucks): Valid Debit -> READY
      // Row 2 (Trader Joes): Valid Debit -> READY
      // Row 3 (Salary): Credit -> EXCLUDED_NON_EXPENSE
      // Row 4 (Transfer to Savings): Transfer -> EXCLUDED_NON_EXPENSE
      // Row 5 (Opening Balance): Balance -> EXCLUDED_NON_EXPENSE
      // Row 6 (Unbranded Vendor): Valid Debit -> READY (tier UNCLASSIFIED)
      assert.equal(summary.totalRows, 6);
      assert.equal(summary.validExpenseCount, 3);
      assert.equal(summary.validExpenseTotal, 2500.75); // 450.00 + 1250.75 + 800.00
      assert.equal(summary.excludedNonExpenseCount, 3);
      assert.equal(summary.excludedNonExpenseTotal, 140000.0); // 75000 + 15000 + 50000

      // Verify row 6 is reviewable
      const row6 = sampleRows.find((r: any) => r.rowIndex === 6);
      assert.ok(row6);
      assert.equal(row6.status, "READY");
      assert.equal(row6.isUnclassified, true);
      assert.equal(row6.needsReview, true);
    });

    it("applies user row corrections for category and spending tier in preview", async () => {
      const res = await fetch(`${baseUrl}/api/transactions/import/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: activeFileId,
          mapping,
          options,
          rowCorrections: {
            "6": {
              category: Category.FOOD,
              priority: Priority.ESSENTIAL,
              notes: "Verified as team lunch",
            },
          },
        }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      const row6 = json.data.sampleRows.find((r: any) => r.rowIndex === 6);
      assert.equal(row6.mapped.category, Category.FOOD);
      assert.equal(row6.mapped.priority, Priority.ESSENTIAL);
      assert.equal(row6.mapped.notes, "Verified as team lunch");
      assert.equal(row6.userCorrected, true);
      assert.equal(row6.needsReview, false);
    });

    it("confirms import explicitly, applies corrections, and verifies database persistence & ownership", async () => {
      const confirmRes = await fetch(`${baseUrl}/api/transactions/import/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: activeFileId,
          mapping,
          options,
          rowCorrections: {
            "6": {
              category: Category.FOOD,
              priority: Priority.ESSENTIAL,
              notes: "User confirmed team lunch",
            },
          },
        }),
      });

      assert.equal(confirmRes.status, 201);
      const confirmData = await confirmRes.json();
      assert.equal(confirmData.success, true);
      assert.equal(confirmData.data.imported, 3);
      assert.equal(confirmData.data.excludedNonExpense, 3);

      // Verify records in database
      const userTransactions = await prisma.transaction.findMany({
        where: { userId: userA.id },
        orderBy: { transactionDate: "asc" },
      });

      assert.equal(userTransactions.length, 3);
      // Verify User ownership
      for (const txn of userTransactions) {
        assert.equal(txn.userId, userA.id);
        assert.equal(txn.source, TransactionSource.CSV_IMPORT);
      }

      // Verify row 6 correction was preserved
      const correctedTxn = userTransactions.find((t) => t.title === "Unbranded Vendor X99");
      assert.ok(correctedTxn);
      assert.equal(correctedTxn.category, Category.FOOD);
      assert.equal(correctedTxn.priority, Priority.ESSENTIAL);
      assert.equal(correctedTxn.notes, "User confirmed team lunch");
      assert.equal(Number(correctedTxn.amount), 800.0);
    });
  });

  // =========================================================================
  // 9. Dashboard Totals Updated Correctly (Step 9)
  // =========================================================================
  describe("Step 9: Dashboard Aggregations and Spending Totals", () => {
    it("verifies dashboard totals match sum of confirmed expenses without inflation from credits", async () => {
      const res = await fetch(`${baseUrl}/api/dashboard`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const dashboard = await res.json();

      // Total spent must be exactly: 450.00 + 1250.75 + 800.00 = 2500.75
      assert.equal(Number(dashboard.totalSpent), 2500.75);
      assert.equal(dashboard.transactionCount, 3);

      // Verify category breakdown includes FOOD (corrected Vendor X99 = 800.00)
      const foodTotal = dashboard.categoryTotals[Category.FOOD] ?? dashboard.categoryTotals["FOOD"];
      assert.ok(foodTotal !== undefined);
      assert.equal(Number(foodTotal), 800.0);

      // Verify OTHER contains unclassified transactions (Starbucks 450 + Trader Joes 1250.75 = 1700.75)
      const otherTotal = dashboard.categoryTotals[Category.OTHER] ?? dashboard.categoryTotals["OTHER"];
      assert.ok(otherTotal !== undefined);
      assert.equal(Number(otherTotal), 1700.75);

      // Verify priority breakdown includes ESSENTIAL
      const essentialTotal = dashboard.priorityTotals[Priority.ESSENTIAL] ?? dashboard.priorityTotals["ESSENTIAL"];
      assert.ok(essentialTotal !== undefined);
      assert.equal(Number(essentialTotal), 800.0);
    });
  });

  // =========================================================================
  // 10 & 11: Reimport Duplicate Detection & Classification Preservation (Steps 10 & 11)
  // =========================================================================
  describe("Steps 10 & 11: Reimport Duplicate Detection and Classification Preservation", () => {
    let reimportFileId: string;
    const mapping = {
      descriptionColumn: "Description",
      amountMode: "single_amount" as const,
      amountColumn: "Amount",
      dateColumn: "Date",
      externalIdColumn: "Ref",
    };
    const options = {
      amountConvention: "all_positive" as const,
    };

    beforeEach(async () => {
      const csv = `Date,Description,Amount,Type,Ref
2026-10-01,Starbucks Reserve Coffee,450.00,Debit,REF001
2026-10-02,Trader Joes Organic Groceries,1250.75,Debit,REF002
2026-10-03,Monthly Salary Tech Corp,75000.00,Credit,REF003
2026-10-04,Transfer to High Yield Savings,15000.00,Debit,REF004
2026-10-05,Opening Ledger Balance,50000.00,Credit,REF005
2026-10-06,Unbranded Vendor X99,800.00,Debit,REF006`;

      const upload = await uploadStatementHttp(tokenA, Buffer.from(csv, "utf8"), "journey_statement.csv");
      reimportFileId = upload.body.data.fileId;
    });

    it("detects existing transactions as CONFIRMED_DUPLICATE upon reimporting same statement", async () => {
      const res = await fetch(`${baseUrl}/api/transactions/import/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: reimportFileId,
          mapping,
          options,
        }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      const { summary, sampleRows } = json.data;

      // 3 existing transactions are detected as CONFIRMED_DUPLICATE
      assert.equal(summary.confirmedDuplicateCount, 3);
      assert.equal(summary.validExpenseCount, 0);
      assert.equal(summary.expectedToImportCount, 0);

      const dupRows = sampleRows.filter((r: any) => r.status === "CONFIRMED_DUPLICATE");
      assert.equal(dupRows.length, 3);
    });

    it("preserves manual user edits when reimporting an existing statement", async () => {
      // Find Starbucks transaction and update to GIFTS / LUXURY
      const starbucks = await prisma.transaction.findFirst({
        where: { userId: userA.id, title: "Starbucks Reserve Coffee" },
      });
      assert.ok(starbucks);

      await prisma.transaction.update({
        where: { id: starbucks.id },
        data: {
          category: Category.GIFT,
          priority: Priority.LUXURY,
        },
      });

      // Confirm reimport
      const confirmRes = await fetch(`${baseUrl}/api/transactions/import/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: reimportFileId,
          mapping,
          options,
        }),
      });

      assert.equal(confirmRes.status, 201);
      const confirmData = await confirmRes.json();
      assert.equal(confirmData.data.imported, 0); // 0 new transactions added
      assert.equal(confirmData.data.alreadyExisting, 0); // detected as duplicates

      // Verify the record in DB still retains the manual update (GIFT / LUXURY)
      const afterTxn = await prisma.transaction.findUnique({
        where: { id: starbucks.id },
      });
      assert.equal(afterTxn?.category, Category.GIFT);
      assert.equal(afterTxn?.priority, Priority.LUXURY);

      // Verify DB count did not grow
      const totalCount = await prisma.transaction.count({
        where: { userId: userA.id },
      });
      assert.equal(totalCount, 3);
    });
  });

  // =========================================================================
  // 12 & 13: Mixed Statements, Income, Transfers & Invalid Rows (Steps 12 & 13)
  // =========================================================================
  describe("Steps 12 & 13: Non-Expense Rejection and Mixed Statement Processing", () => {
    it("safely rejects credit card refunds, salary, self-transfers, and balance summaries", async () => {
      const csv = `Date,Description,Amount
2026-10-15,VALID EXPENSE PHARMACY,250.00
2026-10-15,REFUND PROCESSED AMAZON PAY INDIA,2499.00
2026-10-15,SALARY CREDITED FOR OCTOBER 2026,120000.00
2026-10-15,TRF TO OWN ACCOUNT SAVINGS,30000.00
2026-10-15,STATEMENT SUMMARY TOTAL BALANCE AVAILABLE,145000.00
2026-10-15,INVALID ROW MISSING AMOUNT,
2026-10-15,ZERO AMOUNT ROW,0.00`;

      const upload = await uploadStatementHttp(tokenA, Buffer.from(csv, "utf8"), "mixed_records.csv");
      const fileId = upload.body.data.fileId;

      const previewRes = await fetch(`${baseUrl}/api/transactions/import/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          mapping: {
            descriptionColumn: "Description",
            amountMode: "single_amount",
            amountColumn: "Amount",
            dateColumn: "Date",
          },
          options: {
            amountConvention: "all_positive",
          },
        }),
      });

      assert.equal(previewRes.status, 200);
      const json = await previewRes.json();
      const { summary, sampleRows } = json.data;

      // Exactly 1 valid expense
      assert.equal(summary.validExpenseCount, 1);
      assert.equal(summary.validExpenseTotal, 250.0);
      // 4 excluded non-expense records (refund, salary, transfer, balance summary)
      assert.equal(summary.excludedNonExpenseCount, 4);
      // 2 invalid rows (empty amount, negative amount)
      assert.equal(summary.invalidRowCount, 2);

      const invalidRows = sampleRows.filter((r: any) => r.status === "INVALID");
      assert.equal(invalidRows.length, 2);
    });
  });

  // =========================================================================
  // 14. Edge Cases: Headers, Formats, and Currency Symbols (Step 14)
  // =========================================================================
  describe("Step 14: Edge Cases: Formats, Currency Symbols, and Dates", () => {
    it("handles headers-only files safely with zero data rows", async () => {
      const csv = `Date,Description,Amount\n`;
      const upload = await uploadStatementHttp(tokenA, Buffer.from(csv, "utf8"), "headers_only.csv");
      assert.equal(upload.status, 200);
      assert.equal(upload.body.data.totalRows, 0);

      const previewRes = await fetch(`${baseUrl}/api/transactions/import/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: upload.body.data.fileId,
          mapping: {
            descriptionColumn: "Description",
            amountMode: "single_amount",
            amountColumn: "Amount",
            dateColumn: "Date",
          },
        }),
      });
      assert.equal(previewRes.status, 200);
      const json = await previewRes.json();
      assert.equal(json.data.summary.totalRows, 0);
      assert.equal(json.data.summary.validExpenseCount, 0);
    });

    it("parses currency symbols (₹, $, negative parens) and various date formats accurately", async () => {
      const csv = `Date,Description,Amount
2026-10-16,Rupee Symbol Grocery,"₹1,450.50"
16/10/2026,Dollar Symbol Online Tool,$49.99
16-Oct-2026,Parentheses Debit Item,(320.00)`;

      const upload = await uploadStatementHttp(tokenA, Buffer.from(csv, "utf8"), "currencies.csv");
      const fileId = upload.body.data.fileId;

      const previewRes = await fetch(`${baseUrl}/api/transactions/import/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          mapping: {
            descriptionColumn: "Description",
            amountMode: "single_amount",
            amountColumn: "Amount",
            dateColumn: "Date",
          },
          options: {
            amountConvention: "all_positive",
          },
        }),
      });

      assert.equal(previewRes.status, 200);
      const json = await previewRes.json();
      assert.equal(json.data.summary.validExpenseCount, 3);
      assert.equal(json.data.sampleRows[0].mapped.amount, 1450.5);
      assert.equal(json.data.sampleRows[1].mapped.amount, 49.99);
      assert.equal(json.data.sampleRows[2].mapped.amount, 320.0);
    });

    it("handles files with duplicate header names safely", async () => {
      const csv = `Date,Description,Amount,Amount\n2026-10-16,Duplicate Header Test,150.00,150.00\n`;
      const upload = await uploadStatementHttp(tokenA, Buffer.from(csv, "utf8"), "dup_headers.csv");
      assert.equal(upload.status, 200);
      assert.ok(upload.body.data.headers.length >= 3);
    });
  });

  // =========================================================================
  // 15. Cancellation and Abandoned Previews (Step 15)
  // =========================================================================
  describe("Step 15: Abandoned Previews and Cancellation", () => {
    it("guarantees abandoned preview sessions persist zero transactions to database", async () => {
      const csv = `Date,Description,Amount
2026-10-16,Abandoned Grocery Item,150.00
2026-10-16,Abandoned Coffee Item,80.00`;

      // User B uploads and previews
      const upload = await uploadStatementHttp(tokenB, Buffer.from(csv, "utf8"), "abandoned.csv");
      const fileId = upload.body.data.fileId;

      await fetch(`${baseUrl}/api/transactions/import/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenB}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          mapping: {
            descriptionColumn: "Description",
            amountMode: "single_amount",
            amountColumn: "Amount",
            dateColumn: "Date",
          },
          options: {
            amountConvention: "all_positive",
          },
        }),
      });

      // User B leaves without calling /confirm
      const userBCount = await prisma.transaction.count({
        where: { userId: userB.id },
      });
      assert.equal(userBCount, 0);
    });
  });

  // =========================================================================
  // 16. Multi-Tenant Authorization Isolation (Step 16)
  // =========================================================================
  describe("Step 16: Multi-Tenant Authorization Isolation", () => {
    it("prevents User B from previewing or confirming User A's uploaded statement session", async () => {
      // User A uploads a statement
      const csv = `Date,Description,Amount\n2026-10-16,Secret Tenant A Txn,999.00\n`;
      const uploadA = await uploadStatementHttp(tokenA, Buffer.from(csv, "utf8"), "secret_tenant_a.csv");
      const fileIdA = uploadA.body.data.fileId;

      // User B attempts to preview User A's fileId
      const previewResB = await fetch(`${baseUrl}/api/transactions/import/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenB}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: fileIdA,
          mapping: {
            descriptionColumn: "Description",
            amountMode: "single_amount",
            amountColumn: "Amount",
            dateColumn: "Date",
          },
        }),
      });
      // Must be 403 Forbidden
      assert.equal(previewResB.status, 403);

      // User B attempts to confirm User A's fileId
      const confirmResB = await fetch(`${baseUrl}/api/transactions/import/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenB}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: fileIdA,
          mapping: {
            descriptionColumn: "Description",
            amountMode: "single_amount",
            amountColumn: "Amount",
            dateColumn: "Date",
          },
        }),
      });
      // Must be 403 Forbidden
      assert.equal(confirmResB.status, 403);

      // Verify User B still has 0 transactions
      const countB = await prisma.transaction.count({ where: { userId: userB.id } });
      assert.equal(countB, 0);
    });
  });
});

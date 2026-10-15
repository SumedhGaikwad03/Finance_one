import { describe, it, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { Prisma } from "../generated/prisma/client";
import { Category, Priority, TransactionSource } from "../generated/prisma/enums";
import {
  parseCsvBuffer,
  detectAndValidateFileType,
  suggestColumnMapping,
  transformRow,
  importService,
  importSessionStore,
  ColumnMapping,
  ImportOptions,
} from "../import";
import * as transactionRepository from "../repositories/transaction.repository";
import { ValidationError, ForbiddenError } from "../error/AppError";

describe("Phase 3: CSV & XLSX Expense Import Test Suite", () => {
  beforeEach(() => {
    importSessionStore.clearAllForTesting();
  });

  // =========================================================================
  // 1. File Validation & Format Detection
  // =========================================================================
  describe("1. File Detection & Format Safeguards", () => {
    it("accepts valid CSV buffer with text content", () => {
      const csvBuffer = Buffer.from("Date,Description,Amount\n2026-10-01,Coffee,4.50\n", "utf8");
      const fileType = detectAndValidateFileType(csvBuffer, "statement.csv");
      assert.equal(fileType, "csv");
    });

    it("rejects binary or null-byte content masquerading as CSV", () => {
      const binaryBuffer = Buffer.from([0x00, 0x01, 0x02, 0xff]);
      assert.throws(
        () => detectAndValidateFileType(binaryBuffer, "fake.csv"),
        (err: any) => err instanceof ValidationError && err.message.includes("Binary content detected")
      );
    });

    it("accepts valid XLSX buffer with ZIP magic bytes", async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Expenses");
      sheet.addRow(["Date", "Description", "Amount"]);
      sheet.addRow(["2026-10-01", "Coffee", 4.50]);
      const rawBuffer = await workbook.xlsx.writeBuffer();
      const buffer = Buffer.from(rawBuffer as any);

      const fileType = detectAndValidateFileType(buffer, "statement.xlsx");
      assert.equal(fileType, "xlsx");
    });

    it("rejects fake XLSX file without ZIP magic bytes", () => {
      const fakeXlsx = Buffer.from("This is just plain text, not a zip", "utf8");
      assert.throws(
        () => detectAndValidateFileType(fakeXlsx, "malicious.xlsx"),
        (err: any) => err instanceof ValidationError && err.message.includes("Corrupted or invalid Excel file")
      );
    });

    it("rejects empty uploaded files", () => {
      assert.throws(
        () => detectAndValidateFileType(Buffer.alloc(0), "empty.csv"),
        (err: any) => err instanceof ValidationError && err.message.includes("empty")
      );
    });

    it("rejects unsupported extensions like .pdf or .exe", () => {
      const buf = Buffer.from("some content", "utf8");
      assert.throws(
        () => detectAndValidateFileType(buf, "invoice.pdf"),
        (err: any) => err instanceof ValidationError && err.message.includes("Unsupported file format")
      );
    });
  });

  // =========================================================================
  // 2. CSV Parser Engine
  // =========================================================================
  describe("2. CSV Parsing Engine", () => {
    it("handles quoted delimiters, escaped quotes, and newlines in cells", () => {
      const csv = `Date,Description,Amount
2026-10-01,"Coffee, with sugar",5.50
2026-10-02,"Store ""Mega"" Supermarket",45.20
2026-10-03,"Multi
Line
Item",12.00`;
      const parsed = parseCsvBuffer(Buffer.from(csv, "utf8"));
      assert.equal(parsed.totalRows, 3);
      assert.deepEqual(parsed.headers, ["Date", "Description", "Amount"]);
      assert.equal(parsed.rows[0]["Description"], "Coffee, with sugar");
      assert.equal(parsed.rows[1]["Description"], 'Store "Mega" Supermarket');
      assert.ok(parsed.rows[2]["Description"].includes("Line"));
    });

    it("handles semicolons and tab delimiters automatically", () => {
      const semicolonCsv = `Date;Narration;Amount\n2026-10-01;Fuel;50.00\n2026-10-02;Groceries;30.00`;
      const parsed = parseCsvBuffer(Buffer.from(semicolonCsv, "utf8"));
      assert.equal(parsed.totalRows, 2);
      assert.deepEqual(parsed.headers, ["Date", "Narration", "Amount"]);
      assert.equal(parsed.rows[0]["Narration"], "Fuel");

      const tabCsv = `Date\tDetails\tAmount\n2026-10-05\tDinner\t42.00`;
      const parsedTab = parseCsvBuffer(Buffer.from(tabCsv, "utf8"));
      assert.equal(parsedTab.totalRows, 1);
      assert.equal(parsedTab.rows[0]["Details"], "Dinner");
    });

    it("strips UTF-8 BOM smoothly", () => {
      const bomCsv = "\uFEFFDate,Description,Amount\n2026-10-01,Test,10.00";
      const parsed = parseCsvBuffer(Buffer.from(bomCsv, "utf8"));
      assert.equal(parsed.headers[0], "Date");
    });

    it("handles deduplication of identical header names", () => {
      const dupCsv = `Amount,Amount,Description\n10,20,Test`;
      const parsed = parseCsvBuffer(Buffer.from(dupCsv, "utf8"));
      assert.deepEqual(parsed.headers, ["Amount", "Amount_2", "Description"]);
    });
  });

  // =========================================================================
  // 3. XLSX Parser & Worksheet Selection
  // =========================================================================
  describe("3. XLSX Parsing & Worksheet Selection", () => {
    it("parses multi-sheet Excel files and supports sheet selection", async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet1 = workbook.addWorksheet("October");
      sheet1.addRow(["Date", "Description", "Debit", "Credit"]);
      sheet1.addRow(["2026-10-01", "Swiggy", 350, 0]);

      const sheet2 = workbook.addWorksheet("November");
      sheet2.addRow(["Date", "Narration", "Amount"]);
      sheet2.addRow(["2026-11-01", "Uber", 220]);

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      // Parse with service
      const meta = await importService.parseUploadedFile("1", buffer, "bank.xlsx");
      assert.equal(meta.worksheets.length, 2);
      assert.equal(meta.activeWorksheet, "October");
      assert.equal(meta.headers.includes("Debit"), true);

      // Switch to sheet 2
      const switched = await importService.switchWorksheet("1", meta.fileId, "November");
      assert.equal(switched.activeWorksheet, "November");
      assert.equal(switched.headers.includes("Narration"), true);
      assert.equal(switched.totalRows, 1);
    });

    it("neutralizes spreadsheet formulas without executing them", async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Security");
      sheet.addRow(["Date", "Description", "Amount"]);

      // Insert malicious formula string
      sheet.addRow(["2026-10-01", "=cmd|' /C calc'!A0", 50]);
      sheet.addRow(["2026-10-02", "@SUM(1+1)", 100]);

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      const meta = await importService.parseUploadedFile("1", buffer, "calc.xlsx");

      // Verify that description has formula trigger prefixed or escaped
      assert.ok(meta.previewRows[0]["Description"].startsWith("'="));
      assert.ok(meta.previewRows[1]["Description"].startsWith("'@"));
    });
  });

  // =========================================================================
  // 4. Heuristic Column Mapping
  // =========================================================================
  describe("4. Heuristic Column Auto-Mapping", () => {
    it("auto-detects separate Debit/Credit columns", () => {
      const headers = ["Txn Date", "Narration", "Chq/Ref No", "Withdrawal (Dr)", "Deposit (Cr)", "Balance"];
      const mapping = suggestColumnMapping(headers);

      assert.equal(mapping.amountMode, "debit_credit");
      assert.equal(mapping.debitColumn, "Withdrawal (Dr)");
      assert.equal(mapping.creditColumn, "Deposit (Cr)");
      assert.equal(mapping.dateColumn, "Txn Date");
      assert.equal(mapping.descriptionColumn, "Narration");
      assert.equal(mapping.externalIdColumn, "Chq/Ref No");
    });

    it("auto-detects single Amount column when no separate debit/credit present", () => {
      const headers = ["Date", "Description", "Amount", "Reference"];
      const mapping = suggestColumnMapping(headers);

      assert.equal(mapping.amountMode, "single_amount");
      assert.equal(mapping.amountColumn, "Amount");
      assert.equal(mapping.dateColumn, "Date");
      assert.equal(mapping.descriptionColumn, "Description");
      assert.equal(mapping.externalIdColumn, "Reference");
    });
  });

  // =========================================================================
  // 5. Row Transformation, Expense Eligibility & Date Parsing
  // =========================================================================
  describe("5. Row Transformation, Expense Eligibility & Dates", () => {
    const debitCreditMapping: ColumnMapping = {
      descriptionColumn: "Narration",
      amountMode: "debit_credit",
      debitColumn: "Debit",
      creditColumn: "Credit",
      dateColumn: "Date",
      externalIdColumn: "Ref",
    };

    it("identifies debit as an eligible expense", () => {
      const row = {
        Date: "15/10/2026",
        Narration: "SUPERMARKET STORE",
        Debit: "1,250.50",
        Credit: "0.00",
        Ref: "TXN1001",
      };
      const result = transformRow(row, debitCreditMapping, { dateFormat: "DD/MM/YYYY" }, 1);

      assert.equal(result.status, "READY");
      assert.equal(result.mapped.amount, 1250.50);
      assert.equal(result.mapped.title, "SUPERMARKET STORE");
      assert.equal(result.mapped.externalId, "TXN1001");
      assert.ok(result.candidateInput);
      assert.equal(Number(result.candidateInput!.amount), 1250.50);
    });

    it("excludes credit / salary deposit rows as non-expenses", () => {
      const row = {
        Date: "01/10/2026",
        Narration: "SALARY ACME CORP",
        Debit: "",
        Credit: "50,000.00",
        Ref: "SAL2026",
      };
      const result = transformRow(row, debitCreditMapping, {}, 2);

      assert.equal(result.status, "EXCLUDED_NON_EXPENSE");
      assert.equal(result.mapped.amount, 50000.00);
      assert.ok(result.reasons[0].includes("excluded"));
      assert.equal(result.candidateInput, undefined);
    });

    it("excludes statement opening and closing balance rows", () => {
      const row = {
        Date: "01/10/2026",
        Narration: "OPENING BALANCE B/F",
        Debit: "",
        Credit: "12,000.00",
      };
      const result = transformRow(row, debitCreditMapping, {}, 3);

      assert.equal(result.status, "EXCLUDED_NON_EXPENSE");
      assert.ok(result.reasons[0].includes("balance"));
    });

    it("handles single-amount column with negative as expense convention", () => {
      const singleMapping: ColumnMapping = {
        descriptionColumn: "Description",
        amountMode: "single_amount",
        amountColumn: "Amount",
        dateColumn: "Date",
      };

      const expenseRow = { Date: "2026-10-10", Description: "Coffee", Amount: "-4.50" };
      const expRes = transformRow(expenseRow, singleMapping, { amountConvention: "negative_is_expense" }, 1);
      assert.equal(expRes.status, "READY");
      assert.equal(expRes.mapped.amount, 4.50);

      const incomeRow = { Date: "2026-10-10", Description: "Refund", Amount: "25.00" };
      const incRes = transformRow(incomeRow, singleMapping, { amountConvention: "negative_is_expense" }, 2);
      assert.equal(incRes.status, "EXCLUDED_NON_EXPENSE");
    });

    it("marks invalid rows missing both amount and date", () => {
      const badRow = { Date: "invalid-date", Narration: "Something", Debit: "abc", Credit: "" };
      const result = transformRow(badRow, debitCreditMapping, {}, 1);
      assert.equal(result.status, "INVALID");
      assert.ok(result.reasons.length > 0);
    });
  });

  // =========================================================================
  // 6. Preview Engine & Duplicate Detection
  // =========================================================================
  describe("6. Preview Engine & In-File Duplicates", () => {
    it("detects in-file duplicate transactions with identical external IDs or content", async () => {
      const csv = `Date,Description,Amount,Ref
2026-10-01,Groceries,-50.00,TXN999
2026-10-02,Pharmacy,-20.00,TXN888
2026-10-01,Groceries,-50.00,TXN999`;

      const meta = await importService.parseUploadedFile("1", Buffer.from(csv, "utf8"), "test.csv");
      const preview = await importService.generateImportPreview("1", meta.fileId, {
        dateColumn: "Date",
        descriptionColumn: "Description",
        amountMode: "single_amount",
        amountColumn: "Amount",
        externalIdColumn: "Ref",
      });

      assert.equal(preview.summary.totalRows, 3);
      assert.equal(preview.summary.validExpenseCount, 2);
      assert.equal(preview.summary.duplicateInFileCount, 1);
      assert.equal(preview.sampleRows[2].status, "DUPLICATE_IN_FILE");
    });

    it("enforces user isolation: rejects access to another user's session", async () => {
      const csv = `Date,Description,Amount\n2026-10-01,Dinner,-40.00`;
      const meta = await importService.parseUploadedFile("1", Buffer.from(csv, "utf8"), "secret.csv");

      // User 2 tries to access User 1's fileId
      await assert.rejects(
        async () => {
          await importService.generateImportPreview("2", meta.fileId, {
            dateColumn: "Date",
            descriptionColumn: "Description",
            amountMode: "single_amount",
            amountColumn: "Amount",
          });
        },
        (err: any) => err instanceof ForbiddenError
      );
    });
  });

  // =========================================================================
  // 7. End-to-End Import Confirmation & Idempotency
  // =========================================================================
  describe("7. Confirmation & Idempotency", () => {
    it("commits eligible expenses and prevents duplicates on retry", async () => {
      const testRef = `TEST_IMP_${Date.now()}`;
      const csv = `Date,Description,Debit,Credit,Ref
2026-10-05,Office Supplies,150.00,,${testRef}
2026-10-06,Client Payment,,2000.00,INC_123
2026-10-07,Internet Bill,80.00,,${testRef}_2`;

      const meta = await importService.parseUploadedFile("1", Buffer.from(csv, "utf8"), "expenses.csv");

      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Description",
        amountMode: "debit_credit",
        debitColumn: "Debit",
        creditColumn: "Credit",
        externalIdColumn: "Ref",
      };

      const result = await importService.confirmAndCommitImport("1", {
        fileId: meta.fileId,
        mapping,
      });

      assert.equal(result.imported, 2);
      assert.equal(result.excludedNonExpense, 1);
      assert.equal(result.importedIds.length, 2);

      // Verify that re-importing the exact same rows in a new file recognizes them as confirmed duplicates
      const meta2 = await importService.parseUploadedFile("1", Buffer.from(csv, "utf8"), "expenses_retry.csv");
      const preview2 = await importService.generateImportPreview("1", meta2.fileId, mapping);

      // The two expenses with external IDs should now be marked CONFIRMED_DUPLICATE
      assert.equal(preview2.summary.confirmedDuplicateCount, 2);
      assert.equal(preview2.summary.validExpenseCount, 0);

      // Cleanup created transactions
      for (const id of result.importedIds) {
        await transactionRepository.deleteTransaction(Number(id));
      }
    });
  });

  // =========================================================================
  // 8. Deterministic Section 10 Fixture Reconciliation & Idempotency
  // =========================================================================
  describe("8. Section 10 Deterministic Reconciliation Fixture", () => {
    it("processes Section 10 6-row fixture: 4 debits imported (2729.00), 1 salary credit excluded, 1 opening balance excluded, and re-import yields 0 increase", async () => {
      const csv = `Date,Narration,Ref,Debit,Credit
2026-10-01,Fresh Basket groceries,TEST001,850.00,
2026-10-02,Metro travel,TEST002,200.00,
2026-10-03,Coffee House,TEST003,180.00,
2026-10-04,Salary credit,TEST004,,50000.00
2026-10-05,Opening Balance,,,2500.00
2026-10-06,Online shopping,TEST005,1499.00,`;

      // 1. Upload & parse
      const meta = await importService.parseUploadedFile("1", Buffer.from(csv, "utf8"), "reconciliation.csv");
      assert.equal(meta.totalRows, 6);

      // 2. Mapping
      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Narration",
        amountMode: "debit_credit",
        debitColumn: "Debit",
        creditColumn: "Credit",
        externalIdColumn: "Ref",
      };

      // 3. Preview
      const preview = await importService.generateImportPreview("1", meta.fileId, mapping, { dateFormat: "YYYY-MM-DD" });
      assert.equal(preview.summary.totalRows, 6);
      assert.equal(preview.summary.validExpenseCount, 4);
      assert.equal(preview.summary.excludedNonExpenseCount, 2);
      assert.equal(preview.summary.expectedToImportCount, 4);
      const previewTotal = preview.sampleRows
        .filter((r) => r.status === "READY")
        .reduce((sum, r) => sum + (r.mapped.amount || 0), 0);
      assert.equal(previewTotal, 2729.00);

      // Verify specific row exclusions
      const salaryRow = preview.sampleRows.find((r) => r.mapped.title?.includes("Salary credit"));
      assert.ok(salaryRow);
      assert.equal(salaryRow?.status, "EXCLUDED_NON_EXPENSE");
      assert.equal(salaryRow?.mapped.amount, 50000.00);
      assert.ok(salaryRow?.reasons[0].includes("Credit / deposit entry"));

      const balanceRow = preview.sampleRows.find((r) => r.mapped.title?.includes("Opening Balance"));
      assert.ok(balanceRow);
      assert.equal(balanceRow?.status, "EXCLUDED_NON_EXPENSE");
      assert.equal(balanceRow?.mapped.amount, 2500.00);
      assert.ok(balanceRow?.reasons[0].includes("balance"));

      // 4. Confirm & Commit Import
      const commitResult = await importService.confirmAndCommitImport("1", {
        fileId: meta.fileId,
        mapping,
      });

      assert.equal(commitResult.imported, 4);
      assert.equal(commitResult.excludedNonExpense, 2);
      assert.equal(commitResult.importedIds.length, 4);

      // Verify records in DB
      let ledgerSum = 0;
      for (const idStr of commitResult.importedIds) {
        const tx = await transactionRepository.findTransactionById(Number(idStr));
        assert.ok(tx);
        assert.equal(tx?.source, TransactionSource.CSV_IMPORT);
        ledgerSum += Number(tx?.amount);
      }
      assert.equal(ledgerSum, 2729.00);

      // 5. Re-import: verify idempotency and zero ledger increase
      const metaRetry = await importService.parseUploadedFile("1", Buffer.from(csv, "utf8"), "reconciliation_retry.csv");
      const previewRetry = await importService.generateImportPreview("1", metaRetry.fileId, mapping, { dateFormat: "YYYY-MM-DD" });

      assert.equal(previewRetry.summary.totalRows, 6);
      assert.equal(previewRetry.summary.validExpenseCount, 0); // All 4 are now duplicates!
      assert.equal(previewRetry.summary.confirmedDuplicateCount, 4);
      assert.equal(previewRetry.summary.excludedNonExpenseCount, 2);
      assert.equal(previewRetry.summary.expectedToImportCount, 0);
      const retryTotal = previewRetry.sampleRows
        .filter((r) => r.status === "READY")
        .reduce((sum, r) => sum + (r.mapped.amount || 0), 0);
      assert.equal(retryTotal, 0);

      const commitRetry = await importService.confirmAndCommitImport("1", {
        fileId: metaRetry.fileId,
        mapping,
      });

      assert.equal(commitRetry.imported, 0);
      assert.equal(commitRetry.importedIds.length, 0);

      // Cleanup transactions created for this test
      for (const idStr of commitResult.importedIds) {
        await transactionRepository.deleteTransaction(Number(idStr));
      }
    });
  });
});

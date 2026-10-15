import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "../generated/prisma/client";
import { Category, Priority, TransactionSource } from "../generated/prisma/enums";
import {
  importService,
  importSessionStore,
  suggestColumnMapping,
  transformRow,
  ColumnMapping,
} from "../import";
import { reconcileStatement } from "../import/reconciliation/statement-reconciler";
import { normalizePriority } from "../ingestion/normalizers/transaction.normalizer";
import { createTransactionSchema } from "../schemas/transaction.schema";
import * as transactionRepository from "../repositories/transaction.repository";

describe("Phase 4 & 5: Reconciliation, Unclassified Spending Tiers & Parsing Reliability", () => {
  beforeEach(() => {
    importSessionStore.clearAllForTesting();
  });

  // =========================================================================
  // 1. Mathematical Statement Reconciliation Engine
  // =========================================================================
  describe("1. Statement Reconciliation Engine", () => {
    it("reconciles standard bank statement: Opening - Debits + Credits == Closing", () => {
      // Opening: 10,000 | Debits: 1,500 + 500 = 2,000 | Credits: 5,000 | Closing: 13,000
      // 10,000 - 2,000 + 5,000 = 13,000
      const rawRows: Record<string, string>[] = [
        { Date: "2026-10-01", Narration: "Opening Balance", Amount: "10000.00" },
        { Date: "2026-10-02", Narration: "Grocery Store", Debit: "1500.00", Credit: "" },
        { Date: "2026-10-03", Narration: "Electricity Bill", Debit: "500.00", Credit: "" },
        { Date: "2026-10-04", Narration: "Salary Deposit", Debit: "", Credit: "5000.00" },
        { Date: "2026-10-05", Narration: "Closing Balance", Amount: "13000.00" },
      ];

      const transformedRows = [
        { status: "EXCLUDED_NON_EXPENSE" as const, reasons: ["Opening balance"], mapped: { title: "Opening Balance", amount: 10000, transactionDate: "2026-10-01" } },
        { status: "READY" as const, reasons: [], mapped: { title: "Grocery Store", amount: 1500, transactionDate: "2026-10-02" } },
        { status: "READY" as const, reasons: [], mapped: { title: "Electricity Bill", amount: 500, transactionDate: "2026-10-03" } },
        { status: "EXCLUDED_NON_EXPENSE" as const, reasons: ["Credit / deposit entry"], mapped: { title: "Salary Deposit", amount: 5000, transactionDate: "2026-10-04" } },
        { status: "EXCLUDED_NON_EXPENSE" as const, reasons: ["Closing balance"], mapped: { title: "Closing Balance", amount: 13000, transactionDate: "2026-10-05" } },
      ];

      const report = reconcileStatement(transformedRows, rawRows);

      assert.equal(report.status, "RECONCILED");
      assert.equal(report.reconciled, true);
      assert.equal(report.openingBalance, 10000);
      assert.equal(report.closingBalance, 13000);
      assert.equal(report.totalDebits, 2000);
      assert.equal(report.totalCredits, 5000);
      assert.equal(report.discrepancy, 0);
      assert.ok(report.message.includes("Statement balances reconcile mathematically"));
    });

    it("reconciles credit card statement convention: Opening + Debits - Credits == Closing", () => {
      // Opening balance: 5,000 (previous balance)
      // New charges (Debits): 3,000
      // Payments received (Credits): 4,000
      // Closing balance: 5,000 + 3,000 - 4,000 = 4,000
      const rawRows: Record<string, string>[] = [
        { Date: "2026-10-01", Narration: "Previous Balance", Amount: "5000.00" },
        { Date: "2026-10-02", Narration: "Electronics", Debit: "3000.00", Credit: "" },
        { Date: "2026-10-03", Narration: "Payment Received", Debit: "", Credit: "4000.00" },
        { Date: "2026-10-04", Narration: "Statement Ending Balance", Amount: "4000.00" },
      ];

      const transformedRows = [
        { status: "EXCLUDED_NON_EXPENSE" as const, reasons: ["Previous balance"], mapped: { title: "Previous Balance", amount: 5000, transactionDate: "2026-10-01" } },
        { status: "READY" as const, reasons: [], mapped: { title: "Electronics", amount: 3000, transactionDate: "2026-10-02" } },
        { status: "EXCLUDED_NON_EXPENSE" as const, reasons: ["Credit / deposit entry"], mapped: { title: "Payment Received", amount: 4000, transactionDate: "2026-10-03" } },
        { status: "EXCLUDED_NON_EXPENSE" as const, reasons: ["Ending balance"], mapped: { title: "Statement Ending Balance", amount: 4000, transactionDate: "2026-10-04" } },
      ];

      const report = reconcileStatement(transformedRows, rawRows);

      assert.equal(report.status, "RECONCILED");
      assert.equal(report.reconciled, true);
      assert.equal(report.discrepancy, 0);
      assert.ok(report.message.includes("Statement balances reconcile mathematically"));
    });

    it("detects and flags statement balance discrepancy without blocking", () => {
      // Opening: 10,000 | Debits: 2,000 | Credits: 0 | Expected Closing: 8,000 | Actual Closing: 7,500
      // Discrepancy: 500.00
      const rawRows: Record<string, string>[] = [
        { Date: "2026-10-01", Narration: "Opening Balance", Amount: "10000.00" },
        { Date: "2026-10-02", Narration: "Shopping", Debit: "2000.00", Credit: "" },
        { Date: "2026-10-03", Narration: "Closing Balance", Amount: "7500.00" },
      ];

      const transformedRows = [
        { status: "EXCLUDED_NON_EXPENSE" as const, reasons: ["Opening balance"], mapped: { title: "Opening Balance", amount: 10000, transactionDate: "2026-10-01" } },
        { status: "READY" as const, reasons: [], mapped: { title: "Shopping", amount: 2000, transactionDate: "2026-10-02" } },
        { status: "EXCLUDED_NON_EXPENSE" as const, reasons: ["Closing balance"], mapped: { title: "Closing Balance", amount: 7500, transactionDate: "2026-10-03" } },
      ];

      const report = reconcileStatement(transformedRows, rawRows);

      assert.equal(report.status, "MISMATCH");
      assert.equal(report.reconciled, false);
      assert.equal(report.discrepancy, 500);
      assert.ok(report.message.includes("Reconciliation discrepancy detected"));
    });

    it("returns NOT_AVAILABLE when opening or closing balance cannot be extracted", () => {
      const rawRows: Record<string, string>[] = [
        { Date: "2026-10-01", Narration: "Restaurant", Debit: "50.00" },
        { Date: "2026-10-02", Narration: "Pharmacy", Debit: "20.00" },
      ];

      const transformedRows = [
        { status: "READY" as const, reasons: [], mapped: { title: "Restaurant", amount: 50, transactionDate: "2026-10-01" } },
        { status: "READY" as const, reasons: [], mapped: { title: "Pharmacy", amount: 20, transactionDate: "2026-10-02" } },
      ];

      const report = reconcileStatement(transformedRows, rawRows);

      assert.equal(report.status, "NOT_AVAILABLE");
      assert.equal(report.reconciled, null);
      assert.equal(report.openingBalance, null);
      assert.equal(report.closingBalance, null);
      assert.ok(report.message.includes("does not contain complete opening and closing balance"));
    });
  });

  // =========================================================================
  // 2. Spending Tier & Priority Normalization & Integrity
  // =========================================================================
  describe("2. Unclassified Spending Tier & Priority Integrity", () => {
    it("normalizePriority defaults missing, null, or undefined to UNCLASSIFIED", () => {
      assert.equal(normalizePriority(undefined), Priority.UNCLASSIFIED);
      assert.equal(normalizePriority(null), Priority.UNCLASSIFIED);
      assert.equal(normalizePriority(""), Priority.UNCLASSIFIED);
      assert.equal(normalizePriority("   "), Priority.UNCLASSIFIED);
    });

    it("normalizePriority defaults unrecognized strings to UNCLASSIFIED (never silent GOOD_TO_HAVE)", () => {
      assert.equal(normalizePriority("UNRECOGNIZED"), Priority.UNCLASSIFIED);
      assert.equal(normalizePriority("UNKNOWN"), Priority.UNCLASSIFIED);
      assert.equal(normalizePriority("random_priority"), Priority.UNCLASSIFIED);
      assert.equal(normalizePriority("N/A"), Priority.UNCLASSIFIED);
    });

    it("normalizePriority correctly preserves recognized Priority enums", () => {
      assert.equal(normalizePriority("ESSENTIAL"), Priority.ESSENTIAL);
      assert.equal(normalizePriority("essential"), Priority.ESSENTIAL);
      assert.equal(normalizePriority("GOOD_TO_HAVE"), Priority.GOOD_TO_HAVE);
      assert.equal(normalizePriority("good to have"), Priority.GOOD_TO_HAVE);
      assert.equal(normalizePriority("LUXURY"), Priority.LUXURY);
      assert.equal(normalizePriority("luxury"), Priority.LUXURY);
      assert.equal(normalizePriority("UNCLASSIFIED"), Priority.UNCLASSIFIED);
      assert.equal(normalizePriority("unclassified"), Priority.UNCLASSIFIED);
    });

    it("createTransactionSchema makes priority optional and defaults to UNCLASSIFIED", () => {
      const parsed = createTransactionSchema.parse({
        title: "Coffee",
        amount: 5.5,
        category: "FOOD",
        date: "2026-10-15T10:00:00.000Z",
      });

      assert.equal(parsed.priority, Priority.UNCLASSIFIED);
    });

    it("createTransactionSchema accepts explicit UNCLASSIFIED priority", () => {
      const parsed = createTransactionSchema.parse({
        title: "Hardware Store",
        amount: 85.0,
        category: "OTHER",
        date: "2026-10-15T10:00:00.000Z",
        priority: Priority.UNCLASSIFIED,
      });

      assert.equal(parsed.priority, Priority.UNCLASSIFIED);
    });
  });

  // =========================================================================
  // 3. Row Transformation & Column Matching Reliability
  // =========================================================================
  describe("3. Row Transformation & Column Matching Reliability", () => {
    it("defaults transformed row priority to UNCLASSIFIED when priorityColumn is unmapped", () => {
      const row = { Date: "2026-10-15", Description: "Supermarket", Amount: "45.00" };
      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Description",
        amountMode: "single_amount",
        amountColumn: "Amount",
      };

      const result = transformRow(row, mapping, { amountConvention: "all_positive" }, 1);
      assert.equal(result.status, "READY");
      assert.equal(result.mapped.priority, Priority.UNCLASSIFIED);
    });

    it("maps and normalizes explicit priority column values when mapped", () => {
      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Description",
        amountMode: "single_amount",
        amountColumn: "Amount",
        priorityColumn: "Tier",
      };

      // Essential
      const row1 = { Date: "2026-10-15", Description: "Rent", Amount: "1500.00", Tier: "Essential" };
      const res1 = transformRow(row1, mapping, { amountConvention: "all_positive" }, 1);
      assert.equal(res1.mapped.priority, Priority.ESSENTIAL);

      // Luxury
      const row2 = { Date: "2026-10-15", Description: "Spa", Amount: "250.00", Tier: "LUXURY" };
      const res2 = transformRow(row2, mapping, { amountConvention: "all_positive" }, 2);
      assert.equal(res2.mapped.priority, Priority.LUXURY);

      // Unrecognized falls back to UNCLASSIFIED
      const row3 = { Date: "2026-10-15", Description: "Gadget", Amount: "99.00", Tier: "Pending Review" };
      const res3 = transformRow(row3, mapping, { amountConvention: "all_positive" }, 3);
      assert.equal(res3.mapped.priority, Priority.UNCLASSIFIED);
    });

    it("suggestColumnMapping auto-detects priority aliases (tier, spending tier, priority)", () => {
      const headers = ["Date", "Narration", "Withdrawal", "Deposit", "Spending Tier", "Balance"];
      const suggested = suggestColumnMapping(headers);

      assert.equal(suggested.priorityColumn, "Spending Tier");
      assert.equal(suggested.debitColumn, "Withdrawal");
      assert.equal(suggested.creditColumn, "Deposit");
      // Critical check: "Balance" is NOT mistakenly chosen as amount or debit column
      assert.notEqual(suggested.amountColumn, "Balance");
      assert.notEqual(suggested.debitColumn, "Balance");
    });

    it("excludes running balance columns from amount auto-mapping", () => {
      const headers = ["Txn Date", "Details", "Amount", "Closing Balance"];
      const suggested = suggestColumnMapping(headers);

      assert.equal(suggested.amountColumn, "Amount");
      assert.notEqual(suggested.amountColumn, "Closing Balance");
    });
  });

  // =========================================================================
  // 4. Parsing Formats: Textual Dates and Indian Numbering
  // =========================================================================
  describe("4. Robust Date and Amount Parsing", () => {
    it("correctly parses textual month dates (e.g. 15-Oct-2026, Oct 15, 2026)", () => {
      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Desc",
        amountMode: "single_amount",
        amountColumn: "Amt",
      };

      const formats = [
        { Date: "15-Oct-2026", expectedYear: 2026, expectedMonth: 10, expectedDay: 15 },
        { Date: "Oct 15, 2026", expectedYear: 2026, expectedMonth: 10, expectedDay: 15 },
        { Date: "15/Oct/2026", expectedYear: 2026, expectedMonth: 10, expectedDay: 15 },
        { Date: "01-Nov-2026", expectedYear: 2026, expectedMonth: 11, expectedDay: 1 },
      ];

      for (const fmt of formats) {
        const row = { Date: fmt.Date, Desc: "Test", Amt: "100.00" };
        const res = transformRow(row, mapping, { amountConvention: "all_positive" }, 1);
        assert.equal(res.status, "READY");
        assert.ok(res.mapped.transactionDate);
        const parsedDate = new Date(res.mapped.transactionDate);
        assert.equal(parsedDate.getUTCFullYear(), fmt.expectedYear);
        assert.equal(parsedDate.getUTCMonth() + 1, fmt.expectedMonth);
        assert.equal(parsedDate.getUTCDate(), fmt.expectedDay);
      }
    });

    it("correctly parses Indian numeric formats (e.g. 1,23,456.78, ₹45,000)", () => {
      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Desc",
        amountMode: "single_amount",
        amountColumn: "Amt",
      };

      const testCases = [
        { input: "1,23,456.78", expected: 123456.78 },
        { input: "₹12,500.50", expected: 12500.50 },
        { input: "45,000", expected: 45000.00 },
        { input: "$ 1,500.25", expected: 1500.25 },
      ];

      for (const tc of testCases) {
        const row = { Date: "2026-10-15", Desc: "Indian Rupee Expense", Amt: tc.input };
        const res = transformRow(row, mapping, { amountConvention: "all_positive" }, 1);
        assert.equal(res.status, "READY");
        assert.equal(res.mapped.amount, tc.expected);
      }
    });
  });

  // =========================================================================
  // 5. End-to-End Import Integration with UNCLASSIFIED Priority & DB Verification
  // =========================================================================
  describe("5. End-to-End Import Integration with UNCLASSIFIED Tier", () => {
    it("persists unclassified expenses into DB without defaulting to GOOD_TO_HAVE", async () => {
      const csvData = [
        "Date,Description,Debit,Credit,Balance",
        "2026-10-01,Opening Balance,,,10000.00",
        "2026-10-02,Supermarket Groceries,650.00,,9350.00",
        "2026-10-03,Fuel Station,450.00,,8900.00",
        "2026-10-04,Salary Deposit,,25000.00,33900.00",
        "2026-10-05,Closing Balance,,,33900.00",
      ].join("\n");

      // 1. Upload & parse
      const meta = await importService.parseUploadedFile(
        "1",
        Buffer.from(csvData, "utf8"),
        "reconciliation_unclassified_test.csv"
      );

      // 2. Generate Preview
      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Description",
        amountMode: "debit_credit",
        debitColumn: "Debit",
        creditColumn: "Credit",
      };

      const preview = await importService.generateImportPreview("1", meta.fileId, mapping, {
        dateFormat: "YYYY-MM-DD",
      });

      // Verify reconciliation is attached and reports RECONCILED
      // Opening: 10,000 - Debits: 1,100 + Credits: 25,000 = 33,900 Closing
      assert.ok(preview.reconciliation);
      assert.equal(preview.reconciliation?.status, "RECONCILED");
      assert.equal(preview.reconciliation?.openingBalance, 10000);
      assert.equal(preview.reconciliation?.closingBalance, 33900);
      assert.equal(preview.reconciliation?.totalDebits, 1100);
      assert.equal(preview.reconciliation?.totalCredits, 25000);
      assert.equal(preview.reconciliation?.discrepancy, 0);

      // Verify rows have UNCLASSIFIED priority in preview
      const readyRows = preview.sampleRows.filter((r) => r.status === "READY");
      assert.equal(readyRows.length, 2);
      for (const row of readyRows) {
        assert.equal(row.mapped.priority, Priority.UNCLASSIFIED);
      }

      // 3. Confirm & Commit Import
      const commitResult = await importService.confirmAndCommitImport("1", {
        fileId: meta.fileId,
        mapping,
      });

      assert.equal(commitResult.imported, 2);
      assert.equal(commitResult.excludedNonExpense, 3); // Opening balance, closing balance, salary credit
      assert.equal(commitResult.importedIds.length, 2);

      // 4. Verify in Database that Priority is truly UNCLASSIFIED, not GOOD_TO_HAVE
      for (const idStr of commitResult.importedIds) {
        const tx = await transactionRepository.findTransactionById(Number(idStr));
        assert.ok(tx);
        assert.equal(
          tx?.priority,
          Priority.UNCLASSIFIED,
          `Transaction ${tx?.id} must have Priority.UNCLASSIFIED but was ${tx?.priority}`
        );
        assert.equal(tx?.source, TransactionSource.CSV_IMPORT);
      }

      // 5. Clean up created test transactions
      for (const idStr of commitResult.importedIds) {
        await transactionRepository.deleteTransaction(Number(idStr));
      }
    });

    it("persists explicit priority values (ESSENTIAL, LUXURY) when priority column is mapped", async () => {
      const csvData = [
        "Date,Description,Debit,Credit,Spending Tier",
        "2026-10-02,Emergency Pharmacy,350.00,,ESSENTIAL",
        "2026-10-03,Designer Sunglasses,1200.00,,LUXURY",
      ].join("\n");

      const meta = await importService.parseUploadedFile(
        "1",
        Buffer.from(csvData, "utf8"),
        "explicit_priority_test.csv"
      );

      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Description",
        amountMode: "debit_credit",
        debitColumn: "Debit",
        creditColumn: "Credit",
        priorityColumn: "Spending Tier",
      };

      const preview = await importService.generateImportPreview("1", meta.fileId, mapping, {
        dateFormat: "YYYY-MM-DD",
      });

      assert.equal(preview.summary.validExpenseCount, 2);
      const readyRows = preview.sampleRows.filter((r) => r.status === "READY");
      assert.equal(readyRows[0].mapped.priority, Priority.ESSENTIAL);
      assert.equal(readyRows[1].mapped.priority, Priority.LUXURY);

      const commitResult = await importService.confirmAndCommitImport("1", {
        fileId: meta.fileId,
        mapping,
      });

      assert.equal(commitResult.imported, 2);

      const txPharmacy = await transactionRepository.findTransactionById(Number(commitResult.importedIds[0]));
      const txLuxury = await transactionRepository.findTransactionById(Number(commitResult.importedIds[1]));

      assert.equal(txPharmacy?.priority, Priority.ESSENTIAL);
      assert.equal(txLuxury?.priority, Priority.LUXURY);

      // Clean up
      for (const idStr of commitResult.importedIds) {
        await transactionRepository.deleteTransaction(Number(idStr));
      }
    });
  });
});

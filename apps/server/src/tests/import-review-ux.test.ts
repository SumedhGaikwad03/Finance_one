import "dotenv/config";
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-jwt-secret-for-testing-purposes";
}
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { Category, Priority } from "../generated/prisma/enums";
import {
  importService,
  importSessionStore,
  ColumnMapping,
} from "../import";
import {
  RowCorrectionSchema,
  PreviewRequestSchema,
  ConfirmRequestSchema,
} from "../import/controllers/import.controller";
import * as transactionRepository from "../repositories/transaction.repository";
import { ForbiddenError } from "../error/AppError";
import prisma from "../lib/prisma";

let testUserId: number;
let otherUserId: number;

describe("Workstream 06: Import Review UX & Row Normalization Test Suite", () => {
  before(async () => {
    const user1 = await prisma.user.create({
      data: {
        name: "Review UX Primary User",
        email: `review.ux.primary.${Date.now()}@internal.test`,
        passwordHash: "dummyhash123",
      },
    });
    testUserId = user1.id;

    const user2 = await prisma.user.create({
      data: {
        name: "Review UX Other User",
        email: `review.ux.other.${Date.now()}@internal.test`,
        passwordHash: "dummyhash123",
      },
    });
    otherUserId = user2.id;
  });

  after(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
    if (otherUserId) {
      await prisma.user.delete({ where: { id: otherUserId } });
    }
  });

  beforeEach(async () => {
    importSessionStore.clearAllForTesting();
    if (testUserId) {
      await prisma.transaction.deleteMany({
        where: {
          userId: testUserId,
        },
      });
    }
    if (otherUserId) {
      await prisma.transaction.deleteMany({
        where: {
          userId: otherUserId,
        },
      });
    }
  });

  // =========================================================================
  // 1. Row Classification & Distinction in Preview
  // =========================================================================
  describe("1. Row Status Classification & Multi-Metric Distinction", () => {
    it("distinguishes ready, unclassified, invalid, credit, and balance summary rows", async () => {
      const csv = `Date,Description,Debit,Credit,Ref,Category,Tier
2026-10-01,Starbucks Reserve Coffee,350.00,,TXN101,FOOD_DINING,ESSENTIAL
2026-10-02,UNKNOWN VENDOR 9982,1200.00,,TXN102,,
2026-10-03,,abc,,TXN103,,
2026-10-04,Salary Credit,,75000.00,TXN104,,
2026-10-05,Opening Balance Summary,,,TXN105,,`;

      const meta = await importService.parseUploadedFile(
        String(testUserId),
        Buffer.from(csv, "utf8"),
        "multi_type_statement.csv"
      );

      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Description",
        amountMode: "debit_credit",
        debitColumn: "Debit",
        creditColumn: "Credit",
        externalIdColumn: "Ref",
        categoryColumn: "Category",
        priorityColumn: "Tier",
      };

      const preview = await importService.generateImportPreview(
        String(testUserId),
        meta.fileId,
        mapping
      );

      // Verify overall summary counts
      assert.equal(preview.summary.totalRows, 5);
      assert.equal(preview.summary.validExpenseCount, 2);
      assert.equal(preview.summary.invalidRowCount, 1);
      assert.equal(preview.summary.excludedNonExpenseCount, 2);
      assert.equal(preview.summary.unclassifiedCount, 1, "Should count 1 unclassified expense row");
      assert.equal(preview.summary.needsCorrectionCount, 1, "Should count 1 invalid row needing correction");

      // Verify monetary totals
      assert.equal(preview.summary.validExpenseTotal, 1550.00); // 350 + 1200
      assert.equal(preview.summary.excludedNonExpenseTotal, 75000.00); // Credit only (opening balance had no amount)

      // Row 1: Ready and classified
      const row1 = preview.sampleRows[0];
      assert.equal(row1.status, "READY");
      assert.equal(row1.mapped.title, "Starbucks Reserve Coffee");
      assert.equal(row1.mapped.amount, 350.00);
      assert.equal(row1.isUnclassified, false);

      // Row 2: Ready but unclassified (unknown vendor)
      const row2 = preview.sampleRows[1];
      assert.equal(row2.status, "READY");
      assert.equal(row2.mapped.title, "UNKNOWN VENDOR 9982");
      assert.equal(row2.mapped.amount, 1200.00);
      assert.equal(row2.isUnclassified, true);
      assert.equal(row2.needsReview, true);
      assert.equal(row2.mapped.priority, Priority.UNCLASSIFIED);

      // Row 3: Invalid (missing date/amount)
      const row3 = preview.sampleRows[2];
      assert.equal(row3.status, "INVALID");
      assert.equal(row3.needsReview, true);
      assert.ok(row3.reasons.length > 0);
      assert.ok(
        row3.reasons.some((r) => r.includes("amount") || r.includes("description") || r.includes("date")),
        "Reason should be clear and descriptive"
      );

      // Row 4: Credit deposit (excluded non-expense)
      const row4 = preview.sampleRows[3];
      assert.equal(row4.status, "EXCLUDED_NON_EXPENSE");
      assert.equal(row4.mapped.amount, 75000.00);
      assert.ok(row4.reasons.some((r) => r.includes("Credit / deposit") || r.includes("non-expense")));

      // Row 5: Balance summary (excluded non-expense)
      const row5 = preview.sampleRows[4];
      assert.equal(row5.status, "EXCLUDED_NON_EXPENSE");
      assert.ok(row5.reasons.some((r) => r.includes("balance") || r.includes("non-expense")));
    });
  });

  // =========================================================================
  // 2. Unclassified Expenses Eligibility & Defaulting Rules
  // =========================================================================
  describe("2. Unclassified Expense Eligibility", () => {
    it("allows valid expenses with unclassified tiers to be imported without blocking", async () => {
      const csv = `Date,Description,Amount\n2026-10-06,Mystery Store Purchases,-450.00`;
      const meta = await importService.parseUploadedFile(
        String(testUserId),
        Buffer.from(csv, "utf8"),
        "unclassified.csv"
      );

      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Description",
        amountMode: "single_amount",
        amountColumn: "Amount",
      };

      const preview = await importService.generateImportPreview(
        String(testUserId),
        meta.fileId,
        mapping
      );

      assert.equal(preview.summary.validExpenseCount, 1);
      assert.equal(preview.sampleRows[0].status, "READY");
      assert.equal(preview.sampleRows[0].isUnclassified, true);
      assert.equal(preview.sampleRows[0].mapped.priority, Priority.UNCLASSIFIED);

      // Confirm import
      const result = await importService.confirmAndCommitImport(String(testUserId), {
        fileId: meta.fileId,
        mapping,
      });

      assert.equal(result.imported, 1);
      const savedTxn = await transactionRepository.findTransactionById(Number(result.importedIds[0]));
      assert.ok(savedTxn);
      assert.equal(savedTxn.priority, Priority.UNCLASSIFIED);
      assert.notEqual(savedTxn.priority, Priority.ESSENTIAL, "Must not silently default to ESSENTIAL");
      assert.notEqual(savedTxn.priority, Priority.GOOD_TO_HAVE, "Must not silently default to GOOD_TO_HAVE");
    });
  });

  // =========================================================================
  // 3. Independent Category & Spending Tier Corrections
  // =========================================================================
  describe("3. Independent Category and Spending Tier Corrections", () => {
    it("preserves separation between category and spending tier when correcting", async () => {
      const csv = `Date,Description,Amount\n2026-10-07,Local Electronics,-2500.00`;
      const meta = await importService.parseUploadedFile(
        String(testUserId),
        Buffer.from(csv, "utf8"),
        "electronics.csv"
      );

      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Description",
        amountMode: "single_amount",
        amountColumn: "Amount",
      };

      // Case A: User corrects only spending tier to GOOD_TO_HAVE
      const previewWithTier = await importService.generateImportPreview(
        String(testUserId),
        meta.fileId,
        mapping,
        undefined,
        {
          "1": {
            priority: Priority.GOOD_TO_HAVE,
          },
        }
      );

      const rowA = previewWithTier.sampleRows[0];
      assert.equal(rowA.mapped.priority, Priority.GOOD_TO_HAVE);
      assert.equal(rowA.userCorrected, true);
      // Category must not be altered or inferred
      assert.notEqual(rowA.mapped.category, undefined);

      // Case B: User corrects only category to FOOD
      const previewWithCat = await importService.generateImportPreview(
        String(testUserId),
        meta.fileId,
        mapping,
        undefined,
        {
          "1": {
            category: Category.FOOD,
          },
        }
      );

      const rowB = previewWithCat.sampleRows[0];
      assert.equal(rowB.mapped.category, Category.FOOD);
      // Spending tier must NOT be automatically inferred from category!
      assert.equal(rowB.mapped.priority, Priority.UNCLASSIFIED);

      // Case C: Confirm with explicit category and priority corrections
      const result = await importService.confirmAndCommitImport(String(testUserId), {
        fileId: meta.fileId,
        mapping,
        rowCorrections: {
          "1": {
            category: Category.SHOPPING,
            priority: Priority.LUXURY,
            title: "Upgraded SSD Drive",
            notes: "Work equipment",
          },
        },
      });

      assert.equal(result.imported, 1);
      const saved = await transactionRepository.findTransactionById(Number(result.importedIds[0]));
      assert.ok(saved);
      assert.equal(saved.title, "Upgraded SSD Drive");
      assert.equal(saved.category, Category.SHOPPING);
      assert.equal(saved.priority, Priority.LUXURY);
      assert.equal(saved.notes, "Work equipment");
      assert.equal(
        (saved.sourceMetadata as any)?.userCorrected,
        true,
        "Should flag sourceMetadata.userCorrected as true"
      );
    });
  });

  // =========================================================================
  // 4. Server-Side Protection: Credits & Non-Expenses Cannot Be Converted
  // =========================================================================
  describe("4. Non-Expense Integrity & Protection", () => {
    it("ensures credits and balance summaries cannot be imported as expenses even if corrections sent", async () => {
      const csv = `Date,Description,Debit,Credit
2026-10-08,Annual Bonus,,100000.00
2026-10-08,Fuel Station,1500.00,`;

      const meta = await importService.parseUploadedFile(
        String(testUserId),
        Buffer.from(csv, "utf8"),
        "bonus.csv"
      );

      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Description",
        amountMode: "debit_credit",
        debitColumn: "Debit",
        creditColumn: "Credit",
      };

      // Attempt to maliciously or accidentally submit corrections for row 1 (the bonus credit)
      const preview = await importService.generateImportPreview(
        String(testUserId),
        meta.fileId,
        mapping,
        undefined,
        {
          "1": {
            category: Category.OTHER,
            priority: Priority.ESSENTIAL,
            title: "Bonus converted to expense",
          },
        }
      );

      assert.equal(preview.sampleRows[0].status, "EXCLUDED_NON_EXPENSE");
      assert.equal(preview.summary.validExpenseCount, 1);
      assert.equal(preview.summary.validExpenseTotal, 1500.00);
      assert.equal(preview.summary.excludedNonExpenseTotal, 100000.00);

      // Confirm import with attempted credit correction
      const result = await importService.confirmAndCommitImport(String(testUserId), {
        fileId: meta.fileId,
        mapping,
        rowCorrections: {
          "1": {
            category: Category.OTHER,
            priority: Priority.ESSENTIAL,
          },
        },
      });

      // Only the fuel debit should be imported
      assert.equal(result.imported, 1);
      assert.equal(result.excludedNonExpense, 1);
      const saved = await transactionRepository.findTransactionById(Number(result.importedIds[0]));
      assert.ok(saved);
      assert.equal(saved.amount.toNumber(), 1500.00);
      assert.equal(saved.title, "Fuel Station");
    });
  });

  // =========================================================================
  // 5. Server-Side Schema Validation for Row Corrections
  // =========================================================================
  describe("5. Server-Side Schema Validation", () => {
    it("rejects invalid category enum values", () => {
      assert.throws(
        () => {
          RowCorrectionSchema.parse({
            category: "NON_EXISTENT_CATEGORY",
          });
        },
        (err: any) => err.issues?.[0]?.message === "Invalid category"
      );
    });

    it("rejects invalid priority/tier enum values", () => {
      assert.throws(
        () => {
          RowCorrectionSchema.parse({
            priority: "SUPER_IMPORTANT",
          });
        },
        (err: any) => err.issues?.[0]?.message === "Invalid spending tier"
      );
    });

    it("rejects invalid date formats in row corrections", () => {
      assert.throws(
        () => {
          RowCorrectionSchema.parse({
            transactionDate: "not-a-valid-date-31-99",
          });
        },
        (err: any) => err.issues?.[0]?.message === "Invalid date format"
      );
    });

    it("rejects empty titles", () => {
      assert.throws(
        () => {
          RowCorrectionSchema.parse({
            title: "   ",
          });
        },
        (err: any) => err.issues?.[0]?.message === "Title cannot be empty"
      );
    });

    it("validates PreviewRequestSchema and ConfirmRequestSchema with rowCorrections", () => {
      const validPayload = {
        fileId: "file_test_123",
        mapping: {
          descriptionColumn: "Desc",
          amountMode: "single_amount" as const,
          amountColumn: "Amt",
          dateColumn: "Dt",
        },
        rowCorrections: {
          "1": {
            category: Category.FOOD,
            priority: Priority.GOOD_TO_HAVE,
            title: "Dinner with team",
          },
        },
      };

      const parsedPreview = PreviewRequestSchema.parse(validPayload);
      assert.equal(parsedPreview.rowCorrections?.["1"]?.category, Category.FOOD);

      const parsedConfirm = ConfirmRequestSchema.parse(validPayload);
      assert.equal(parsedConfirm.rowCorrections?.["1"]?.priority, Priority.GOOD_TO_HAVE);
    });
  });

  // =========================================================================
  // 6. Explicit Confirmation: No Persistence Before Confirmation
  // =========================================================================
  describe("6. Explicit Confirmation & Absence of Auto-Persistence", () => {
    it("never writes transactions to the database during upload or preview", async () => {
      const csv = `Date,Description,Amount\n2026-10-09,Pre-confirmation Expense,-890.00`;

      // 1. Upload
      const meta = await importService.parseUploadedFile(
        String(testUserId),
        Buffer.from(csv, "utf8"),
        "no_auto_persist.csv"
      );

      // Verify DB count
      let dbCount = await prisma.transaction.count({ where: { userId: testUserId } });
      assert.equal(dbCount, 0, "No records should be persisted after upload");

      // 2. Preview with row corrections
      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Description",
        amountMode: "single_amount",
        amountColumn: "Amount",
      };

      await importService.generateImportPreview(
        String(testUserId),
        meta.fileId,
        mapping,
        undefined,
        {
          "1": {
            category: Category.SHOPPING,
            priority: Priority.GOOD_TO_HAVE,
          },
        }
      );

      // Verify DB count
      dbCount = await prisma.transaction.count({ where: { userId: testUserId } });
      assert.equal(dbCount, 0, "No records should be persisted after preview generation");

      // 3. Explicit confirmation
      const result = await importService.confirmAndCommitImport(String(testUserId), {
        fileId: meta.fileId,
        mapping,
      });

      assert.equal(result.imported, 1);
      dbCount = await prisma.transaction.count({ where: { userId: testUserId } });
      assert.equal(dbCount, 1, "Record should only be persisted after explicit confirmation");
    });
  });

  // =========================================================================
  // 7. Preservation of User-Confirmed Classifications on Reimport
  // =========================================================================
  describe("7. Reimport & Duplicate Preservation", () => {
    it("preserves prior user-confirmed classifications when re-importing duplicate records", async () => {
      const refId = `REIMPORT_TEST_${Date.now()}`;
      const csv = `Date,Description,Amount,Ref\n2026-10-10,Custom Gym Membership,-3000.00,${refId}`;

      const meta1 = await importService.parseUploadedFile(
        String(testUserId),
        Buffer.from(csv, "utf8"),
        "gym_initial.csv"
      );

      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Description",
        amountMode: "single_amount",
        amountColumn: "Amount",
        externalIdColumn: "Ref",
      };

      // Import with user-corrected category and priority
      const confirm1 = await importService.confirmAndCommitImport(String(testUserId), {
        fileId: meta1.fileId,
        mapping,
        rowCorrections: {
          "1": {
            category: Category.HEALTH,
            priority: Priority.ESSENTIAL,
          },
        },
      });
      assert.equal(confirm1.imported, 1);

      // Re-import the exact same file
      const meta2 = await importService.parseUploadedFile(
        String(testUserId),
        Buffer.from(csv, "utf8"),
        "gym_reimport.csv"
      );

      const preview2 = await importService.generateImportPreview(
        String(testUserId),
        meta2.fileId,
        mapping
      );

      assert.equal(preview2.summary.confirmedDuplicateCount, 1);
      assert.equal(preview2.summary.validExpenseCount, 0);

      const dupRow = preview2.sampleRows[0];
      assert.equal(dupRow.status, "CONFIRMED_DUPLICATE");
      assert.equal(dupRow.existingCategory, Category.HEALTH);
      assert.equal(dupRow.existingPriority, Priority.ESSENTIAL);
    });
  });

  // =========================================================================
  // 8. User Authorization & Session Isolation
  // =========================================================================
  describe("8. User Authorization & Session Ownership", () => {
    it("enforces user isolation: other users cannot preview or confirm another user's session", async () => {
      const csv = `Date,Description,Amount\n2026-10-11,Private Purchase,-999.00`;
      const meta = await importService.parseUploadedFile(
        String(testUserId),
        Buffer.from(csv, "utf8"),
        "user1_private.csv"
      );

      const mapping: ColumnMapping = {
        dateColumn: "Date",
        descriptionColumn: "Description",
        amountMode: "single_amount",
        amountColumn: "Amount",
      };

      // Other user tries to preview User 1's fileId
      await assert.rejects(
        async () => {
          await importService.generateImportPreview(String(otherUserId), meta.fileId, mapping);
        },
        (err: any) => err instanceof ForbiddenError
      );

      // Other user tries to confirm User 1's fileId
      await assert.rejects(
        async () => {
          await importService.confirmAndCommitImport(String(otherUserId), {
            fileId: meta.fileId,
            mapping,
          });
        },
        (err: any) => err instanceof ForbiddenError
      );
    });
  });
});

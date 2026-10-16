import { Category, Priority, TransactionSource } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import * as transactionRepository from "../../repositories/transaction.repository";
import {
  detectDuplicate,
  ingestTransactionBatch,
  normalizeTransactionInput,
  validateTransactionCandidate,
} from "../../ingestion";
import {
  IngestionResult,
  IngestionSourceInput,
} from "../../ingestion/types/ingestion.types";
import { suggestColumnMapping } from "../mapping/column-matcher";
import { transformRow, TransformedRowResult } from "../mapping/row-transformer";
import { reconcileStatement } from "../reconciliation/statement-reconciler";
import { parseCsvBuffer } from "../parsers/csv.parser";
import { detectAndValidateFileType } from "../parsers/file-detector";
import { parseExcelWorksheet } from "../parsers/xlsx.parser";
import { parsePdfBuffer } from "../parsers/pdf.parser";
import { importSessionStore } from "../session/import-session.store";
import {
  ColumnMapping,
  ConfirmImportPayload,
  FileMetadata,
  ImportExecutionResult,
  ImportOptions,
  ImportPreviewResult,
  ImportPreviewSummary,
  PreviewRowItem,
  RawParsedSheet,
  RowCorrection,
  SupportedFileType,
} from "../types/import.types";

export class ImportService {
  /**
   * Parses an uploaded CSV or XLSX file and initializes an in-memory import session.
   */
  public async parseUploadedFile(
    userId: string,
    buffer: Buffer,
    originalFilename: string,
    targetWorksheet?: string
  ): Promise<FileMetadata> {
    const fileType: SupportedFileType = detectAndValidateFileType(buffer, originalFilename);

    let parsedSheet: RawParsedSheet;
    let worksheets: string[] = [];
    let activeWorksheet = "Sheet1";

    if (fileType === "csv") {
      parsedSheet = parseCsvBuffer(buffer);
      worksheets = ["CSV"];
      activeWorksheet = "CSV";
    } else if (fileType === "pdf") {
      const pdfResult = await parsePdfBuffer(buffer);
      parsedSheet = pdfResult.parsedSheet;
      worksheets = pdfResult.pages;
      activeWorksheet = pdfResult.pages[0] || "All Pages";
    } else {
      const excelResult = await parseExcelWorksheet(buffer, targetWorksheet);
      parsedSheet = excelResult.parsedSheet;
      worksheets = excelResult.worksheets;
      activeWorksheet = excelResult.sheetName;
    }

    const suggestedMapping = suggestColumnMapping(parsedSheet.headers);

    // Keep buffer in memory for Excel if multiple sheets exist so user can switch worksheets
    const keepBuffer = fileType === "xlsx" && worksheets.length > 1 ? buffer : undefined;

    const session = importSessionStore.createSession(
      userId,
      originalFilename,
      fileType,
      buffer.length,
      worksheets,
      activeWorksheet,
      parsedSheet,
      suggestedMapping,
      keepBuffer
    );

    // Provide preview rows (first 10 rows)
    const previewRows = parsedSheet.rows.slice(0, 10);

    return {
      fileId: session.fileId,
      fileName: originalFilename,
      fileType,
      fileSize: buffer.length,
      worksheets,
      activeWorksheet,
      totalRows: parsedSheet.totalRows,
      headers: parsedSheet.headers,
      previewRows,
      suggestedMapping,
      createdAt: session.createdAt,
    };
  }

  /**
   * Switches active worksheet in an existing multi-sheet Excel session.
   */
  public async switchWorksheet(
    userId: string,
    fileId: string,
    worksheetName: string
  ): Promise<FileMetadata> {
    const session = importSessionStore.getSession(fileId, userId);

    if (session.fileType !== "xlsx" || !session.rawBuffer) {
      throw new Error("Worksheet switching is only available for multi-sheet Excel files.");
    }

    const excelResult = await parseExcelWorksheet(session.rawBuffer, worksheetName);
    const suggestedMapping = suggestColumnMapping(excelResult.parsedSheet.headers);

    importSessionStore.updateSessionSheet(
      fileId,
      userId,
      excelResult.sheetName,
      excelResult.parsedSheet,
      suggestedMapping
    );

    return {
      fileId: session.fileId,
      fileName: session.fileName,
      fileType: session.fileType,
      fileSize: session.fileSize,
      worksheets: session.worksheets,
      activeWorksheet: excelResult.sheetName,
      totalRows: excelResult.parsedSheet.totalRows,
      headers: excelResult.parsedSheet.headers,
      previewRows: excelResult.parsedSheet.rows.slice(0, 10),
      suggestedMapping,
      createdAt: session.createdAt,
    };
  }

  /**
   * Generates a comprehensive validation and duplicate preview for the mapped file.
   */
  /**
   * Generates a comprehensive validation and duplicate preview for the mapped file,
   * supporting safe row-level corrections before confirmation.
   */
  public async generateImportPreview(
    userId: string,
    fileId: string,
    mapping: ColumnMapping,
    options: ImportOptions = {},
    rowCorrections?: Record<string | number, RowCorrection>
  ): Promise<ImportPreviewResult> {
    const session = importSessionStore.getSession(fileId, userId);
    if (rowCorrections && Object.keys(rowCorrections).length > 0) {
      importSessionStore.updateRowCorrections(fileId, userId, rowCorrections);
    }

    const { rows } = session.parsedSheet;
    const numericUserId = Number(userId);

    const seenExternalIdsInFile = new Set<string>();
    const seenContentInFile = new Set<string>();

    const sampleRows: PreviewRowItem[] = [];
    const allTransformedResults: TransformedRowResult[] = [];

    let validExpenseCount = 0;
    let validExpenseTotal = 0;
    let confirmedDuplicateCount = 0;
    let potentialDuplicateCount = 0;
    let duplicateInFileCount = 0;
    let invalidRowCount = 0;
    let excludedNonExpenseCount = 0;
    let excludedNonExpenseTotal = 0;
    let unclassifiedCount = 0;
    let potentialDuplicatesTotal = 0;

    const source =
      session.fileType === "csv"
        ? TransactionSource.CSV_IMPORT
        : TransactionSource.BANK_STATEMENT;

    for (let i = 0; i < rows.length; i++) {
      const rowIndex = i + 1;
      const rawRow = rows[i];

      const result = transformRow(rawRow, mapping, options, rowIndex, session.fileName);
      allTransformedResults.push(result);

      // Check for user-submitted or session-stored corrections for this row
      const correction =
        rowCorrections?.[rowIndex] ||
        rowCorrections?.[String(rowIndex)] ||
        session.rowCorrections?.get(rowIndex);

      // 1. Financial Eligibility Rule: Non-expense records (credits, transfers, balances)
      // must NEVER be converted to expenses even if client supplies corrections.
      if (result.status === "EXCLUDED_NON_EXPENSE") {
        excludedNonExpenseCount++;
        const amountNum = Number(result.mapped.amount || 0);
        if (!isNaN(amountNum) && amountNum > 0) {
          excludedNonExpenseTotal += amountNum;
        }
        sampleRows.push({
          rowIndex,
          status: "EXCLUDED_NON_EXPENSE",
          reasons: result.reasons,
          raw: rawRow,
          mapped: result.mapped,
          needsReview: false,
        });
        continue;
      }

      // 2. Handle row corrections on INVALID rows (e.g. user provided missing title or date)
      if (result.status === "INVALID" || !result.candidateInput) {
        if (correction) {
          if (correction.title) {
            result.mapped.title = correction.title.trim();
          }
          if (correction.transactionDate) {
            result.mapped.transactionDate = new Date(correction.transactionDate).toISOString();
          }
          if (correction.category) {
            result.mapped.category = correction.category;
          }
          if (correction.priority) {
            result.mapped.priority = correction.priority;
          }
          if (correction.notes !== undefined) {
            result.mapped.notes = correction.notes;
          }

          const hasValidTitle = Boolean(result.mapped.title && result.mapped.title.trim().length > 0);
          const hasValidDate = Boolean(
            result.mapped.transactionDate && !isNaN(Date.parse(result.mapped.transactionDate))
          );
          const hasValidAmount = Boolean(
            result.mapped.amount !== null &&
            result.mapped.amount !== undefined &&
            Number(result.mapped.amount) > 0
          );

          if (hasValidTitle && hasValidDate && hasValidAmount) {
            result.candidateInput = {
              title: result.mapped.title!.trim(),
              amount: new Prisma.Decimal(result.mapped.amount!),
              transactionDate: new Date(result.mapped.transactionDate!),
              category: result.mapped.category || Category.OTHER,
              priority: result.mapped.priority || Priority.UNCLASSIFIED,
              notes: result.mapped.notes || undefined,
              source,
              externalId: result.mapped.externalId || undefined,
              sourceMetadata: {
                sourceFilename: session.fileName,
                sourceRowIndex: rowIndex,
                rawRow,
                userCorrected: true,
              },
              allowPotentialDuplicate: Boolean(options.allowPotentialDuplicates),
            };
            result.status = "READY";
            result.reasons = [];
          }
        }

        if (result.status === "INVALID" || !result.candidateInput) {
          invalidRowCount++;
          sampleRows.push({
            rowIndex,
            status: "INVALID",
            reasons: result.reasons,
            raw: rawRow,
            mapped: result.mapped,
            needsReview: true,
            userCorrected: Boolean(correction),
          });
          continue;
        }
      }

      // 3. Apply corrections to READY candidate (category, priority/tier, title, date, notes)
      if (correction && result.candidateInput) {
        if (correction.category) {
          result.mapped.category = correction.category;
          result.candidateInput.category = correction.category;
        }
        if (correction.priority) {
          result.mapped.priority = correction.priority;
          result.candidateInput.priority = correction.priority;
        }
        if (correction.title) {
          result.mapped.title = correction.title.trim();
          result.candidateInput.title = correction.title.trim();
        }
        if (correction.transactionDate) {
          result.mapped.transactionDate = new Date(correction.transactionDate).toISOString();
          result.candidateInput.transactionDate = new Date(correction.transactionDate);
        }
        if (correction.notes !== undefined) {
          result.mapped.notes = correction.notes;
          result.candidateInput.notes = correction.notes || undefined;
        }
        result.candidateInput.sourceMetadata = {
          ...(result.candidateInput.sourceMetadata as Record<string, unknown> || {}),
          userCorrected: true,
        };
      }

      // 4. Check for in-file duplicate external ID
      const extId = result.candidateInput.externalId;
      if (extId) {
        if (seenExternalIdsInFile.has(extId)) {
          duplicateInFileCount++;
          sampleRows.push({
            rowIndex,
            status: "DUPLICATE_IN_FILE",
            reasons: [`Duplicate transaction ID '${extId}' found earlier in this file`],
            raw: rawRow,
            mapped: result.mapped,
            needsReview: true,
            userCorrected: Boolean(correction),
          });
          continue;
        }
        seenExternalIdsInFile.add(extId);
      }

      // 5. Check for in-file duplicate content: title + date + amount
      const dateStr =
        result.candidateInput.transactionDate instanceof Date
          ? result.candidateInput.transactionDate.toISOString().slice(0, 10)
          : String(result.candidateInput.transactionDate || "").slice(0, 10);

      const contentKey = `${result.candidateInput.title}|${result.candidateInput.amount.toString()}|${dateStr}`;
      if (seenContentInFile.has(contentKey)) {
        duplicateInFileCount++;
        sampleRows.push({
          rowIndex,
          status: "DUPLICATE_IN_FILE",
          reasons: ["Identical transaction row already present earlier in this file"],
          raw: rawRow,
          mapped: result.mapped,
          needsReview: true,
          userCorrected: Boolean(correction),
        });
        continue;
      }
      seenContentInFile.add(contentKey);

      // Tag candidate with session source (CSV_IMPORT vs BANK_STATEMENT)
      result.candidateInput.source = source;

      // 6. Check against database using Phase 2 duplicate detector & canonical validator
      const normalized = normalizeTransactionInput(result.candidateInput);
      const validation = validateTransactionCandidate(normalized, numericUserId);

      if (!validation.isValid || !validation.validated) {
        invalidRowCount++;
        sampleRows.push({
          rowIndex,
          status: "INVALID",
          reasons: validation.errors.map((e) => e.message),
          raw: rawRow,
          mapped: result.mapped,
          needsReview: true,
          userCorrected: Boolean(correction),
        });
        continue;
      }

      const dupCheck = await detectDuplicate(validation.validated);

      if (dupCheck.status === "CONFIRMED_DUPLICATE") {
        confirmedDuplicateCount++;
        let existingCategory: Category | undefined;
        let existingPriority: Priority | undefined;
        // On re-import, preserve existing user-confirmed classification if matched in database
        if (dupCheck.matchedTransactionId) {
          const existing = await transactionRepository.findTransactionById(dupCheck.matchedTransactionId);
          if (existing) {
            existingCategory = existing.category;
            existingPriority = existing.priority;
            result.mapped.category = existing.category;
            result.mapped.priority = existing.priority;
          }
        }
        sampleRows.push({
          rowIndex,
          status: "CONFIRMED_DUPLICATE",
          reasons: [
            dupCheck.reason || "Already exists in your financial ledger with confirmed record",
          ],
          raw: rawRow,
          mapped: result.mapped,
          existingCategory,
          existingPriority,
          needsReview: false,
          userCorrected: Boolean(correction),
        });
        continue;
      }

      if (dupCheck.status === "POTENTIAL_DUPLICATE") {
        potentialDuplicateCount++;
        const amountNum = Number(result.mapped.amount || 0);
        potentialDuplicatesTotal += amountNum;
        sampleRows.push({
          rowIndex,
          status: "POTENTIAL_DUPLICATE",
          reasons: [
            dupCheck.reason ||
              "Similar transaction on the same date already exists in your ledger",
          ],
          raw: rawRow,
          mapped: result.mapped,
          needsReview: true,
          userCorrected: Boolean(correction),
        });
        continue;
      }

      // Candidate is valid, unique, and ready to import!
      validExpenseCount++;
      const amountNum = Number(result.mapped.amount || 0);
      validExpenseTotal += amountNum;

      const isUnclassified = result.mapped.priority === Priority.UNCLASSIFIED;
      if (isUnclassified) {
        unclassifiedCount++;
      }

      const reviewReasons: string[] = [];
      if (isUnclassified) {
        reviewReasons.push(
          "Spending tier is unclassified. You can assign a tier before confirming, or import as unclassified."
        );
      }
      if (
        result.mapped.category === Category.OTHER &&
        (!mapping.categoryColumn || !rawRow[mapping.categoryColumn])
      ) {
        reviewReasons.push(
          "Category is unclassified (OTHER). You can assign a category before confirming."
        );
      }

      sampleRows.push({
        rowIndex,
        status: "READY",
        reasons: reviewReasons.length > 0 ? reviewReasons : result.reasons,
        raw: rawRow,
        mapped: result.mapped,
        isUnclassified,
        needsReview: isUnclassified,
        userCorrected: Boolean(correction),
      });
    }

    const expectedToImportCount = options.allowPotentialDuplicates
      ? validExpenseCount + potentialDuplicateCount
      : validExpenseCount;

    const readyToImportTotal = options.allowPotentialDuplicates
      ? validExpenseTotal + potentialDuplicatesTotal
      : validExpenseTotal;

    const summary: ImportPreviewSummary = {
      totalRows: rows.length,
      validExpenseCount,
      validExpenseTotal: Number(validExpenseTotal.toFixed(2)),
      confirmedDuplicateCount,
      potentialDuplicateCount,
      duplicateInFileCount,
      invalidRowCount,
      excludedNonExpenseCount,
      excludedNonExpenseTotal: Number(excludedNonExpenseTotal.toFixed(2)),
      expectedToImportCount,
      readyToImportTotal: Number(readyToImportTotal.toFixed(2)),
      unclassifiedCount,
      needsCorrectionCount: invalidRowCount,
    };

    const balanceColumn = session.parsedSheet.headers.find((h) =>
      /balance|bal\b/i.test(h)
    );
    const reconciliation = reconcileStatement(
      allTransformedResults,
      rows,
      balanceColumn
    );

    return {
      fileId,
      summary,
      mapping,
      options,
      sampleRows,
      reconciliation,
    };
  }

  /**
   * Commits eligible expenses to the ledger through the Phase 2 canonical ingestion pipeline.
   * Incorporates safe user corrections while strictly enforcing financial eligibility
   * and non-expense exclusions.
   */
  public async confirmAndCommitImport(
    userId: string,
    payload: ConfirmImportPayload
  ): Promise<ImportExecutionResult> {
    const session = importSessionStore.getSession(payload.fileId, userId);
    if (payload.rowCorrections && Object.keys(payload.rowCorrections).length > 0) {
      importSessionStore.updateRowCorrections(payload.fileId, userId, payload.rowCorrections);
    }

    const { rows } = session.parsedSheet;
    const numericUserId = Number(userId);

    const options: ImportOptions = {
      ...payload.options,
      allowPotentialDuplicates: Boolean(payload.importPotentialDuplicates),
    };

    const selectedSet = payload.selectedRowIndices
      ? new Set(payload.selectedRowIndices)
      : null;

    const candidatesToIngest: IngestionSourceInput[] = [];
    const source =
      session.fileType === "csv"
        ? TransactionSource.CSV_IMPORT
        : TransactionSource.BANK_STATEMENT;

    let excludedNonExpense = 0;
    let invalidSkipped = 0;
    let duplicateInFileSkipped = 0;
    let potentialDuplicatesSkipped = 0;

    const seenExternalIdsInFile = new Set<string>();
    const seenContentInFile = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const rowIndex = i + 1;
      const rawRow = rows[i];

      // If user provided a specific selection and this row is not selected, skip
      if (selectedSet && !selectedSet.has(rowIndex)) {
        continue;
      }

      const transformed = transformRow(rawRow, payload.mapping, options, rowIndex, session.fileName);

      // Check for user-submitted or session-stored corrections for this row
      const correction =
        payload.rowCorrections?.[rowIndex] ||
        payload.rowCorrections?.[String(rowIndex)] ||
        session.rowCorrections?.get(rowIndex);

      // 1. Strict Server Financial Eligibility Rule:
      // Credits, transfers, and balance headers must NEVER be committed as expenses.
      if (transformed.status === "EXCLUDED_NON_EXPENSE") {
        excludedNonExpense++;
        continue;
      }

      // 2. Handle corrections on INVALID rows
      if (transformed.status === "INVALID" || !transformed.candidateInput) {
        if (correction) {
          if (correction.title) {
            transformed.mapped.title = correction.title.trim();
          }
          if (correction.transactionDate) {
            transformed.mapped.transactionDate = new Date(correction.transactionDate).toISOString();
          }
          if (correction.category) {
            transformed.mapped.category = correction.category;
          }
          if (correction.priority) {
            transformed.mapped.priority = correction.priority;
          }
          if (correction.notes !== undefined) {
            transformed.mapped.notes = correction.notes;
          }

          const hasValidTitle = Boolean(transformed.mapped.title && transformed.mapped.title.trim().length > 0);
          const hasValidDate = Boolean(
            transformed.mapped.transactionDate && !isNaN(Date.parse(transformed.mapped.transactionDate))
          );
          const hasValidAmount = Boolean(
            transformed.mapped.amount !== null &&
            transformed.mapped.amount !== undefined &&
            Number(transformed.mapped.amount) > 0
          );

          if (hasValidTitle && hasValidDate && hasValidAmount) {
            transformed.candidateInput = {
              title: transformed.mapped.title!.trim(),
              amount: new Prisma.Decimal(transformed.mapped.amount!),
              transactionDate: new Date(transformed.mapped.transactionDate!),
              category: transformed.mapped.category || Category.OTHER,
              priority: transformed.mapped.priority || Priority.UNCLASSIFIED,
              notes: transformed.mapped.notes || undefined,
              source,
              externalId: transformed.mapped.externalId || undefined,
              sourceMetadata: {
                sourceFilename: session.fileName,
                sourceRowIndex: rowIndex,
                rawRow,
                userCorrected: true,
              },
              allowPotentialDuplicate: Boolean(options.allowPotentialDuplicates),
            };
            transformed.status = "READY";
          }
        }

        if (transformed.status === "INVALID" || !transformed.candidateInput) {
          invalidSkipped++;
          continue;
        }
      }

      // 3. Apply corrections to READY candidate
      if (correction && transformed.candidateInput) {
        if (correction.category) {
          transformed.candidateInput.category = correction.category;
          transformed.mapped.category = correction.category;
        }
        if (correction.priority) {
          transformed.candidateInput.priority = correction.priority;
          transformed.mapped.priority = correction.priority;
        }
        if (correction.title) {
          transformed.candidateInput.title = correction.title.trim();
          transformed.mapped.title = correction.title.trim();
        }
        if (correction.transactionDate) {
          transformed.candidateInput.transactionDate = new Date(correction.transactionDate);
          transformed.mapped.transactionDate = new Date(correction.transactionDate).toISOString();
        }
        if (correction.notes !== undefined) {
          transformed.candidateInput.notes = correction.notes || undefined;
          transformed.mapped.notes = correction.notes;
        }
        transformed.candidateInput.sourceMetadata = {
          ...(transformed.candidateInput.sourceMetadata as Record<string, unknown> || {}),
          userCorrected: true,
        };
      }

      // 4. In-file duplicate check
      const extId = transformed.candidateInput.externalId;
      if (extId) {
        if (seenExternalIdsInFile.has(extId)) {
          duplicateInFileSkipped++;
          continue;
        }
        seenExternalIdsInFile.add(extId);
      }

      const dateStr =
        transformed.candidateInput.transactionDate instanceof Date
          ? transformed.candidateInput.transactionDate.toISOString().slice(0, 10)
          : String(transformed.candidateInput.transactionDate || "").slice(0, 10);

      const contentKey = `${transformed.candidateInput.title}|${transformed.candidateInput.amount.toString()}|${dateStr}`;
      if (seenContentInFile.has(contentKey)) {
        duplicateInFileSkipped++;
        continue;
      }
      seenContentInFile.add(contentKey);

      // Tag candidate with session source before duplicate detection
      transformed.candidateInput.source = source;
      const normalized = normalizeTransactionInput(transformed.candidateInput);
      const validation = validateTransactionCandidate(normalized, numericUserId);

      if (!validation.isValid || !validation.validated) {
        invalidSkipped++;
        continue;
      }

      // 5. Database duplicate check: never overwrite existing confirmed records
      const dupCheck = await detectDuplicate(validation.validated);
      if (dupCheck.status === "CONFIRMED_DUPLICATE") {
        // Already in ledger: preserve existing record and classification untouched
        continue;
      }
      if (dupCheck.status === "POTENTIAL_DUPLICATE") {
        if (!payload.importPotentialDuplicates) {
          potentialDuplicatesSkipped++;
          continue;
        }
        transformed.candidateInput.allowPotentialDuplicate = true;
      }

      candidatesToIngest.push(transformed.candidateInput);
    }

    // Persist via Phase 2 canonical batch ingestion pipeline
    const batchResult = await ingestTransactionBatch(candidatesToIngest, {
      userId: numericUserId,
    });

    // Clear session once committed
    importSessionStore.deleteSession(payload.fileId);

    const importedTransactions: string[] = batchResult.results
      .filter((r: IngestionResult) => r.status === "ACCEPTED" && r.transaction)
      .map((r: IngestionResult) => String(r.transaction!.id));

    return {
      totalProcessed: candidatesToIngest.length,
      imported: batchResult.accepted,
      alreadyExisting: batchResult.duplicates,
      potentialDuplicatesSkipped:
        potentialDuplicatesSkipped + batchResult.potentialDuplicates,
      invalidSkipped: invalidSkipped + batchResult.failed,
      excludedNonExpense,
      failed: batchResult.failed,
      importedIds: importedTransactions,
    };
  }
}

export const importService = new ImportService();

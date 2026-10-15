import { TransactionSource } from "../../generated/prisma/enums";
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
import { transformRow } from "../mapping/row-transformer";
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
  public async generateImportPreview(
    userId: string,
    fileId: string,
    mapping: ColumnMapping,
    options: ImportOptions = {}
  ): Promise<ImportPreviewResult> {
    const session = importSessionStore.getSession(fileId, userId);
    const { rows } = session.parsedSheet;
    const numericUserId = Number(userId);

    const seenExternalIdsInFile = new Set<string>();
    const seenContentInFile = new Set<string>();

    const sampleRows: PreviewRowItem[] = [];

    let validExpenseCount = 0;
    let confirmedDuplicateCount = 0;
    let potentialDuplicateCount = 0;
    let duplicateInFileCount = 0;
    let invalidRowCount = 0;
    let excludedNonExpenseCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowIndex = i + 1;
      const rawRow = rows[i];

      const result = transformRow(rawRow, mapping, options, rowIndex, session.fileName);

      if (result.status === "EXCLUDED_NON_EXPENSE") {
        excludedNonExpenseCount++;
        sampleRows.push({
          rowIndex,
          status: "EXCLUDED_NON_EXPENSE",
          reasons: result.reasons,
          raw: rawRow,
          mapped: result.mapped,
        });
        continue;
      }

      if (result.status === "INVALID" || !result.candidateInput) {
        invalidRowCount++;
        sampleRows.push({
          rowIndex,
          status: "INVALID",
          reasons: result.reasons,
          raw: rawRow,
          mapped: result.mapped,
        });
        continue;
      }

      // Check for in-file duplicate external ID
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
          });
          continue;
        }
        seenExternalIdsInFile.add(extId);
      }

      // Check for in-file duplicate content: title + date + amount
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
        });
        continue;
      }
      seenContentInFile.add(contentKey);

      // Tag candidate with session source (CSV_IMPORT vs BANK_STATEMENT)
      const source =
        session.fileType === "csv"
          ? TransactionSource.CSV_IMPORT
          : TransactionSource.BANK_STATEMENT;
      result.candidateInput.source = source;

      // Check against database using Phase 2 duplicate detector
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
        });
        continue;
      }

      const dupCheck = await detectDuplicate(validation.validated);

      if (dupCheck.status === "CONFIRMED_DUPLICATE") {
        confirmedDuplicateCount++;
        sampleRows.push({
          rowIndex,
          status: "CONFIRMED_DUPLICATE",
          reasons: [dupCheck.reason || "Already exists in your financial ledger"],
          raw: rawRow,
          mapped: result.mapped,
        });
        continue;
      }

      if (dupCheck.status === "POTENTIAL_DUPLICATE") {
        potentialDuplicateCount++;
        sampleRows.push({
          rowIndex,
          status: "POTENTIAL_DUPLICATE",
          reasons: [
            dupCheck.reason ||
              "Similar transaction on the same date already exists in your ledger",
          ],
          raw: rawRow,
          mapped: result.mapped,
        });
        continue;
      }

      // Candidate is valid and unique!
      validExpenseCount++;
      sampleRows.push({
        rowIndex,
        status: "READY",
        reasons: [],
        raw: rawRow,
        mapped: result.mapped,
      });
    }

    const expectedToImportCount = options.allowPotentialDuplicates
      ? validExpenseCount + potentialDuplicateCount
      : validExpenseCount;

    const summary: ImportPreviewSummary = {
      totalRows: rows.length,
      validExpenseCount,
      confirmedDuplicateCount,
      potentialDuplicateCount,
      duplicateInFileCount,
      invalidRowCount,
      excludedNonExpenseCount,
      expectedToImportCount,
    };

    return {
      fileId,
      summary,
      mapping,
      options,
      sampleRows,
    };
  }

  /**
   * Commits eligible expenses to the ledger through the Phase 2 canonical ingestion pipeline.
   */
  public async confirmAndCommitImport(
    userId: string,
    payload: ConfirmImportPayload
  ): Promise<ImportExecutionResult> {
    const session = importSessionStore.getSession(payload.fileId, userId);
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

      if (transformed.status === "EXCLUDED_NON_EXPENSE") {
        excludedNonExpense++;
        continue;
      }

      if (transformed.status === "INVALID" || !transformed.candidateInput) {
        invalidSkipped++;
        continue;
      }

      // In-file duplicate check
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

      const dupCheck = await detectDuplicate(validation.validated);
      if (dupCheck.status === "CONFIRMED_DUPLICATE") {
        // Already in ledger
        continue;
      }
      if (dupCheck.status === "POTENTIAL_DUPLICATE") {
        if (!payload.importPotentialDuplicates) {
          potentialDuplicatesSkipped++;
          continue;
        }
        // If explicitly approved: flag candidate
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

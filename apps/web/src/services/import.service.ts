import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export type AmountMode = "single_amount" | "debit_credit";

export type SingleAmountConvention =
  | "negative_is_expense"
  | "positive_is_expense"
  | "all_positive";

export interface ColumnMapping {
  descriptionColumn: string;
  amountMode: AmountMode;
  amountColumn?: string;
  debitColumn?: string;
  creditColumn?: string;
  dateColumn: string;
  externalIdColumn?: string;
  categoryColumn?: string;
  priorityColumn?: string;
  notesColumn?: string;
}

export interface ImportOptions {
  worksheet?: string;
  hasHeader?: boolean;
  dateFormat?: string;
  amountConvention?: SingleAmountConvention;
  allowPotentialDuplicates?: boolean;
}

export interface FileMetadata {
  fileId: string;
  fileName: string;
  fileType: "csv" | "xlsx";
  fileSize: number;
  worksheets: string[];
  activeWorksheet: string;
  totalRows: number;
  headers: string[];
  previewRows: Record<string, string>[];
  suggestedMapping: ColumnMapping;
  createdAt: number;
}

export type RowClassificationStatus =
  | "READY"
  | "CONFIRMED_DUPLICATE"
  | "POTENTIAL_DUPLICATE"
  | "DUPLICATE_IN_FILE"
  | "EXCLUDED_NON_EXPENSE"
  | "INVALID";

export interface PreviewRowItem {
  rowIndex: number;
  status: RowClassificationStatus;
  reasons: string[];
  raw: Record<string, string>;
  mapped: {
    title: string | null;
    amount: number | null;
    transactionDate: string | null;
    category?: string;
    priority?: string;
    externalId?: string | null;
    notes?: string | null;
  };
}

export interface ImportPreviewSummary {
  totalRows: number;
  validExpenseCount: number;
  confirmedDuplicateCount: number;
  potentialDuplicateCount: number;
  duplicateInFileCount: number;
  invalidRowCount: number;
  excludedNonExpenseCount: number;
  expectedToImportCount: number;
}

export interface ImportPreviewResult {
  fileId: string;
  summary: ImportPreviewSummary;
  mapping: ColumnMapping;
  options: ImportOptions;
  sampleRows: PreviewRowItem[];
}

export interface ConfirmImportPayload {
  fileId: string;
  mapping: ColumnMapping;
  options?: ImportOptions;
  importPotentialDuplicates?: boolean;
  selectedRowIndices?: number[];
}

export interface ImportExecutionResult {
  totalProcessed: number;
  imported: number;
  alreadyExisting: number;
  potentialDuplicatesSkipped: number;
  invalidSkipped: number;
  excludedNonExpense: number;
  failed: number;
  importedIds: string[];
}

/**
 * Uploads a CSV or XLSX statement file.
 */
export async function uploadStatement(
  file: File,
  worksheet?: string
): Promise<FileMetadata> {
  const formData = new FormData();
  formData.append("file", file);
  if (worksheet) {
    formData.append("worksheet", worksheet);
  }

  const response = await api.post<{ success: boolean; data: FileMetadata }>(
    ENDPOINTS.IMPORT.UPLOAD,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data.data;
}

/**
 * Switches the active worksheet for a multi-sheet Excel file.
 */
export async function switchWorksheet(
  fileId: string,
  worksheetName: string
): Promise<FileMetadata> {
  const response = await api.post<{ success: boolean; data: FileMetadata }>(
    ENDPOINTS.IMPORT.SWITCH_WORKSHEET,
    { fileId, worksheetName }
  );

  return response.data.data;
}

/**
 * Generates an import preview with validation and duplicate detection.
 */
export async function previewStatement(
  fileId: string,
  mapping: ColumnMapping,
  options?: ImportOptions
): Promise<ImportPreviewResult> {
  const response = await api.post<{ success: boolean; data: ImportPreviewResult }>(
    ENDPOINTS.IMPORT.PREVIEW,
    { fileId, mapping, options }
  );

  return response.data.data;
}

/**
 * Confirms and persists the eligible expenses into the canonical ledger.
 */
export async function confirmImport(
  payload: ConfirmImportPayload
): Promise<ImportExecutionResult> {
  const response = await api.post<{ success: boolean; data: ImportExecutionResult }>(
    ENDPOINTS.IMPORT.CONFIRM,
    payload
  );

  return response.data.data;
}

import { Category, Priority, TransactionSource } from "../../generated/prisma/enums";

export type SupportedFileType = "csv" | "xlsx" | "pdf";

export type AmountMode = "single_amount" | "debit_credit";

export type SingleAmountConvention = 
  | "negative_is_expense"  // Standard bank debit: -50.00 is expense, +1000 is deposit
  | "positive_is_expense"  // Credit card statement: 50.00 is charge, -150 is payment
  | "all_positive";        // Expense-only ledger: all amounts are expenses

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
  dateFormat?: string; // "AUTO" | "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY"
  amountConvention?: SingleAmountConvention;
  allowPotentialDuplicates?: boolean;
}

export interface FileMetadata {
  fileId: string;
  fileName: string;
  fileType: SupportedFileType;
  fileSize: number;
  worksheets: string[];
  activeWorksheet: string;
  totalRows: number;
  headers: string[];
  previewRows: Record<string, string>[];
  suggestedMapping: ColumnMapping;
  createdAt: number;
}

export interface RowCorrection {
  category?: Category;
  priority?: Priority;
  title?: string;
  transactionDate?: string;
  notes?: string | null;
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
    category?: Category;
    priority?: Priority;
    externalId?: string | null;
    notes?: string | null;
  };
  isUnclassified?: boolean;
  needsReview?: boolean;
  userCorrected?: boolean;
  existingCategory?: Category | null;
  existingPriority?: Priority | null;
}

export interface ImportPreviewSummary {
  totalRows: number;
  validExpenseCount: number;
  validExpenseTotal: number;
  confirmedDuplicateCount: number;
  potentialDuplicateCount: number;
  duplicateInFileCount: number;
  invalidRowCount: number;
  excludedNonExpenseCount: number;
  excludedNonExpenseTotal: number;
  expectedToImportCount: number;
  readyToImportTotal: number;
  unclassifiedCount: number;
  needsCorrectionCount: number;
}

export interface ImportPreviewResult {
  fileId: string;
  summary: ImportPreviewSummary;
  mapping: ColumnMapping;
  options: ImportOptions;
  sampleRows: PreviewRowItem[];
  reconciliation?: import("../reconciliation/statement-reconciler").ReconciliationReport;
}

export interface ConfirmImportPayload {
  fileId: string;
  mapping: ColumnMapping;
  options?: ImportOptions;
  importPotentialDuplicates?: boolean;
  selectedRowIndices?: number[]; // If omitted, imports all READY rows (and POTENTIAL_DUPLICATE if importPotentialDuplicates=true)
  rowCorrections?: Record<string, RowCorrection>;
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

export interface RawParsedSheet {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

import { ValidationError } from "../../error/AppError";
import { SupportedFileType } from "../types/import.types";

export const IMPORT_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_ROWS: 5000,
  MAX_WORKSHEETS: 20,
};

// Standard PK zip header for XLSX
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
// Standard %PDF header for PDF
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]);

/**
 * Validates file format by extension and buffer contents.
 */
export function detectAndValidateFileType(
  buffer: Buffer,
  originalFilename: string
): SupportedFileType {
  if (!buffer || buffer.length === 0) {
    throw new ValidationError("Uploaded file is empty");
  }

  if (buffer.length > IMPORT_LIMITS.MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(
      `File size exceeds maximum allowed limit of ${IMPORT_LIMITS.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
    );
  }

  const extension = originalFilename.split(".").pop()?.toLowerCase();

  if (extension === "pdf") {
    // Check magic bytes for PDF (%PDF)
    if (buffer.length < 4 || !buffer.subarray(0, 4).equals(PDF_MAGIC)) {
      throw new ValidationError(
        "Corrupted or invalid PDF file. File content does not match .pdf format."
      );
    }
    return "pdf";
  }

  if (extension === "xlsx") {
    // Check magic bytes for ZIP (XLSX is an OPC/ZIP package)
    if (buffer.length < 4 || !buffer.subarray(0, 4).equals(ZIP_MAGIC)) {
      throw new ValidationError(
        "Corrupted or invalid Excel file. File content does not match .xlsx format."
      );
    }
    return "xlsx";
  }

  if (extension === "csv" || extension === "txt") {
    // Check for binary characters / null bytes which indicate non-text files
    const sampleSize = Math.min(buffer.length, 1024);
    for (let i = 0; i < sampleSize; i++) {
      if (buffer[i] === 0x00) {
        throw new ValidationError(
          "Invalid CSV file. Binary content detected."
        );
      }
    }
    return "csv";
  }

  throw new ValidationError(
    `Unsupported file format: '${extension || "unknown"}'. Only .csv, .xlsx, and .pdf files are supported.`
  );
}

/**
 * Prevents CSV / Spreadsheet formula injection vulnerabilities.
 * Strips or prefixes leading formula characters (=, +, -, @, \t, \r) if evaluated.
 */
export function sanitizeCellValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();

  // If text begins with dangerous formula triggers in spreadsheet environments
  if (/^[=+\-@\t\r]/.test(str)) {
    // Prepend single quote or strip leading operator if it's purely a formula attempt
    if (/^[=+\-@]\s*[A-Za-z_]/.test(str)) {
      // Looks like an explicit formula (e.g. =cmd|..., =SUM(...), @HYPERLINK(...))
      str = "'" + str;
    }
  }

  return str;
}

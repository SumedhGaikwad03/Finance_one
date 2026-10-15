import { parse } from "csv-parse/sync";
import { ValidationError } from "../../error/AppError";
import { IMPORT_LIMITS, sanitizeCellValue } from "./file-detector";
import { RawParsedSheet } from "../types/import.types";

/**
 * Detects the most probable delimiter in a CSV sample text.
 */
function detectDelimiter(text: string): string {
  const sample = text.slice(0, 2048);
  const delimiters = [",", ";", "\t", "|"];
  let bestDelimiter = ",";
  let maxCount = -1;

  for (const delim of delimiters) {
    const count = (sample.match(new RegExp(`\\${delim}`, "g")) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delim;
    }
  }

  return bestDelimiter;
}

/**
 * Parses raw CSV buffer into headers and row objects.
 */
export function parseCsvBuffer(buffer: Buffer): RawParsedSheet {
  let content = buffer.toString("utf8");

  // Strip UTF-8 Byte Order Mark (BOM) if present
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  if (content.trim().length === 0) {
    throw new ValidationError("CSV file is empty");
  }

  const delimiter = detectDelimiter(content);

  let records: string[][];
  try {
    records = parse(content, {
      delimiter,
      relax_quotes: true,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      max_record_size: 64 * 1024,
    });
  } catch (err: any) {
    throw new ValidationError(
      `Failed to parse CSV file: ${err.message || "Invalid or malformed CSV format"}`
    );
  }

  if (!records || records.length === 0) {
    throw new ValidationError("No data rows found in CSV file");
  }

  // Row limit check
  if (records.length > IMPORT_LIMITS.MAX_ROWS + 1) {
    throw new ValidationError(
      `File exceeds maximum row limit of ${IMPORT_LIMITS.MAX_ROWS} rows`
    );
  }

  // First non-empty row as headers
  const headerRow = records[0];
  const headers: string[] = [];
  const seenHeaders = new Set<string>();

  headerRow.forEach((h, idx) => {
    let cleanHeader = sanitizeCellValue(h).trim();
    if (!cleanHeader) {
      cleanHeader = `Column_${idx + 1}`;
    }
    // Handle duplicate header names by appending _2, _3, etc.
    let uniqueHeader = cleanHeader;
    let counter = 2;
    while (seenHeaders.has(uniqueHeader.toLowerCase())) {
      uniqueHeader = `${cleanHeader}_${counter++}`;
    }
    seenHeaders.add(uniqueHeader.toLowerCase());
    headers.push(uniqueHeader);
  });

  const rows: Record<string, string>[] = [];

  for (let r = 1; r < records.length; r++) {
    const rowRecord = records[r];
    // Check if entire row is empty
    const isRowEmpty = rowRecord.every((cell) => !cell || cell.trim().length === 0);
    if (isRowEmpty) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      const rawCell = rowRecord[idx] !== undefined ? rowRecord[idx] : "";
      rowObj[header] = sanitizeCellValue(rawCell);
    });
    rows.push(rowObj);
  }

  return {
    headers,
    rows,
    totalRows: rows.length,
  };
}

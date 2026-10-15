import ExcelJS from "exceljs";
import { ValidationError } from "../../error/AppError";
import { IMPORT_LIMITS, sanitizeCellValue } from "./file-detector";
import { RawParsedSheet } from "../types/import.types";

/**
 * Extracts raw, safe cell representation without formula execution.
 */
function extractCellValue(cell: ExcelJS.Cell): string {
  if (cell.value === null || cell.value === undefined) {
    return "";
  }

  // If cell is a Date object
  if (cell.value instanceof Date) {
    return cell.value.toISOString();
  }

  // If cell has a formula or rich text
  if (typeof cell.value === "object") {
    // Formula result object: { formula: string, result: any }
    if ("result" in cell.value && cell.value.result !== undefined && cell.value.result !== null) {
      if (cell.value.result instanceof Date) {
        return cell.value.result.toISOString();
      }
      return sanitizeCellValue(cell.value.result);
    }

    // Rich text object: { richText: [{ text: string }] }
    if ("richText" in cell.value && Array.isArray((cell.value as any).richText)) {
      const fullText = (cell.value as any).richText.map((t: any) => t.text || "").join("");
      return sanitizeCellValue(fullText);
    }

    // Hyperlink object: { text: string, hyperlink: string }
    if ("text" in cell.value && typeof (cell.value as any).text === "string") {
      return sanitizeCellValue((cell.value as any).text);
    }
  }

  // Text representation
  if (cell.text !== undefined && cell.text !== null && cell.text !== "") {
    return sanitizeCellValue(cell.text);
  }

  return sanitizeCellValue(cell.value);
}

/**
 * Lists all worksheets in an Excel workbook.
 */
export async function getExcelWorksheets(buffer: Buffer): Promise<string[]> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as any);
  } catch (err: any) {
    throw new ValidationError(
      `Failed to read Excel workbook: ${err.message || "Invalid or corrupt XLSX file"}`
    );
  }

  if (workbook.worksheets.length === 0) {
    throw new ValidationError("Excel file contains no worksheets");
  }

  if (workbook.worksheets.length > IMPORT_LIMITS.MAX_WORKSHEETS) {
    throw new ValidationError(
      `Excel file exceeds maximum allowed worksheets limit (${IMPORT_LIMITS.MAX_WORKSHEETS})`
    );
  }

  return workbook.worksheets.map((ws) => ws.name);
}

/**
 * Parses an Excel worksheet by name or index.
 */
export async function parseExcelWorksheet(
  buffer: Buffer,
  targetWorksheetName?: string
): Promise<{ sheetName: string; worksheets: string[]; parsedSheet: RawParsedSheet }> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as any);
  } catch (err: any) {
    throw new ValidationError(
      `Failed to read Excel workbook: ${err.message || "Invalid or corrupt XLSX file"}`
    );
  }

  const worksheets = workbook.worksheets.map((ws) => ws.name);
  if (worksheets.length === 0) {
    throw new ValidationError("Excel file contains no worksheets");
  }

  let worksheet: ExcelJS.Worksheet | undefined;
  if (targetWorksheetName) {
    worksheet = workbook.getWorksheet(targetWorksheetName);
    if (!worksheet) {
      throw new ValidationError(
        `Worksheet '${targetWorksheetName}' not found in workbook. Available sheets: ${worksheets.join(", ")}`
      );
    }
  } else {
    // Default to the first sheet with data
    worksheet = workbook.worksheets[0];
  }

  const rowCount = worksheet.rowCount;
  if (rowCount === 0) {
    throw new ValidationError(`Worksheet '${worksheet.name}' is empty`);
  }

  if (rowCount > IMPORT_LIMITS.MAX_ROWS + 1) {
    throw new ValidationError(
      `Worksheet exceeds maximum row limit of ${IMPORT_LIMITS.MAX_ROWS} rows`
    );
  }

  // Find header row (first non-empty row)
  let headerRowIndex = 1;
  while (headerRowIndex <= Math.min(rowCount, 20)) {
    const row = worksheet.getRow(headerRowIndex);
    const hasValues = row.values && Array.isArray(row.values) && row.values.some((v) => v !== null && v !== undefined && String(v).trim() !== "");
    if (hasValues) break;
    headerRowIndex++;
  }

  const headerRow = worksheet.getRow(headerRowIndex);
  const headers: string[] = [];
  const columnIndices: number[] = [];
  const seenHeaders = new Set<string>();

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    let cleanHeader = extractCellValue(cell).trim();
    if (!cleanHeader) {
      cleanHeader = `Column_${colNumber}`;
    }

    let uniqueHeader = cleanHeader;
    let counter = 2;
    while (seenHeaders.has(uniqueHeader.toLowerCase())) {
      uniqueHeader = `${cleanHeader}_${counter++}`;
    }
    seenHeaders.add(uniqueHeader.toLowerCase());

    headers.push(uniqueHeader);
    columnIndices.push(colNumber);
  });

  if (headers.length === 0) {
    throw new ValidationError(`No column headers detected in worksheet '${worksheet.name}'`);
  }

  const rows: Record<string, string>[] = [];

  for (let r = headerRowIndex + 1; r <= rowCount; r++) {
    const row = worksheet.getRow(r);
    // Check if entire row is empty
    let isRowEmpty = true;
    for (const colIdx of columnIndices) {
      const cell = row.getCell(colIdx);
      const val = extractCellValue(cell);
      if (val.trim().length > 0) {
        isRowEmpty = false;
        break;
      }
    }
    if (isRowEmpty) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      const colIdx = columnIndices[idx];
      const cell = row.getCell(colIdx);
      rowObj[header] = extractCellValue(cell);
    });

    rows.push(rowObj);
  }

  return {
    sheetName: worksheet.name,
    worksheets,
    parsedSheet: {
      headers,
      rows,
      totalRows: rows.length,
    },
  };
}

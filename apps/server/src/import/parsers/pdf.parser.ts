import { PDFParse, PasswordException } from "pdf-parse";
import { ValidationError } from "../../error/AppError";
import { IMPORT_LIMITS, sanitizeCellValue } from "./file-detector";
import { RawParsedSheet } from "../types/import.types";

export const MAX_PDF_PAGES = 30;

export interface ParsedPdfResult {
  parsedSheet: RawParsedSheet;
  pages: string[];
  totalExtractablePages: number;
}

interface ColumnDef {
  name: string;
  minX: number;
  maxX: number;
}

/**
 * Normalizes raw header strings into canonical statement column names.
 */
function normalizeHeaderName(raw: string): string {
  const clean = raw.toLowerCase().trim();
  if (/^date/i.test(clean) || /date$/i.test(clean)) return "Date";
  if (/^narration/i.test(clean)) return "Narration";
  if (/^description/i.test(clean)) return "Description";
  if (/^particulars/i.test(clean)) return "Particulars";
  if (/details|memo|remarks/i.test(clean)) return "Narration";
  if (/^chq|ref|reference|utr|txn\s*id/i.test(clean)) return "Ref";
  if (/^withdrawal|debit|dr\b|spent|paid\s*out/i.test(clean)) return "Debit";
  if (/^deposit|credit|cr\b|received|paid\s*in/i.test(clean)) return "Credit";
  if (/balance|bal\b/i.test(clean)) return "Balance";
  if (/amount|total/i.test(clean)) return "Amount";
  return raw.trim();
}

/**
 * Checks if a string starts with or represents a date token.
 */
function isDateToken(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  return (
    /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(trimmed) ||
    /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(trimmed) ||
    /^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}/.test(trimmed) ||
    /^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4}/.test(trimmed)
  );
}

/**
 * Parses a text-based bank statement PDF buffer and reconstructs tabular transaction rows.
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedPdfResult> {
  if (!buffer || buffer.length === 0) {
    throw new ValidationError("Uploaded file is empty");
  }

  if (buffer.length > IMPORT_LIMITS.MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(
      `File size exceeds maximum allowed limit of ${IMPORT_LIMITS.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
    );
  }

  // Validate %PDF magic bytes
  if (buffer.length < 4 || buffer.subarray(0, 4).toString() !== "%PDF") {
    throw new ValidationError("Corrupted or invalid PDF file. File content does not match .pdf format.");
  }

  let pdfParser: InstanceType<typeof PDFParse> | null = null;

  try {
    pdfParser = new PDFParse({ data: buffer });
    // Trigger loading
    await pdfParser.getText({ cellSeparator: "\t", pageJoiner: "" });
  } catch (err: any) {
    if (pdfParser) {
      try { await pdfParser.destroy(); } catch (_) {}
    }

    if (
      err instanceof PasswordException ||
      err?.name === "PasswordException" ||
      String(err?.message || "").toLowerCase().includes("password") ||
      String(err?.message || "").toLowerCase().includes("encrypted")
    ) {
      throw new ValidationError(
        "This PDF is password-protected or encrypted. Please remove the password and re-upload."
      );
    }

    throw new ValidationError(
      `Failed to parse PDF document: ${err?.message || "Invalid or corrupted PDF file."}`
    );
  }

  try {
    const doc = (pdfParser as any).doc;
    if (!doc) {
      throw new ValidationError("Unable to read PDF document structure.");
    }

    const numPages = doc.numPages;
    if (typeof numPages === "number" && numPages > MAX_PDF_PAGES) {
      throw new ValidationError(
        `PDF exceeds maximum allowed page count of ${MAX_PDF_PAGES} pages (uploaded document has ${numPages} pages).`
      );
    }

    let totalItemsAcrossPages = 0;
    let totalTextChars = 0;
    let columns: ColumnDef[] = [];
    let descColName = "Narration";
    const candidateRows: Record<string, string>[] = [];
    const pageLabels: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      pageLabels.push(`Page ${pageNum}`);
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();

      if (!content || !content.items || content.items.length === 0) {
        continue;
      }

      totalItemsAcrossPages += content.items.length;

      // Group items on baseline Y (within ±3.5 points tolerance)
      const linesMap = new Map<number, any[]>();
      for (const item of content.items) {
        if (!item.str || !item.str.trim()) continue;
        totalTextChars += item.str.trim().length;

        const y = Math.round(item.transform[5]);
        let foundY: number | null = null;
        for (const existingY of linesMap.keys()) {
          if (Math.abs(existingY - y) <= 3.5) {
            foundY = existingY;
            break;
          }
        }
        if (foundY !== null) {
          linesMap.get(foundY)!.push(item);
        } else {
          linesMap.set(y, [item]);
        }
      }

      // Sort lines top-to-bottom (descending Y in PDF coordinates)
      const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);

      for (const y of sortedY) {
        // Sort items left-to-right (ascending X)
        const items = linesMap.get(y)!.sort((a, b) => a.transform[4] - b.transform[4]);
        const lineText = items.map((it) => it.str.trim()).join(" ");

        // Header detection on first page or before columns are initialized
        if (columns.length === 0) {
          const hasDate = items.some((it) => /date/i.test(it.str));
          const hasAmountOrDesc = items.some((it) =>
            /narration|description|particulars|debit|credit|amount|withdrawal|deposit/i.test(it.str)
          );

          if (hasDate && hasAmountOrDesc) {
            // Found table header row
            for (let i = 0; i < items.length; i++) {
              const it = items[i];
              const name = normalizeHeaderName(it.str);
              if (name === "Narration" || name === "Description" || name === "Particulars") {
                descColName = name;
              }
              const x = it.transform[4];
              const prevX = i > 0 ? items[i - 1].transform[4] : 0;
              const nextX = i < items.length - 1 ? items[i + 1].transform[4] : 9999;
              const minX = (prevX + x) / 2;
              const maxX = (x + nextX) / 2;
              columns.push({ name, minX, maxX });
            }
            continue;
          }
        }

        // Process data lines once columns are detected
        if (columns.length > 0) {
          // Check for repeated table headers across pages
          const isRepeatedHeader =
            items.some((it) => /date/i.test(it.str)) &&
            items.some((it) => /narration|description|debit|credit|amount|withdrawal|deposit/i.test(it.str));
          if (isRepeatedHeader) {
            continue;
          }

          // Skip obvious statement noise / footers
          if (
            /page\s+\d+\s+of\s+\d+/i.test(lineText) ||
            /generated\s*by/i.test(lineText) ||
            /statement\s*summary/i.test(lineText) ||
            /computer\s*generated/i.test(lineText) ||
            /end\s*of\s*statement/i.test(lineText)
          ) {
            continue;
          }

          // Map items on this line to detected columns
          const rowData: Record<string, string> = {};
          for (const col of columns) {
            rowData[col.name] = "";
          }

          for (const item of items) {
            const itemX = item.transform[4];
            let matchedCol = columns.find((c) => itemX >= c.minX && itemX < c.maxX);
            if (!matchedCol) {
              matchedCol = columns[columns.length - 1];
            }
            const cleanVal = sanitizeCellValue(item.str);
            if (rowData[matchedCol.name]) {
              rowData[matchedCol.name] += " " + cleanVal;
            } else {
              rowData[matchedCol.name] = cleanVal;
            }
          }

          const dateVal = rowData["Date"] || "";
          const hasDate = isDateToken(dateVal);

          if (hasDate) {
            // Explicit new transaction candidate row
            candidateRows.push(rowData);
          } else if (candidateRows.length > 0) {
            // Check for wrapped multi-line description or summary balance rows
            const hasDebit = Boolean(rowData["Debit"]);
            const hasCredit = Boolean(rowData["Credit"]);
            const hasAmount = Boolean(rowData["Amount"]);
            const hasRef = Boolean(rowData["Ref"]);

            // If line matches opening or closing balance keywords, preserve as separate row
            if (/opening\s*balance|closing\s*balance|balance\s*b\/f|brought\s*forward/i.test(lineText)) {
              candidateRows.push(rowData);
            } else if (!hasDebit && !hasCredit && !hasAmount && !hasRef && lineText.trim()) {
              // Wrapped narration continuation line: append to previous row's narration
              candidateRows[candidateRows.length - 1][descColName] += " " + lineText.trim();
            }
          }
        }
      }
    }

    // Safeguard 1: Scanned PDF detection
    if (totalItemsAcrossPages === 0 || totalTextChars === 0) {
      throw new ValidationError(
        "This PDF appears to be a scanned document or contains no extractable text. Scanned PDFs requiring OCR are not supported in this version."
      );
    }

    // Safeguard 2: Fallback line regex extraction if column coordinates were not detected
    if (columns.length === 0 || candidateRows.length === 0) {
      const fallbackResult = attemptLineBasedRegexExtraction(doc);
      if (fallbackResult) {
        return fallbackResult;
      }

      throw new ValidationError(
        "No transaction rows could be extracted from this PDF. Please ensure the document is a supported bank statement containing a transaction table."
      );
    }

    if (candidateRows.length === 0) {
      throw new ValidationError(
        "No transaction rows could be extracted from this PDF. Please ensure the document is a supported bank statement containing a transaction table."
      );
    }

    return {
      parsedSheet: {
        headers: columns.map((c) => c.name),
        rows: candidateRows,
        totalRows: candidateRows.length,
      },
      pages: pageLabels.length > 0 ? pageLabels : ["All Pages"],
      totalExtractablePages: numPages,
    };
  } finally {
    if (pdfParser) {
      try {
        await pdfParser.destroy();
      } catch (_) {}
    }
  }
}

/**
 * Fallback parser for text PDFs that use tab-separated or standard whitespace line representations.
 */
function attemptLineBasedRegexExtraction(_doc: any): ParsedPdfResult | null {
  // If the coordinate-based parser found no rows, return null so a clear error is surfaced
  return null;
}

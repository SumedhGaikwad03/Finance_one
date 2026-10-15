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
  if (/^val(?:ue)?\s*(?:date|dt\b)/i.test(clean)) return "Value Date";
  if (/^(?:transaction|txn|trans|booking|posting|entry)?\s*date$/i.test(clean) || /^date$/i.test(clean)) return "Date";
  if (/^narration/i.test(clean)) return "Narration";
  if (/^description/i.test(clean)) return "Description";
  if (/^particulars/i.test(clean)) return "Particulars";
  if (/details|memo|remarks/i.test(clean)) return "Narration";
  if (/^(?:chq|cheque|ref|reference|utr|txn\s*id)/i.test(clean)) return "Ref";
  if (/^(?:withdrawal|debit|dr\.?\b|spent|paid\s*out|outgoing)/i.test(clean)) return "Debit";
  if (/^(?:deposit|credit|cr\.?\b|received|paid\s*in|incoming)/i.test(clean)) return "Credit";
  if (/balance|bal\b|^closing\b/i.test(clean)) return "Balance";
  if (/^opening\b/i.test(clean)) return "Opening Balance";
  if (/amount|total|\bamt\.?\b/i.test(clean)) return "Amount";
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
    /^\d{1,2}[-/\s]+[A-Za-z]{3,9}[-/\s]+\d{2,4}/.test(trimmed) ||
    /^[A-Za-z]{3,9}[-/\s]+\d{1,2},?[-/\s]+\d{2,4}/.test(trimmed)
  );
}

interface HeaderCluster {
  str: string;
  minX: number;
  maxX: number;
}

function isKnownHeaderBoundary(word: string): boolean {
  return /^(?:date|value|narration|description|particulars|details|ref|chq|cheque|withdrawal|debit|deposit|credit|balance|closing|opening|amount|amt)$/i.test(
    word.replace(/[^a-z]/gi, "")
  );
}

function isNumericColumnName(name: string): boolean {
  return /Debit|Credit|Balance|Amount|Withdrawal|Deposit|Paid\s*Out|Paid\s*In/i.test(name);
}

/**
 * Merges horizontally adjacent header text items that form a multi-word column header.
 */
function clusterHeaderItems(items: any[]): HeaderCluster[] {
  if (items.length === 0) return [];
  const clusters: HeaderCluster[] = [];
  let current: { words: string[]; minX: number; maxX: number } | null = null;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const text = (it.str || "").trim();
    if (!text) continue;
    const x = it.transform[4];
    const w = typeof it.width === "number" && it.width > 0 ? it.width : text.length * 6;
    const right = x + w;

    if (!current) {
      current = { words: [text], minX: x, maxX: right };
      continue;
    }

    const gap = x - current.maxX;
    const combined = `${current.words.join(" ")} ${text}`.toLowerCase();
    const isMultiWord = /^(?:value\s*(?:date|dt)|val\s*(?:date|dt)|txn\s*date|transaction\s*date|trans\s*date|booking\s*date|posting\s*date|chq[\/\s._-]*ref[\/\s._-]*no|ref\s*no|reference\s*no|chq\s*no|cheque\s*no|paid\s*out|paid\s*in|withdrawal\s*(?:amt\.?|amount|\(?dr\.?\)?)?\s*(?:\(?(?:inr|rs\.?|usd|eur)\)?)?|debit\s*(?:amt\.?|amount|\(?dr\.?\)?)?\s*(?:\(?(?:inr|rs\.?|usd|eur)\)?)?|deposit\s*(?:amt\.?|amount|\(?cr\.?\)?)?\s*(?:\(?(?:inr|rs\.?|usd|eur)\)?)?|credit\s*(?:amt\.?|amount|\(?cr\.?\)?)?\s*(?:\(?(?:inr|rs\.?|usd|eur)\)?)?|closing\s*(?:bal|balance)\s*(?:\(?(?:inr|rs\.?|usd|eur)\)?)?|opening\s*(?:bal|balance)\s*(?:\(?(?:inr|rs\.?|usd|eur)\)?)?|available\s*(?:bal|balance)|running\s*(?:bal|balance)|statement\s*(?:bal|balance))$/i.test(
      combined
    );

    // Merge if explicitly matching a multi-word column header OR very tight spacing not crossing a known header boundary
    const shouldMerge = isMultiWord || (gap <= 8 && !isKnownHeaderBoundary(text));

    if (shouldMerge) {
      current.words.push(text);
      current.maxX = Math.max(current.maxX, right);
    } else {
      clusters.push({
        str: current.words.join(" "),
        minX: current.minX,
        maxX: current.maxX,
      });
      current = { words: [text], minX: x, maxX: right };
    }
  }

  if (current) {
    clusters.push({
      str: current.words.join(" "),
      minX: current.minX,
      maxX: current.maxX,
    });
  }

  return clusters;
}

/**
 * Associates a text item with its best-matching column definition.
 */
function matchItemToColumn(item: any, columns: ColumnDef[]): ColumnDef {
  const x = item.transform[4];
  const w = typeof item.width === "number" && item.width > 0 ? item.width : (item.str?.length || 1) * 5;
  const center = x + w / 2;
  const right = x + w;
  const str = (item.str || "").trim();

  // If this item looks like a monetary amount or a dash empty amount marker
  const isNumericAmount = /^-?[₹$€£]?\s*[\d,]+(?:\.\d+)?(?:\s*(?:dr|cr))?$/i.test(str);
  const isDashMarker = /^[-–—]{1,2}$/.test(str);

  // 1. Direct match: center is within column boundaries
  for (const col of columns) {
    if (center >= col.minX && center < col.maxX) {
      return col;
    }
  }

  // 2. For right-aligned amounts: right edge aligns near the column boundary
  if (isNumericAmount || isDashMarker) {
    for (const col of columns) {
      if (isNumericColumnName(col.name)) {
        if (x >= col.minX - 25 && right <= col.maxX + 12 && center >= col.minX - 10) {
          return col;
        }
      }
    }
  }

  // 3. Right edge within bounds fallback
  for (const col of columns) {
    if (x >= col.minX - 5 && right <= col.maxX + 5) {
      return col;
    }
  }

  // 4. Fallback: closest column by distance to center
  let bestCol = columns[0];
  let minDistance = Infinity;
  for (const col of columns) {
    const colMid = (col.minX + Math.min(col.maxX, 800)) / 2;
    const dist = Math.abs(center - colMid);
    if (dist < minDistance) {
      minDistance = dist;
      bestCol = col;
    }
  }
  return bestCol;
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
        if (!linesMap.has(y)) continue;
        const rawItems = linesMap.get(y)!;
        // Expand any single item that contains multiple text tokens separated by 2+ spaces
        const items: any[] = [];
        for (const it of rawItems) {
          const str = it.str || "";
          if (/\S\s{2,}\S/.test(str)) {
            const regex = /(\S+)/g;
            let m: RegExpExecArray | null;
            const totalLen = str.length;
            const baseW = typeof it.width === "number" && it.width > 0 ? it.width : totalLen * 5;
            const baseX = it.transform[4];
            while ((m = regex.exec(str)) !== null) {
              const token = m[1];
              const tokenIdx = m.index;
              const tokenW = (token.length / totalLen) * baseW;
              const tokenX = baseX + (tokenIdx / totalLen) * baseW;
              items.push({
                ...it,
                str: token,
                width: tokenW,
                transform: [it.transform[0], it.transform[1], it.transform[2], it.transform[3], tokenX, it.transform[5]],
              });
            }
          } else {
            items.push(it);
          }
        }
        items.sort((a, b) => a.transform[4] - b.transform[4]);
        const lineText = items.map((it) => it.str.trim()).join(" ");

        // Header detection on first page or before columns are initialized
        if (columns.length === 0) {
          const hasDate = items.some((it) => /(?:date|\bdt\b)/i.test(it.str));
          const hasAmountOrDesc = items.some((it) =>
            /narration|description|particulars|details|debit|credit|amount|withdrawal|deposit|balance/i.test(it.str)
          );

          if (hasDate && hasAmountOrDesc) {
            // Check for multi-line table headers (e.g. Line 1: Withdrawal, Line 2: Amt.)
            const yIndex = sortedY.indexOf(y);
            const nextY = yIndex >= 0 && yIndex < sortedY.length - 1 ? sortedY[yIndex + 1] : null;
            let headerItems = items.map((it) => ({ ...it, str: it.str }));
            let consumedNextY = false;

            if (nextY !== null && y - nextY <= 24) {
              const nextLineItems = linesMap.get(nextY)!;
              const hasDateInNext = nextLineItems.some((it) => isDateToken(it.str));
              const hasContinuationWord = nextLineItems.some((it) =>
                /^(?:amt\.?|amount|dt\.?|balance|bal\.?|no\.?|cr\.?|dr\.?|\(?inr\)?|\(?rs\.?\)?)$/i.test(it.str.trim())
              );

              if (!hasDateInNext && hasContinuationWord) {
                for (const subItem of nextLineItems) {
                  const subX = subItem.transform[4];
                  let closest: any = null;
                  let minD = Infinity;
                  for (const hItem of headerItems) {
                    const hX = hItem.transform[4];
                    const d = Math.abs(subX - hX);
                    if (d < minD && d < 60) {
                      minD = d;
                      closest = hItem;
                    }
                  }
                  if (closest) {
                    closest.str = `${closest.str} ${subItem.str}`.trim();
                  } else {
                    headerItems.push({ ...subItem, str: subItem.str });
                  }
                }
                headerItems.sort((a, b) => a.transform[4] - b.transform[4]);
                consumedNextY = true;
              }
            }

            const clusters = clusterHeaderItems(headerItems);
            if (clusters.length >= 2) {
              for (let i = 0; i < clusters.length; i++) {
                const c = clusters[i];
                const name = normalizeHeaderName(c.str);
                if (name === "Narration" || name === "Description" || name === "Particulars") {
                  descColName = name;
                }
                const isNum = isNumericColumnName(name);
                const prev = i > 0 ? clusters[i - 1] : null;
                const next = i < clusters.length - 1 ? clusters[i + 1] : null;

                let minX: number;
                if (i === 0) {
                  minX = 0;
                } else if (isNum) {
                  const prevIsNum = isNumericColumnName(normalizeHeaderName(prev!.str));
                  minX = prevIsNum ? c.minX : (prev!.maxX + c.minX) / 2;
                } else {
                  minX = (prev!.maxX + c.minX) / 2;
                }

                let maxX: number;
                if (i === clusters.length - 1) {
                  maxX = 9999;
                } else if (isNum || isNumericColumnName(normalizeHeaderName(next!.str))) {
                  maxX = next!.minX;
                } else {
                  maxX = (c.maxX + next!.minX) / 2;
                }

                columns.push({ name, minX, maxX });
              }
              if (consumedNextY) {
                linesMap.delete(nextY!);
              }
              continue;
            }
          }
        }

        // Process data lines once columns are detected
        if (columns.length > 0) {
          // Check for repeated table headers across pages
          const isRepeatedHeader =
            items.some((it) => /(?:date|\bdt\b)/i.test(it.str)) &&
            items.some((it) => /narration|description|particulars|details|debit|credit|amount|withdrawal|deposit/i.test(it.str));
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
            const matchedCol = matchItemToColumn(item, columns);
            const cleanVal = sanitizeCellValue(item.str);
            if (rowData[matchedCol.name]) {
              rowData[matchedCol.name] += " " + cleanVal;
            } else {
              rowData[matchedCol.name] = cleanVal;
            }
          }

          const dateVal =
            rowData["Date"] ||
            rowData["Value Date"] ||
            Object.entries(rowData).find(([k]) => /date/i.test(k))?.[1] ||
            "";
          const hasDate = isDateToken(dateVal);

          if (hasDate) {
            // Explicit new transaction candidate row
            candidateRows.push(rowData);
          } else if (candidateRows.length > 0) {
            // Check for summary or balance rows
            const isSummary =
              /^(?:opening|closing|current|available|ledger|clear)\s*balance/i.test(lineText) ||
              /^(?:total|subtotal|summary|brought\s*forward|carried\s*forward|b\/f|c\/f|grand\s*total)/i.test(lineText) ||
              /balance\s*(?:b\/f|c\/f|as\s*on)/i.test(lineText);

            if (isSummary) {
              candidateRows.push(rowData);
            } else {
              // Wrapped continuation line: stitch into previous row
              const prevRow = candidateRows[candidateRows.length - 1];

              const appendText = rowData[descColName] || lineText.trim();
              if (appendText) {
                prevRow[descColName] = (prevRow[descColName] + " " + appendText).trim();
              }

              if (!prevRow["Ref"] && rowData["Ref"]) {
                prevRow["Ref"] = rowData["Ref"];
              }

              for (const col of ["Debit", "Credit", "Amount", "Balance"]) {
                if ((!prevRow[col] || prevRow[col] === "-") && rowData[col] && rowData[col] !== "-") {
                  prevRow[col] = rowData[col];
                }
              }
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

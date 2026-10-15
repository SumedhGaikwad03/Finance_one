import { Prisma } from "../../generated/prisma/client";
import { Category, Priority, TransactionSource } from "../../generated/prisma/enums";
import { normalizeTitle, normalizeNotes, normalizeCategory, normalizePriority } from "../../ingestion/normalizers/transaction.normalizer";
import { IngestionSourceInput } from "../../ingestion/types/ingestion.types";
import { ColumnMapping, ImportOptions, PreviewRowItem, RowClassificationStatus } from "../types/import.types";

/**
 * Checks if a string represents a balance or summary row.
 */
function isSummaryOrBalanceRow(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  const summaryPatterns = [
    /^(opening|closing|current|available|ledger|clear)\s*balance/i,
    /^(total|subtotal|summary|brought forward|carried forward|b\/f|c\/f)$/i,
    /^(statement|account)\s*(summary|period|overview)/i,
    /^balance\s*(b\/f|c\/f|as on)/i,
    /^grand\s*total/i,
  ];

  return summaryPatterns.some((pattern) => pattern.test(normalized));
}

/**
 * Parses numeric monetary values from string representations.
 * Handles negative signs, parentheses, commas, and currency symbols.
 */
export function parseStatementAmount(rawVal: unknown): { value: number | null; isNegative: boolean } {
  if (rawVal === null || rawVal === undefined) {
    return { value: null, isNegative: false };
  }

  if (typeof rawVal === "number") {
    if (!Number.isFinite(rawVal)) return { value: null, isNegative: false };
    return { value: Math.abs(rawVal), isNegative: rawVal < 0 };
  }

  let str = String(rawVal).trim();
  if (!str) return { value: null, isNegative: false };

  // Check for parentheses indicating negative: e.g. (150.00)
  let isNegative = false;
  if (/^\(.*\)$/.test(str)) {
    isNegative = true;
    str = str.replace(/[()]/g, "").trim();
  } else if (/^[-–—]/.test(str)) {
    isNegative = true;
    str = str.replace(/^[-–—]/, "").trim();
  } else if (/[-–—]$/.test(str)) {
    // Some bank statements put negative sign at the end: 150.00-
    isNegative = true;
    str = str.replace(/[-–—]$/, "").trim();
  }

  // Check for Dr / Cr indicators commonly found in bank statements (e.g. 150.00 Dr, 500.00 Cr)
  if (/\bdr\b/i.test(str)) {
    isNegative = true;
    str = str.replace(/\bdr\b/gi, "").trim();
  } else if (/\bcr\b/i.test(str)) {
    isNegative = false;
    str = str.replace(/\bcr\b/gi, "").trim();
  }

  // Strip currency symbols, commas, spaces
  const cleaned = str.replace(/[₹$€£,\s]/g, "");
  if (!cleaned || isNaN(Number(cleaned))) {
    return { value: null, isNegative: false };
  }

  const num = Math.abs(Number(cleaned));
  return { value: num, isNegative };
}

/**
 * Robust date parser supporting ISO, Commonwealth (DD/MM/YYYY), US (MM/DD/YYYY), and textual formats.
 */
export function parseStatementDate(rawVal: unknown, preferredFormat: string = "AUTO"): Date | null {
  if (!rawVal) return null;

  if (rawVal instanceof Date) {
    return isNaN(rawVal.getTime()) ? null : rawVal;
  }

  // Handle Excel Serial Number (e.g. 45580 -> ~2024)
  if (typeof rawVal === "number" && rawVal > 25000 && rawVal < 70000) {
    // Excel epoch starts at 1899-12-30
    const msPerDay = 24 * 60 * 60 * 1000;
    const epoch = new Date(1899, 11, 30).getTime();
    const date = new Date(epoch + rawVal * msPerDay);
    if (!isNaN(date.getTime())) return date;
  }

  const str = String(rawVal).trim();
  if (!str) return null;

  // 1. ISO 8601 (YYYY-MM-DD or YYYY/MM/DD)
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const date = new Date(Date.UTC(year, month, day));
    if (!isNaN(date.getTime()) && date.getUTCFullYear() === year) {
      return date;
    }
  }

  // 2. Textual month formats: e.g. "15-Oct-2026", "15 Oct 2026", "Oct 15, 2026"
  const MONTH_MAP: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  const dmyText = str.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,9})[-/\s](\d{2,4})/);
  if (dmyText) {
    const mKey = dmyText[2].toLowerCase();
    if (MONTH_MAP[mKey] !== undefined) {
      const day = parseInt(dmyText[1], 10);
      const month = MONTH_MAP[mKey];
      let year = parseInt(dmyText[3], 10);
      if (year < 100) year = year < 50 ? 2000 + year : 1900 + year;
      const date = new Date(Date.UTC(year, month, day));
      if (!isNaN(date.getTime()) && date.getUTCDate() === day) {
        return date;
      }
    }
  }

  const mdyText = str.match(/^([A-Za-z]{3,9})[-/\s](\d{1,2})(?:,)?[-/\s](\d{2,4})/);
  if (mdyText) {
    const mKey = mdyText[1].toLowerCase();
    if (MONTH_MAP[mKey] !== undefined) {
      const day = parseInt(mdyText[2], 10);
      const month = MONTH_MAP[mKey];
      let year = parseInt(mdyText[3], 10);
      if (year < 100) year = year < 50 ? 2000 + year : 1900 + year;
      const date = new Date(Date.UTC(year, month, day));
      if (!isNaN(date.getTime()) && date.getUTCDate() === day) {
        return date;
      }
    }
  }

  // 3. Day-Month-Year vs Month-Day-Year
  const partsMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (partsMatch) {
    let p1 = parseInt(partsMatch[1], 10);
    let p2 = parseInt(partsMatch[2], 10);
    let year = parseInt(partsMatch[3], 10);

    // Expand 2-digit year (e.g. 24 -> 2024, 99 -> 1999)
    if (year < 100) {
      year = year < 50 ? 2000 + year : 1900 + year;
    }

    let day = p1;
    let month = p2;

    if (preferredFormat === "MM/DD/YYYY" || (p1 <= 12 && p2 > 12)) {
      // US Format: MM/DD/YYYY
      month = p1;
      day = p2;
    } else {
      // Default to DD/MM/YYYY (Commonwealth / Indian / European standard for bank statements)
      day = p1;
      month = p2;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(Date.UTC(year, month - 1, day));
      if (!isNaN(date.getTime()) && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
        return date;
      }
    }
  }

  // 4. Native JS date parse fallback
  const textDate = new Date(str);
  if (!isNaN(textDate.getTime()) && textDate.getFullYear() >= 2000) {
    return textDate;
  }

  return null;
}

export interface TransformedRowResult {
  status: RowClassificationStatus;
  reasons: string[];
  mapped: {
    title: string | null;
    amount: number | null;
    transactionDate: string | null;
    category?: Category;
    priority?: Priority;
    externalId?: string | null;
    notes?: string | null;
  };
  candidateInput?: IngestionSourceInput;
}

/**
 * Transforms a single raw CSV/XLSX row using the specified column mapping and options.
 */
export function transformRow(
  rawRow: Record<string, string>,
  mapping: ColumnMapping,
  options: ImportOptions = {},
  rowIndex: number,
  sourceFilename: string = "statement"
): TransformedRowResult {
  const reasons: string[] = [];
  const rawTitle = rawRow[mapping.descriptionColumn] || "";
  const title = normalizeTitle(rawTitle);

  // Parse Date
  const rawDateStr = rawRow[mapping.dateColumn];
  const parsedDate = parseStatementDate(rawDateStr, options.dateFormat || "AUTO");
  let isoDateStr: string | null = null;

  if (!parsedDate) {
    reasons.push(`Missing or unparseable date in column '${mapping.dateColumn}' (value: '${rawDateStr || ""}')`);
  } else {
    // Validate year bounds
    const year = parsedDate.getUTCFullYear();
    const currentYear = new Date().getUTCFullYear();
    if (year < 2000 || year > currentYear + 1) {
      reasons.push(`Transaction date '${parsedDate.toISOString().slice(0, 10)}' is outside allowed financial bounds (2000 to ${currentYear + 1})`);
    } else {
      isoDateStr = parsedDate.toISOString();
    }
  }

  // Determine Amount and Expense Status
  let detectedAmount: number | null = null;
  let isExpense = false;
  let isCreditOrIncome = false;

  if (mapping.amountMode === "debit_credit") {
    const rawDebit = mapping.debitColumn ? rawRow[mapping.debitColumn] : "";
    const rawCredit = mapping.creditColumn ? rawRow[mapping.creditColumn] : "";

    const debitParsed = parseStatementAmount(rawDebit);
    const creditParsed = parseStatementAmount(rawCredit);

    const hasDebit = debitParsed.value !== null && debitParsed.value > 0;
    const hasCredit = creditParsed.value !== null && creditParsed.value > 0;

    if (hasDebit && !hasCredit) {
      isExpense = true;
      detectedAmount = debitParsed.value;
    } else if (hasCredit && !hasDebit) {
      isCreditOrIncome = true;
      detectedAmount = creditParsed.value;
    } else if (!hasDebit && !hasCredit) {
      const rawDebitClean = String(rawDebit || "").trim();
      const rawCreditClean = String(rawCredit || "").trim();
      const isDebitEmpty = !rawDebitClean || /^[-–—]+$/.test(rawDebitClean);
      const isCreditEmpty = !rawCreditClean || /^[-–—]+$/.test(rawCreditClean);

      if (!isDebitEmpty && debitParsed.value === null) {
        reasons.push(`Malformed amount in Debit column '${mapping.debitColumn}' (value: '${rawDebit}')`);
      } else if (!isCreditEmpty && creditParsed.value === null) {
        reasons.push(`Malformed amount in Credit column '${mapping.creditColumn}' (value: '${rawCredit}')`);
      } else if (debitParsed.value === 0 && creditParsed.value === 0) {
        reasons.push("Row contains zero amount in both Debit and Credit columns");
      } else {
        reasons.push("Row contains no amount in either Debit or Credit columns");
      }
    } else {
      // Both debit and credit are populated
      reasons.push("Ambiguous row: both Debit and Credit columns have non-zero amounts");
    }
  } else {
    // Single Amount Mode
    const rawAmountVal = mapping.amountColumn ? rawRow[mapping.amountColumn] : "";
    const parsed = parseStatementAmount(rawAmountVal);

    if (parsed.value === null || parsed.value === 0) {
      reasons.push(`Missing, zero, or unparseable amount in column '${mapping.amountColumn}' (value: '${rawAmountVal || ""}')`);
    } else {
      let defaultConvention = "negative_is_expense";
      if (mapping.amountColumn && /debit|withdrawal|spent|paid\s*out|\bdr\b/i.test(mapping.amountColumn)) {
        defaultConvention = "positive_is_expense";
      } else if (mapping.amountColumn && /credit|deposit|paid\s*in|\bcr\b/i.test(mapping.amountColumn)) {
        defaultConvention = "negative_is_expense";
      }

      const convention = options.amountConvention || defaultConvention;

      if (convention === "negative_is_expense") {
        if (parsed.isNegative) {
          isExpense = true;
          detectedAmount = parsed.value;
        } else {
          isCreditOrIncome = true;
          detectedAmount = parsed.value;
        }
      } else if (convention === "positive_is_expense") {
        if (!parsed.isNegative) {
          isExpense = true;
          detectedAmount = parsed.value;
        } else {
          isCreditOrIncome = true;
          detectedAmount = parsed.value;
        }
      } else {
        // all_positive
        isExpense = true;
        detectedAmount = parsed.value;
      }
    }
  }

  // Check for summary or balance row
  if (rawTitle && isSummaryOrBalanceRow(rawTitle)) {
    return {
      status: "EXCLUDED_NON_EXPENSE",
      reasons: ["Statement summary or balance header/footer row"],
      mapped: {
        title: rawTitle,
        amount: detectedAmount,
        transactionDate: isoDateStr,
      },
    };
  }

  // Check for internal transfer or liquidity rebalancing row
  const isTransfer = /\b(internal\s*transfer|fund\s*transfer|ac\s*trf|self\s*transfer|trf\s*to\s*self)\b/i.test(rawTitle);
  if (isTransfer) {
    return {
      status: "EXCLUDED_NON_EXPENSE",
      reasons: ["Internal account transfer or liquidity rebalancing - excluded from expense ledger"],
      mapped: {
        title: rawTitle,
        amount: detectedAmount,
        transactionDate: isoDateStr,
      },
    };
  }

  // Title validation
  if (!title) {
    reasons.push(`Missing description or title in column '${mapping.descriptionColumn}'`);
  }

  // If identified as credit/income: Exclude cleanly
  if (isCreditOrIncome) {
    return {
      status: "EXCLUDED_NON_EXPENSE",
      reasons: [
        `Credit / deposit entry (amount: ${detectedAmount ? detectedAmount.toFixed(2) : ""}) - excluded from expense ledger`,
      ],
      mapped: {
        title: title || rawTitle,
        amount: detectedAmount,
        transactionDate: isoDateStr,
      },
    };
  }

  // If invalid
  if (reasons.length > 0 || !detectedAmount || !isoDateStr || !title) {
    return {
      status: "INVALID",
      reasons,
      mapped: {
        title: title || rawTitle,
        amount: detectedAmount,
        transactionDate: isoDateStr,
      },
    };
  }

  // Optional fields
  const externalId = mapping.externalIdColumn
    ? rawRow[mapping.externalIdColumn]?.trim() || null
    : null;

  const category = mapping.categoryColumn
    ? normalizeCategory(rawRow[mapping.categoryColumn])
    : Category.OTHER;

  const priority = mapping.priorityColumn
    ? normalizePriority(rawRow[mapping.priorityColumn])
    : Priority.UNCLASSIFIED;

  const notes = mapping.notesColumn
    ? normalizeNotes(rawRow[mapping.notesColumn])
    : null;

  // Candidate input conforming to Phase 2 IngestionSourceInput contract
  const candidateInput: IngestionSourceInput = {
    title,
    amount: new Prisma.Decimal(detectedAmount),
    transactionDate: new Date(isoDateStr),
    category,
    priority,
    notes: notes || undefined,
    source: TransactionSource.CSV_IMPORT,
    externalId: externalId || undefined,
    sourceMetadata: {
      sourceFilename,
      sourceRowIndex: rowIndex,
      rawRow,
      isCategoryUnclassified: !mapping.categoryColumn,
      isPriorityUnclassified: !mapping.priorityColumn,
    },
    allowPotentialDuplicate: Boolean(options.allowPotentialDuplicates),
  };

  return {
    status: "READY",
    reasons: [],
    mapped: {
      title,
      amount: detectedAmount,
      transactionDate: isoDateStr,
      category,
      priority,
      externalId,
      notes,
    },
    candidateInput,
  };
}

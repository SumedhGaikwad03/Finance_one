import { ColumnMapping } from "../types/import.types";

/**
 * Normalizes a header string for heuristic fuzzy matching.
 */
function cleanHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Matches a list of candidates against header strings.
 */
function findBestMatch(headers: string[], patterns: (string | RegExp)[]): string | undefined {
  for (const pattern of patterns) {
    if (typeof pattern === "string") {
      const target = cleanHeader(pattern);
      const match = headers.find((h) => cleanHeader(h) === target);
      if (match) return match;
    } else {
      const match = headers.find((h) => pattern.test(h.trim()));
      if (match) return match;
    }
  }

  // Substring match fallback
  for (const pattern of patterns) {
    if (typeof pattern === "string") {
      const target = cleanHeader(pattern);
      const match = headers.find((h) => cleanHeader(h).includes(target));
      if (match) return match;
    }
  }

  return undefined;
}

/**
 * Suggests an initial ColumnMapping based on detected headers.
 */
export function suggestColumnMapping(headers: string[]): ColumnMapping {
  // Date patterns
  const dateCol = findBestMatch(headers, [
    /^transaction\s*date$/i,
    /^txn\s*date$/i,
    /^posting\s*date$/i,
    /^value\s*date$/i,
    /^date$/i,
    /date/i,
    /time/i,
  ]) || headers[0] || "";

  // Description / Narration patterns
  const descCol = findBestMatch(headers, [
    /^description$/i,
    /^narration$/i,
    /^particulars$/i,
    /^transaction\s*details$/i,
    /^merchant$/i,
    /^payee$/i,
    /^details$/i,
    /^remarks$/i,
    /description/i,
    /narration/i,
    /particulars/i,
    /title/i,
  ]) || headers.find((h) => h !== dateCol) || headers[1] || "";

  // Check for separate Debit / Credit columns
  const debitCol = findBestMatch(headers, [
    /^withdrawal\s*\(?dr\)?/i,
    /^debit\s*amount$/i,
    /^debit$/i,
    /^withdrawal$/i,
    /^dr$/i,
    /^paid\s*out$/i,
    /^spent$/i,
  ]);

  const creditCol = findBestMatch(headers, [
    /^deposit\s*\(?cr\)?/i,
    /^credit\s*amount$/i,
    /^credit$/i,
    /^deposit$/i,
    /^cr$/i,
    /^paid\s*in$/i,
  ]);

  // Check for generic Amount column (explicitly exclude balance columns)
  const nonBalanceHeaders = headers.filter((h) => !/balance|bal\b/i.test(h));
  const amountCol = findBestMatch(nonBalanceHeaders, [
    /^amount$/i,
    /^net\s*amount$/i,
    /^transaction\s*amount$/i,
    /^total$/i,
    /amount/i,
  ]);

  // Reference / External ID patterns
  const externalIdCol = findBestMatch(headers, [
    /^chq[\/\s_-]*ref[\/\s_-]*no/i,
    /^transaction\s*id$/i,
    /^txn\s*id$/i,
    /^reference\s*no$/i,
    /^reference\s*id$/i,
    /^ref\s*no$/i,
    /^ref\s*id$/i,
    /^cheque\s*no$/i,
    /^utr$/i,
    /^order\s*id$/i,
    /reference/i,
  ]);

  // Category patterns
  const categoryCol = findBestMatch(headers, [
    /^category$/i,
    /^category\s*name$/i,
    /^expense\s*category$/i,
    /^tag$/i,
  ]);

  // Decide amount mode: if both debit & credit are found, prefer debit_credit mode
  if (debitCol && creditCol) {
    return {
      descriptionColumn: descCol,
      amountMode: "debit_credit",
      debitColumn: debitCol,
      creditColumn: creditCol,
      dateColumn: dateCol,
      externalIdColumn: externalIdCol,
      categoryColumn: categoryCol,
    };
  }

  return {
    descriptionColumn: descCol,
    amountMode: "single_amount",
    amountColumn: amountCol || debitCol || creditCol || "",
    dateColumn: dateCol,
    externalIdColumn: externalIdCol,
    categoryColumn: categoryCol,
  };
}

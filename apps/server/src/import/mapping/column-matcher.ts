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
  // 1. Exact and regex matches
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

  // 2. Substring match fallback (require minimum target length of 4 chars to avoid false positives)
  for (const pattern of patterns) {
    if (typeof pattern === "string") {
      const target = cleanHeader(pattern);
      if (target.length >= 4) {
        const match = headers.find((h) => cleanHeader(h).includes(target));
        if (match) return match;
      }
    }
  }

  return undefined;
}

/**
 * Suggests an initial ColumnMapping based on detected headers.
 */
export function suggestColumnMapping(headers: string[]): ColumnMapping {
  // Date patterns: Transaction / Posting Date MUST take strict priority over Value Date
  const dateCol = findBestMatch(headers, [
    /^(?:transaction|txn|trans)\s*date$/i,
    /^date$/i,
    /^(?:booking|posting|entry)\s*date$/i,
    /^timestamp$/i,
    /^value\s*date$/i,
  ]) || headers.find((h) => !/balance/i.test(h)) || headers[0] || "";

  // Description / Narration patterns
  const descCol = findBestMatch(headers, [
    /^narration$/i,
    /^description$/i,
    /^particulars$/i,
    /^transaction\s*(?:details|description|particulars|info|text)$/i,
    /^merchant(?:\s*name)?$/i,
    /^payee(?:\s*name)?$/i,
    /^beneficiary(?:\s*name)?$/i,
    /^details$/i,
    /^remarks$/i,
    /^memo$/i,
    /description/i,
    /narration/i,
    /particulars/i,
    /title/i,
  ]) || headers.find((h) => h !== dateCol) || headers[1] || "";

  // Check for separate Debit / Credit columns
  const debitCol = findBestMatch(headers, [
    /^(?:withdrawal|debit|dr\.?)\s*(?:amt\.?|amount|\(?dr\.?\)?)?$/i,
    /^withdrawals?$/i,
    /^debits?$/i,
    /^dr\.?$/i,
    /^paid\s*out$/i,
    /^spent$/i,
    /^outgoing$/i,
    /withdrawal/i,
    /debit/i,
    /\bdr\b/i,
  ]);

  const creditCol = findBestMatch(headers, [
    /^(?:deposit|credit|cr\.?)\s*(?:amt\.?|amount|\(?cr\.?\)?)?$/i,
    /^deposits?$/i,
    /^credits?$/i,
    /^cr\.?$/i,
    /^paid\s*in$/i,
    /^incoming$/i,
    /^received$/i,
    /deposit/i,
    /credit/i,
    /\bcr\b/i,
  ]);

  // Check for generic Amount column (strictly exclude balance headers)
  const nonBalanceHeaders = headers.filter((h) => !/balance|bal\b|^closing|^opening/i.test(h));
  const amountCol = findBestMatch(nonBalanceHeaders, [
    /^(?:transaction|txn|net|bill|statement)?\s*(?:amount|amt\.?)$/i,
    /^(?:amount|amt\.?)$/i,
    /^total$/i,
    /amount/i,
    /\bamt\b/i,
  ]);

  // Reference / External ID patterns
  const externalIdCol = findBestMatch(headers, [
    /^chq[\/\s._-]*ref[\/\s._-]*no/i,
    /^(?:transaction|txn|reference|ref|cheque|chq|order)\s*(?:id|no|num|number)?$/i,
    /^utr(?:\s*no)?$/i,
    /^receipt\s*(?:id|no)?$/i,
    /reference/i,
  ]);

  // Category patterns
  const categoryCol = findBestMatch(headers, [
    /^(?:expense\s*)?category(?:\s*name)?$/i,
    /^category$/i,
    /^tag$/i,
  ]);

  // Priority / Spending Tier patterns
  const priorityCol = findBestMatch(headers, [
    /^(?:spending\s*)?tier$/i,
    /^priority$/i,
    /^necessity$/i,
    /^urgency$/i,
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
      priorityColumn: priorityCol,
    };
  }

  return {
    descriptionColumn: descCol,
    amountMode: "single_amount",
    amountColumn: amountCol || debitCol || creditCol || "",
    dateColumn: dateCol,
    externalIdColumn: externalIdCol,
    categoryColumn: categoryCol,
    priorityColumn: priorityCol,
  };
}

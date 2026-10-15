import { TransformedRowResult } from "../mapping/row-transformer";
import { parseStatementAmount } from "../mapping/row-transformer";

export interface ReconciliationReport {
  status: "RECONCILED" | "MISMATCH" | "NOT_AVAILABLE";
  reconciled: boolean | null;
  openingBalance?: number | null;
  closingBalance?: number | null;
  computedClosingBalance?: number | null;
  discrepancy?: number | null;
  totalDebits: number;
  totalCredits: number;
  message: string;
}

/**
 * Validates running balances using mathematical reconciliation:
 * Opening Balance - Sum(Debits) + Sum(Credits) === Closing Balance
 */
export function reconcileStatement(
  transformedRows: TransformedRowResult[],
  rawRows: Record<string, string>[],
  balanceColumn?: string
): ReconciliationReport {
  let totalDebits = 0;
  let totalCredits = 0;
  let openingBalance: number | null = null;
  let closingBalance: number | null = null;

  // 1. Scan for explicit Opening Balance and Closing Balance rows
  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const transformed = transformedRows[i];
    const rowText = Object.values(raw).join(" ");

    // Check for opening balance markers
    const isOpeningRow =
      /opening\s*bal|brought\s*forward|bal(?:ance)?\s*b\/?f|previous\s*balance/i.test(rowText);

    // Check for closing balance markers
    const isClosingRow =
      /closing\s*bal|carried\s*forward|bal(?:ance)?\s*c\/?f|ending\s*balance|statement\s*balance|new\s*balance/i.test(rowText);

    let amountVal: number | null = null;
    if (balanceColumn && raw[balanceColumn]) {
      const parsedBal = parseStatementAmount(raw[balanceColumn]);
      if (parsedBal.value !== null) {
        amountVal = parsedBal.isNegative ? -parsedBal.value : parsedBal.value;
      }
    }
    if (amountVal === null && transformed?.mapped?.amount !== null && transformed?.mapped?.amount !== undefined) {
      amountVal = transformed.mapped.amount;
    }

    if (isOpeningRow && openingBalance === null && amountVal !== null) {
      openingBalance = amountVal;
      continue;
    }

    if (isClosingRow && amountVal !== null) {
      closingBalance = amountVal;
      continue;
    }

    // Accumulate debits and credits for non-balance rows
    if (transformed) {
      if (transformed.status === "READY") {
        // Valid expense debit
        if (transformed.mapped.amount !== null) {
          totalDebits += transformed.mapped.amount;
        }
      } else if (transformed.status === "EXCLUDED_NON_EXPENSE") {
        // Excluded credit deposit (ignore opening/closing balance rows)
        const isCredit = transformed.reasons.some((r) =>
          /credit|deposit/i.test(r)
        );
        if (isCredit && transformed.mapped.amount !== null && !isOpeningRow && !isClosingRow) {
          totalCredits += transformed.mapped.amount;
        }
      }
    }
  }

  // 2. Fallback: If balanceColumn is provided, deduce opening & closing from row balances
  if (balanceColumn) {
    const balances: { index: number; bal: number }[] = [];
    for (let i = 0; i < rawRows.length; i++) {
      const rawVal = rawRows[i][balanceColumn];
      if (rawVal) {
        const parsed = parseStatementAmount(rawVal);
        if (parsed.value !== null) {
          balances.push({
            index: i,
            bal: parsed.isNegative ? -parsed.value : parsed.value,
          });
        }
      }
    }

    if (balances.length > 0) {
      if (closingBalance === null) {
        closingBalance = balances[balances.length - 1].bal;
      }
      if (openingBalance === null && balances.length >= 2) {
        // Deduce opening balance from first transaction
        const firstTx = transformedRows[balances[0].index];
        const firstBal = balances[0].bal;
        if (firstTx?.status === "READY" && firstTx.mapped.amount) {
          // If debit: Opening = Balance + Debit
          openingBalance = firstBal + firstTx.mapped.amount;
        } else if (firstTx?.mapped.amount) {
          // If credit: Opening = Balance - Credit
          openingBalance = firstBal - firstTx.mapped.amount;
        }
      }
    }
  }

  // 3. Evaluate Reconciliation if both opening and closing balances were identified
  if (openingBalance !== null && closingBalance !== null) {
    const roundedOpening = Math.round(openingBalance * 100) / 100;
    const roundedClosing = Math.round(closingBalance * 100) / 100;
    const roundedDebits = Math.round(totalDebits * 100) / 100;
    const roundedCredits = Math.round(totalCredits * 100) / 100;

    // Standard Bank Account: Closing = Opening - Debits + Credits
    const computedClosingStandard = Math.round((roundedOpening - roundedDebits + roundedCredits) * 100) / 100;
    const discrepancyStandard = Math.round(Math.abs(roundedClosing - computedClosingStandard) * 100) / 100;

    // Credit Card Statement: Closing = Opening + Debits - Credits
    const computedClosingCard = Math.round((roundedOpening + roundedDebits - roundedCredits) * 100) / 100;
    const discrepancyCard = Math.round(Math.abs(roundedClosing - computedClosingCard) * 100) / 100;

    if (discrepancyStandard <= 0.02) {
      return {
        status: "RECONCILED",
        reconciled: true,
        openingBalance: roundedOpening,
        closingBalance: roundedClosing,
        computedClosingBalance: computedClosingStandard,
        discrepancy: 0,
        totalDebits: roundedDebits,
        totalCredits: roundedCredits,
        message: `Statement balances reconcile mathematically: opening balance (₹${roundedOpening.toFixed(2)}) - debits (₹${roundedDebits.toFixed(2)}) + credits (₹${roundedCredits.toFixed(2)}) = closing balance (₹${roundedClosing.toFixed(2)}).`,
      };
    }

    if (discrepancyCard <= 0.02) {
      return {
        status: "RECONCILED",
        reconciled: true,
        openingBalance: roundedOpening,
        closingBalance: roundedClosing,
        computedClosingBalance: computedClosingCard,
        discrepancy: 0,
        totalDebits: roundedDebits,
        totalCredits: roundedCredits,
        message: `Statement balances reconcile mathematically: opening balance (₹${roundedOpening.toFixed(2)}) + charges (₹${roundedDebits.toFixed(2)}) - payments (₹${roundedCredits.toFixed(2)}) = closing balance (₹${roundedClosing.toFixed(2)}).`,
      };
    }

    return {
      status: "MISMATCH",
      reconciled: false,
      openingBalance: roundedOpening,
      closingBalance: roundedClosing,
      computedClosingBalance: computedClosingStandard,
      discrepancy: discrepancyStandard,
      totalDebits: roundedDebits,
      totalCredits: roundedCredits,
      message: `Reconciliation discrepancy detected: expected closing balance of ₹${computedClosingStandard.toFixed(2)}, but statement reports ₹${roundedClosing.toFixed(2)} (difference of ₹${discrepancyStandard.toFixed(2)}). Some transactions may be missing or misparsed.`,
    };
  }

  // 4. Balances unavailable
  return {
    status: "NOT_AVAILABLE",
    reconciled: null,
    openingBalance: openingBalance ?? null,
    closingBalance: closingBalance ?? null,
    computedClosingBalance: null,
    discrepancy: null,
    totalDebits: Math.round(totalDebits * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100,
    message: "Statement does not contain complete opening and closing balance data for automated mathematical reconciliation.",
  };
}

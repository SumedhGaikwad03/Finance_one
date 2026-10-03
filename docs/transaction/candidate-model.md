# Transaction Candidate Model

A `TransactionCandidate` represents a provisional financial record extracted from an input source prior to validation, normalization, and persistence.

---

## 1. Purpose & Conceptual Model

A `TransactionCandidate` is **not** a persisted transaction. It acts as a decoupled Data Transfer Object (DTO) holding raw or semi-structured data before it is vetted by domain validation.

```text
Raw Signal ──> [ Adapter ] ──> TransactionCandidate ──> [ Normalizer ] ──> Validated Transaction
```

---

## 2. Proposed Candidate Schema

```typescript
export type CandidateSource = "MANUAL" | "SHARE" | "SCREENSHOT" | "CSV" | "BANK_SYNC";

export interface TransactionCandidate {
    // Core financial fields (raw or parsed)
    amount: number | string;
    category?: string;
    priority?: string;
    title?: string;
    notes?: string;
    transactionDate?: string | Date;

    // Provenance metadata
    source: CandidateSource;
    confidenceScore?: number; // E.g., OCR or NLP confidence (0.0 to 1.0)
    rawPayload?: string;      // Original raw input text/JSON for auditing
}
```

---

## 3. Candidate Lifecycle

1. **Extraction**: An adapter extracts amount, date, merchant title, and notes from the incoming stream.
2. **Provenance Tagging**: `source` is set to `"MANUAL"`, `"SHARE"`, or `"SCREENSHOT"`.
3. **Validation & Normalization**: The normalizer attempts to map fuzzy text to strictly typed enums (`Category`, `Priority`) and parses date strings.
4. **User Verification**: For low-confidence candidates (e.g. OCR), the candidate is presented to the user in the UI for confirmation or edit before saving.
5. **Persistence**: The confirmed candidate is committed to PostgreSQL via `transaction.service.createTransaction()`.

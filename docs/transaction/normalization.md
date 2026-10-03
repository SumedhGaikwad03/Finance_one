# Ingestion Normalization Layer

The normalization layer acts as the protective boundary between messy external input and the strict internal transaction domain.

---

## 1. Normalizer Responsibilities

1. **Amount Sanitization**: Strips currency symbols (₹, $, €), cleans commas/whitespace, parses decimal values, and rejects zero or negative amounts.
2. **Date Resolution**: Converts ISO strings, timestamps, or natural dates ("yesterday", "24 Jan 2026") into a valid `Date` instance. Defaults to `now()` if missing.
3. **Category Mapping**: Normalizes fuzzy category strings (e.g. `"groceries"` $\to$ `Category.FOOD`, `"uber"` $\to$ `Category.TRAVEL`). Falls back to `Category.OTHER` when ambiguous.
4. **Priority Assignment**: Normalizes spending preference (`ESSENTIAL`, `GOOD_TO_HAVE`, `LUXURY`). Defaults to `GOOD_TO_HAVE` or leaves for user selection.
5. **Text Hygiene**: Trims whitespace and enforces maximum length constraints (Title: 50 chars, Notes: 200 chars).
6. **Error & Rejection**: Throws clean, actionable validation errors if required fields cannot be recovered.

---

## 2. Source-Agnostic Design

The normalizer operates exclusively on the `TransactionCandidate` interface:

```typescript
// Contract
export interface TransactionNormalizer {
    normalize(candidate: TransactionCandidate): CreateTransactionInput;
}
```

It contains no source-specific parsing logic. Source-specific parsing is handled beforehand by adapters (OCR adapter, Share intent adapter, Form adapter).

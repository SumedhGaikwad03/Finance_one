# Transaction Input Pipeline

The transaction input pipeline governs how raw financial signals from various external sources enter Finance One and transform into validated ledger records.

---

## 1. Modular Input Pipeline Architecture

```text
                         INPUT SOURCES
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
     Manual                  Share                 Screenshot
   (Web Form)           (Mobile Intent)             (OCR/AI)
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               │
                               ▼
                     TransactionCandidate
                               │
                               ▼
                      Normalization Layer
                               │
                               ▼
                     User Confirmation (Optional/UI)
                               │
                               ▼
                      Transaction Service
                               │
                               ▼
                          PostgreSQL
```

---

## 2. Ingestion Stages

### Stage 1: Extraction & Ingestion Adapters
- **Manual Input**: User enters details via the web form (`CreateTransactionForm`). (Status: *Implemented*)
- **Share Intent**: Mobile OS shares text or payment receipt notifications. (Status: *Proposed*)
- **Screenshot / Receipt Scan**: Image intake parsed by OCR / Vision models into candidate fields. (Status: *Proposed*)
- **Future Extensibility**: CSV import, open banking sync, bank statement PDFs. (Status: *Planned*)

### Stage 2: Candidate Construction
The ingestion adapter maps source-specific raw data into a standard `TransactionCandidate` object with source provenance metadata.

### Stage 3: Normalization & Scrubbing
The normalization layer parses dates, cleans strings, resolves category enums, assigns priority defaults, and validates amounts.

### Stage 4: Domain Persistence
The normalized candidate is converted into `CreateTransactionInput` and passed to `transaction.service.createTransaction(input, userId)`.

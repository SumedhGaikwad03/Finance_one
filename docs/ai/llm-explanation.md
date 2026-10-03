# LLM Explanation & Prompt Builder

Once a query is executed by the transaction repository and normalized into a `NormalizedQueryResult`, the explanation layer formats this verified context into a conversational prompt for an LLM.

---

## 1. Explanation Pipeline

```text
NormalizedQueryResult (Exact Financial Facts)
          │
          ▼
   [ Prompt Builder ]
          │
          ▼
Prompt: "Here are the exact facts from the user's records:
- Total spent on FOOD in January 2026: ₹14,250
- Number of transactions: 18
Explain this to the user in a helpful, concise tone without inventing numbers."
          │
          ▼
     [ Local LLM ]
          │
          ▼
Natural Language User Explanation
```

---

## 2. Guardrails

1. **Strict Context Adherence**: The LLM prompt instructs the model never to state figures not present in the injected financial summary.
2. **Deterministic Fallback**: If the LLM call fails or times out, the client falls back to displaying the raw `summaryText` and data table from `NormalizedQueryResult`.

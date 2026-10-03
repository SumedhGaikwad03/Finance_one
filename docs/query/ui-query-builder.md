# Gamified UI Query Builder

The Gamified UI Query Builder is the initial interactive query experience on the frontend, allowing users to build complex financial questions without needing to type freeform natural language.

---

## 1. Guided Flow

```text
Step 1: What do you want to calculate or find?
  [ Total Spent (SUM) ] [ Number of Expenses (COUNT) ] [ Show List (FIND) ] [ Average Spend (AVERAGE) ] [ Highest (MAX) ] [ Lowest (MIN) ]
        │
        ▼
Step 2: Which category? (Optional)
  [ All Categories ] [ Food ] [ Fuel ] [ Shopping ] [ Bills ] [ Entertainment ] [ ... ]
        │
        ▼
Step 3: What spending priority? (Optional)
  [ Any Priority ] [ Essential ] [ Good to Have ] [ Luxury ]
        │
        ▼
Step 4: What time frame? (Optional)
  [ This Month ] [ Last Month ] [ This Week ] [ Past 30 Days ] [ Custom Range ]
        │
        ▼
Generated `TransactionQuery` DTO
        │
        ▼
Dispatched to Backend (`POST /api/transactions/query`)
```

---

## 2. Conversational Sentence Preview

As the user makes selections, the UI dynamically previews the human sentence being constructed:
- *"Calculate **total spending** on **essential food** during **this month**"*
- *"**Find all transactions** in **shopping** with **luxury priority**"*

---

## 3. Component Integration

- **Frontend Component**: `QueryBuilderModal.tsx` or `QueryBuilderSection.tsx` inside the Dashboard / Transactions page.
- **Service**: Calls `transaction.service.queryTransactions(query)`.
- **Display**: Directly renders the returned `NormalizedQueryResult` (e.g., metric card, chart, or filtered transaction list).

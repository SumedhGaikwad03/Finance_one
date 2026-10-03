# Intent Classification & Skill Matcher

Intent classification determines whether a user's prompt is a transaction retrieval request, budget query, general knowledge question, or forecast request.

---

## 1. Skill Matching Architecture

```text
User Question
     │
     ▼
[ Embedding Service ] (nomic-embed-text, 2560 dimensions)
     │
     ▼
[ Vector Search ]     (PostgreSQL pgvector cosine distance on `SkillEmbedding`)
     │
     ▼
[ Confidence Threshold ] (similarity >= 0.70)
     │
     ▼
[ Matched Skill ]     (e.g., 'transaction-retrieval')
```

---

## 2. Implemented & Registered Skills

1. **`transaction-retrieval`**: Handles lookups, sums, counts, and filters on user transactions.
2. **Additional Skills (Planned)**: Budget advisory, anomaly detection, spending forecasting.

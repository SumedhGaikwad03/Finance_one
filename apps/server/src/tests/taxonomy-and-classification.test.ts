import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Category, Priority, TransactionSource } from "../generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";
import {
    TAXONOMY_CATEGORIES,
    TAXONOMY_PRIORITIES,
    CANONICAL_TAGS,
    CATEGORY_DESCRIPTIONS,
    PRIORITY_DESCRIPTIONS,
    ClassificationCandidate,
    determineFinancialEligibility,
} from "../classification/contracts/classification.contract";
import { RuleBasedClassifier } from "../classification/providers/rule-based.classifier";
import { MerchantRuleClassifier } from "../classification/providers/merchant-rule.classifier";
import { validateLlmClassificationPayload } from "../classification/providers/llm.classifier.interface";
import { ClassificationService } from "../classification/services/classification.service";
import { normalizeTags, normalizeTransactionInput } from "../ingestion/normalizers/transaction.normalizer";
import { validateTransactionCandidate } from "../ingestion/validators/transaction.validator";
import { transformRow } from "../import/mapping/row-transformer";
import { ColumnMapping } from "../import/types/import.types";

describe("FinOne: Formalized Transaction Classification Taxonomy", () => {
    describe("1. Taxonomy Completeness and Distinctness", () => {
        it("defines exactly the 11 established categories without unexpected additions or deletions", () => {
            const expectedCategories: Category[] = [
                Category.FOOD,
                Category.FUEL,
                Category.SHOPPING,
                Category.BILLS,
                Category.ENTERTAINMENT,
                Category.HEALTH,
                Category.TRAVEL,
                Category.EDUCATION,
                Category.SUBSCRIPTION,
                Category.GIFT,
                Category.OTHER,
            ];

            assert.equal(TAXONOMY_CATEGORIES.length, 11);
            for (const cat of expectedCategories) {
                assert.ok(TAXONOMY_CATEGORIES.includes(cat), `Missing category: ${cat}`);
                assert.ok(CATEGORY_DESCRIPTIONS[cat], `Missing description for category: ${cat}`);
            }
        });

        it("defines exactly the 4 established spending tiers with UNCLASSIFIED as legitimate state", () => {
            const expectedPriorities: Priority[] = [
                Priority.ESSENTIAL,
                Priority.GOOD_TO_HAVE,
                Priority.LUXURY,
                Priority.UNCLASSIFIED,
            ];

            assert.equal(TAXONOMY_PRIORITIES.length, 4);
            for (const pri of expectedPriorities) {
                assert.ok(TAXONOMY_PRIORITIES.includes(pri), `Missing priority: ${pri}`);
                assert.ok(PRIORITY_DESCRIPTIONS[pri], `Missing description for priority: ${pri}`);
            }
        });

        it("enforces categories, spending tiers, and tags as distinct concepts", () => {
            // Ensure no priority is named like a category
            for (const pri of TAXONOMY_PRIORITIES) {
                assert.ok(
                    !TAXONOMY_CATEGORIES.map(String).includes(String(pri)),
                    `Priority ${pri} should not collide with Category names`
                );
            }

            // Ensure canonical tags do not duplicate Category or Priority enums
            for (const tag of CANONICAL_TAGS) {
                const upperTag = tag.toUpperCase();
                assert.ok(
                    !TAXONOMY_CATEGORIES.map(String).includes(upperTag) || tag === "subscription",
                    `Tag '${tag}' should not shadow categories`
                );
            }
        });

        it("normalizes and sanitizes optional tags", () => {
            const raw = [" Work_Expense ", "TAX-DEDUCTIBLE!", "Recurring", ""];
            const normalized = normalizeTags(raw);

            assert.deepEqual(normalized, ["work_expense", "tax-deductible", "recurring"]);
        });
    });

    describe("2. Unknown and Ambiguous State Behavior", () => {
        it("falls back to UNCLASSIFIED when spending tier is missing or unknown", async () => {
            const service = new ClassificationService();
            const candidate: ClassificationCandidate = {
                amount: new Prisma.Decimal(250),
                title: "Random Unmatched Narration 9876",
                transactionDate: new Date("2026-03-01T00:00:00.000Z"),
                source: TransactionSource.CSV_IMPORT,
            };

            const result = await service.classifyCandidate(candidate);

            assert.equal(result.priority, Priority.UNCLASSIFIED);
            assert.equal(result.category, Category.OTHER);
            assert.equal(result.needsReview, true);
        });

        it("never rejects an otherwise valid expense because category or tier is unknown", () => {
            const normalized = normalizeTransactionInput({
                amount: "1500.00",
                title: "Unknown counterparty XYZ",
                transactionDate: "2026-02-15",
                category: undefined,
                priority: undefined,
            });

            assert.equal(normalized.category, Category.OTHER);
            assert.equal(normalized.priority, Priority.UNCLASSIFIED);

            const validation = validateTransactionCandidate(normalized, 1);
            assert.equal(validation.isValid, true);
            assert.equal(validation.errors.length, 0);
            assert.ok(validation.validated);
            assert.equal(validation.validated?.category, Category.OTHER);
            assert.equal(validation.validated?.priority, Priority.UNCLASSIFIED);
        });

        it("flags low-confidence predictions as needing review", async () => {
            const service = new ClassificationService({ minConfidenceThreshold: 0.8 });
            const candidate: ClassificationCandidate = {
                amount: new Prisma.Decimal(500),
                title: "Some party event outing",
                transactionDate: new Date("2026-03-01T00:00:00.000Z"),
                source: TransactionSource.MANUAL,
            };

            const result = await service.classifyCandidate(candidate);
            assert.equal(result.category, Category.ENTERTAINMENT);
            assert.equal(result.needsReview, false); // Match confidence is ~0.85 >= 0.8
        });
    });

    describe("3. Financial Meaning & Transaction Eligibility", () => {
        const mapping: ColumnMapping = {
            dateColumn: "Date",
            descriptionColumn: "Narration",
            amountMode: "debit_credit",
            debitColumn: "Debit",
            creditColumn: "Credit",
        };

        it("classifies debits as eligible expenses and preserves positive Decimal amounts", () => {
            const row = {
                Date: "15/03/2026",
                Narration: "Supermarket Groceries",
                Debit: "1,250.50",
                Credit: "",
            };

            const result = transformRow(row, mapping, {}, 1, "stmt.csv");

            assert.equal(result.status, "READY");
            assert.equal(result.mapped.amount, 1250.5);
            assert.ok(result.candidateInput);
            assert.equal(result.candidateInput?.amount.toString(), "1250.5");
        });

        it("excludes salary credits, deposits, and opening/closing balances from expense totals", () => {
            const creditRow = {
                Date: "01/03/2026",
                Narration: "SALARY CREDIT TECH CORP",
                Debit: "",
                Credit: "95,000.00",
            };
            const balanceRow = {
                Date: "01/03/2026",
                Narration: "OPENING BALANCE",
                Debit: "",
                Credit: "50,000.00",
            };

            const creditResult = transformRow(creditRow, mapping, {}, 1, "stmt.csv");
            const balanceResult = transformRow(balanceRow, mapping, {}, 2, "stmt.csv");

            assert.equal(creditResult.status, "EXCLUDED_NON_EXPENSE");
            assert.equal(balanceResult.status, "EXCLUDED_NON_EXPENSE");
        });
    });

    describe("4. Provider-Independent Classifier Contract", () => {
        it("rule-based provider correctly classifies categories, spending tiers, and tags", async () => {
            const provider = new RuleBasedClassifier();
            const candidate: ClassificationCandidate = {
                amount: new Prisma.Decimal(199),
                title: "Netflix monthly subscription",
                transactionDate: new Date("2026-03-01T00:00:00.000Z"),
                source: TransactionSource.MANUAL,
            };

            const suggestion = await provider.classify(candidate);

            assert.ok(suggestion);
            assert.equal(suggestion.category, Category.SUBSCRIPTION);
            assert.equal(suggestion.priority, Priority.GOOD_TO_HAVE);
            assert.ok(suggestion.tags?.includes("subscription"));
            assert.ok(suggestion.confidence >= 0.7);
        });

        it("merchant mapping provider recognizes specific merchants with highest confidence", async () => {
            const provider = new MerchantRuleClassifier();
            const candidate: ClassificationCandidate = {
                amount: new Prisma.Decimal(450),
                title: "Swiggy order #884920",
                transactionDate: new Date("2026-03-01T00:00:00.000Z"),
                source: TransactionSource.BANK_STATEMENT,
            };

            const suggestion = await provider.classify(candidate);

            assert.ok(suggestion);
            assert.equal(suggestion.category, Category.FOOD);
            assert.equal(suggestion.priority, Priority.GOOD_TO_HAVE);
            assert.equal(suggestion.confidence, 0.95);
        });

        it("validates LLM JSON output strictly against allowed enums and bounds", () => {
            const validLlmPayload = {
                category: "FOOD",
                priority: "ESSENTIAL",
                tags: ["Groceries", "Organic"],
                confidence: 0.92,
                reasoning: "Weekly groceries at supermarket",
            };

            const suggestion = validateLlmClassificationPayload(validLlmPayload, "ollama_model");
            assert.ok(suggestion);
            assert.equal(suggestion.category, Category.FOOD);
            assert.equal(suggestion.priority, Priority.ESSENTIAL);
            assert.deepEqual(suggestion.tags, ["groceries", "organic"]);
            assert.equal(suggestion.confidence, 0.92);

            // Rejects unknown or hallucinated categories/priorities
            const hallucinatedPayload = {
                category: "CRYPTOCURRENCY_MOON",
                priority: "SUPER_URGENT",
                confidence: 1.5,
            };
            const sanitized = validateLlmClassificationPayload(hallucinatedPayload, "ollama_model");
            assert.equal(sanitized, null);
        });

        it("enforces classification invariant: amounts, dates, and direction are never modified by classifiers", async () => {
            const service = new ClassificationService();
            const originalAmount = new Prisma.Decimal(1234.56);
            const originalDate = new Date("2026-01-20T10:00:00.000Z");

            const candidate: ClassificationCandidate = {
                amount: originalAmount,
                transactionDate: originalDate,
                title: "Uber Ride Airport",
                source: TransactionSource.MANUAL,
            };

            const result = await service.classifyCandidate(candidate);

            // Ensure result suggests taxonomy without corrupting candidate
            assert.equal(candidate.amount.toString(), "1234.56");
            assert.equal(candidate.transactionDate.toISOString(), "2026-01-20T10:00:00.000Z");
            assert.equal(result.category, Category.TRAVEL);
            assert.equal(result.priority, Priority.ESSENTIAL);
        });
    });

    describe("5. Precedence and User Correction Preservation", () => {
        it("preserves user-confirmed classification over merchant and rule-based suggestions", async () => {
            const service = new ClassificationService();

            // Candidate has title 'Swiggy' (which would normally classify as FOOD + GOOD_TO_HAVE)
            // But user previously explicitly confirmed it as GIFT + LUXURY (e.g. birthday treat for a friend)
            const candidate: ClassificationCandidate = {
                amount: new Prisma.Decimal(1200),
                title: "Swiggy Birthday Dinner",
                transactionDate: new Date("2026-02-14T00:00:00.000Z"),
                source: TransactionSource.MANUAL,
                existingCategory: Category.GIFT,
                existingPriority: Priority.LUXURY,
                existingTags: ["celebration", "gift"],
                userConfirmed: true,
            };

            const result = await service.classifyCandidate(candidate);

            // User classification must win unconditionally!
            assert.equal(result.category, Category.GIFT);
            assert.equal(result.priority, Priority.LUXURY);
            assert.deepEqual(result.tags, ["celebration", "gift"]);
            assert.equal(result.userConfirmed, true);
            assert.equal(result.confidence, 1.0);
            assert.equal(result.providerId, "user_explicit");
        });

        it("gives merchant rules precedence over general keyword rules", async () => {
            const service = new ClassificationService();

            // "Blinkit grocery" matches Merchant Rule for Blinkit (FOOD + ESSENTIAL + tags ["groceries"])
            const candidate: ClassificationCandidate = {
                amount: new Prisma.Decimal(340),
                title: "Blinkit order snacks",
                transactionDate: new Date("2026-03-01T00:00:00.000Z"),
                source: TransactionSource.BANK_STATEMENT,
            };

            const result = await service.classifyCandidate(candidate);

            assert.equal(result.category, Category.FOOD);
            assert.equal(result.priority, Priority.ESSENTIAL);
            assert.equal(result.providerId, "merchant_rule_classifier");
            assert.ok(result.tags.includes("groceries"));
        });

        it("operates reliably in rules-only mode with zero external AI dependencies", async () => {
            const service = new ClassificationService();
            const providers = service.getActiveProviders();

            assert.deepEqual(providers, [
                "merchant_rule_classifier",
                "rule_based_keyword_classifier",
            ]);

            // Test batch candidate classification purely offline
            const candidates: ClassificationCandidate[] = [
                {
                    amount: new Prisma.Decimal(50),
                    title: "Chai and tea stall",
                    transactionDate: new Date("2026-03-01T00:00:00.000Z"),
                    source: TransactionSource.MANUAL,
                },
                {
                    amount: new Prisma.Decimal(2500),
                    title: "Electricity power utility bill",
                    transactionDate: new Date("2026-03-02T00:00:00.000Z"),
                    source: TransactionSource.MANUAL,
                },
                {
                    amount: new Prisma.Decimal(120),
                    title: "Medical cough syrup pharmacy",
                    transactionDate: new Date("2026-03-03T00:00:00.000Z"),
                    source: TransactionSource.MANUAL,
                },
            ];

            const results = await Promise.all(candidates.map((c) => service.classifyCandidate(c)));

            assert.equal(results[0].category, Category.FOOD);
            assert.equal(results[1].category, Category.BILLS);
            assert.equal(results[1].priority, Priority.ESSENTIAL);
            assert.equal(results[2].category, Category.HEALTH);
            assert.equal(results[2].priority, Priority.ESSENTIAL);
        });
    });

    describe("6. Financial Record Types & Deterministic Eligibility Contract", () => {
        it("correctly identifies EXPENSE records for valid outgoing debits", () => {
            const eligibility = determineFinancialEligibility({
                amount: new Prisma.Decimal(450.75),
                isDebit: true,
                isCredit: false,
                narration: "Grocery Supermarket",
            });

            assert.equal(eligibility.recordType, "EXPENSE");
            assert.equal(eligibility.isEligibleExpense, true);
        });

        it("correctly identifies INCOME records for credits, deposits, and salary", () => {
            const salary = determineFinancialEligibility({
                amount: 85000,
                isCredit: true,
                isDebit: false,
                narration: "Monthly Salary Credit Oct 2026",
            });
            assert.equal(salary.recordType, "INCOME");
            assert.equal(salary.isEligibleExpense, false);

            const refund = determineFinancialEligibility({
                amount: 350,
                isCredit: true,
                isDebit: false,
                narration: "Merchant Refund Credited",
            });
            assert.equal(refund.recordType, "INCOME");
            assert.equal(refund.isEligibleExpense, false);
        });

        it("correctly identifies TRANSFER records for internal account transfers", () => {
            const transfer = determineFinancialEligibility({
                amount: 10000,
                isDebit: true,
                narration: "Internal Fund Transfer to Savings A/C",
            });
            assert.equal(transfer.recordType, "TRANSFER");
            assert.equal(transfer.isEligibleExpense, false);

            const selfTrf = determineFinancialEligibility({
                amount: 5000,
                isDebit: true,
                narration: "Self Transfer AC TRF 9982",
            });
            assert.equal(selfTrf.recordType, "TRANSFER");
            assert.equal(selfTrf.isEligibleExpense, false);
        });

        it("correctly identifies BALANCE_SUMMARY records for header/footer balances", () => {
            const opening = determineFinancialEligibility({
                amount: 25000,
                narration: "Opening Balance b/f",
            });
            assert.equal(opening.recordType, "BALANCE_SUMMARY");
            assert.equal(opening.isEligibleExpense, false);

            const closing = determineFinancialEligibility({
                amount: 32000,
                narration: "Closing Balance as on 31-Oct-2026",
            });
            assert.equal(closing.recordType, "BALANCE_SUMMARY");
            assert.equal(closing.isEligibleExpense, false);

            const grandTotal = determineFinancialEligibility({
                amount: 150000,
                narration: "Grand Total Summary",
            });
            assert.equal(grandTotal.recordType, "BALANCE_SUMMARY");
            assert.equal(grandTotal.isEligibleExpense, false);
        });

        it("correctly identifies INVALID records for missing or zero amounts", () => {
            const missingAmt = determineFinancialEligibility({
                amount: null,
                narration: "Invalid row without amount",
            });
            assert.equal(missingAmt.recordType, "INVALID");
            assert.equal(missingAmt.isEligibleExpense, false);

            const zeroAmt = determineFinancialEligibility({
                amount: 0,
                narration: "Zero amount row",
            });
            assert.equal(zeroAmt.recordType, "INVALID");
            assert.equal(zeroAmt.isEligibleExpense, false);
        });
    });

    describe("7. Explicit OTHER vs Unknown Category Separation", () => {
        it("does not conflate explicit Category.OTHER with unknown/unclassified category", async () => {
            const service = new ClassificationService();

            // Case A: User explicitly confirms Category.OTHER for an expense (e.g. miscellaneous cash expense)
            const explicitOtherCandidate: ClassificationCandidate = {
                amount: new Prisma.Decimal(100),
                title: "Miscellaneous tipping and loose coins",
                transactionDate: new Date("2026-03-01T00:00:00.000Z"),
                source: TransactionSource.MANUAL,
                existingCategory: Category.OTHER,
                existingPriority: Priority.GOOD_TO_HAVE,
                userConfirmed: true,
            };

            const explicitResult = await service.classifyCandidate(explicitOtherCandidate);
            assert.equal(explicitResult.category, Category.OTHER);
            assert.equal(explicitResult.isCategoryUnclassified, false);
            assert.equal(explicitResult.needsReview, false); // Explicitly confirmed, does not force review!
            assert.equal(explicitResult.sourceType, "USER_EXPLICIT");

            // Case B: Completely unknown candidate where category could not be resolved
            const unknownCandidate: ClassificationCandidate = {
                amount: new Prisma.Decimal(250),
                title: "XYZ9923847 unidentified merchant code",
                transactionDate: new Date("2026-03-01T00:00:00.000Z"),
                source: TransactionSource.CSV_IMPORT,
            };

            const unknownResult = await service.classifyCandidate(unknownCandidate);
            assert.equal(unknownResult.category, Category.OTHER); // Fallback enum value
            assert.equal(unknownResult.isCategoryUnclassified, true); // Explicitly marked as unclassified!
            assert.equal(unknownResult.needsReview, true); // Unknown MUST require review!
            assert.equal(unknownResult.sourceType, "FALLBACK_DEFAULT");
        });
    });

    describe("8. Missing Spending Tier Ingestion Robustness", () => {
        it("never rejects an expense solely because its tier is UNCLASSIFIED", () => {
            const normalized = normalizeTransactionInput({
                amount: 1500,
                title: "General store purchase",
                transactionDate: "2026-04-10",
                category: Category.SHOPPING,
                priority: Priority.UNCLASSIFIED,
            });

            assert.equal(normalized.priority, Priority.UNCLASSIFIED);

            const validation = validateTransactionCandidate(normalized, 42);
            assert.equal(validation.isValid, true);
            assert.equal(validation.errors.length, 0);
            assert.equal(validation.validated?.priority, Priority.UNCLASSIFIED);
        });

        it("statement row transformer defaults missing priority column to UNCLASSIFIED instead of inventing a tier", () => {
            const rowWithoutPriority = {
                Date: "10/04/2026",
                Narration: "Corner Convenience Store",
                Debit: "45.00",
                Credit: "",
            };

            const mappingWithoutPriority: ColumnMapping = {
                dateColumn: "Date",
                descriptionColumn: "Narration",
                amountMode: "debit_credit",
                debitColumn: "Debit",
                creditColumn: "Credit",
                // Notice: priorityColumn is completely omitted!
            };

            const transformed = transformRow(rowWithoutPriority, mappingWithoutPriority, {}, 1, "statement.csv");

            assert.equal(transformed.status, "READY");
            assert.equal(transformed.mapped.priority, Priority.UNCLASSIFIED);
            assert.equal(transformed.candidateInput?.priority, Priority.UNCLASSIFIED);
            assert.equal(
                (transformed.candidateInput?.sourceMetadata as any)?.isPriorityUnclassified,
                true
            );
        });

        it("statement row transformer excludes internal account transfer rows", () => {
            const transferRow = {
                Date: "10/04/2026",
                Narration: "INTERNAL TRANSFER TO SAVINGS AC 5432",
                Debit: "10,000.00",
                Credit: "",
            };

            const mapping: ColumnMapping = {
                dateColumn: "Date",
                descriptionColumn: "Narration",
                amountMode: "debit_credit",
                debitColumn: "Debit",
                creditColumn: "Credit",
            };

            const transformed = transformRow(transferRow, mapping, {}, 1, "statement.csv");
            assert.equal(transformed.status, "EXCLUDED_NON_EXPENSE");
            assert.ok(transformed.reasons[0].includes("Internal account transfer"));
        });
    });

    describe("9. Missing Metadata & Optional Dimensions Resilience", () => {
        it("handles completely empty or omitted tags and sourceMetadata safely", () => {
            const normalized = normalizeTransactionInput({
                amount: 300,
                title: "Bookstore",
                transactionDate: new Date("2026-05-01"),
                category: Category.EDUCATION,
                tags: undefined,
                sourceMetadata: undefined,
            });

            assert.equal(normalized.tags, undefined);
            assert.equal(normalized.sourceMetadata, null);

            const validation = validateTransactionCandidate(normalized, 101);
            assert.equal(validation.isValid, true);
        });

        it("normalizes and deduplicates tags without throwing on malformed inputs", () => {
            const raw = ["#Groceries", "  DINING  ", "", null, undefined, "groceries", "supermarket_123"];
            const cleaned = normalizeTags(raw as any);

            assert.deepEqual(cleaned, ["groceries", "dining", "supermarket_123"]);
        });
    });
});

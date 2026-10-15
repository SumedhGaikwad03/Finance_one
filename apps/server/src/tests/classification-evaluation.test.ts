import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DeterministicBaselineAdapter } from "../evaluation/adapters/deterministic-baseline.adapter";
import { ProductionTaxonomyAdapter } from "../evaluation/adapters/production-taxonomy.adapter";
import {
  EVALUATION_DATASET,
  validateEvaluationDataset,
} from "../evaluation/dataset/evaluation.dataset";
import { evaluatePredictions, generateMarkdownReport } from "../evaluation/metrics/evaluator";
import { runEvaluation } from "../evaluation/runner";
import {
  ClassificationAdapter,
  EvaluationFixture,
  EvaluationPrediction,
} from "../evaluation/types/evaluation.types";

describe("FinOne | Branch 04: Classification Evaluation Framework Suite", () => {
  // =========================================================================
  // 1. Dataset Integrity & Schema Validation
  // =========================================================================
  describe("1. Dataset Validation & Integrity", () => {
    it("validates the official evaluation dataset with 0 errors", () => {
      const result = validateEvaluationDataset(EVALUATION_DATASET);
      assert.equal(result.valid, true, `Dataset validation failed: ${result.errors.join(", ")}`);
      assert.equal(result.errors.length, 0);
      assert.ok(EVALUATION_DATASET.length >= 60, "Dataset must have at least 60 fixtures");
    });

    it("rejects duplicate fixture IDs", () => {
      const duplicateDataset: EvaluationFixture[] = [
        {
          id: "DUP-001",
          description: "Test 1",
          amount: 100,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "FOOD",
            spendingTier: "ESSENTIAL",
          },
        },
        {
          id: "DUP-001",
          description: "Test 2",
          amount: 200,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "FOOD",
            spendingTier: "ESSENTIAL",
          },
        },
      ];
      const result = validateEvaluationDataset(duplicateDataset);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("Duplicate fixture ID")));
    });

    it("flags missing expected labels and invalid enums", () => {
      const invalidDataset: any[] = [
        {
          id: "INV-ENUM",
          description: "Bad Enum Test",
          amount: 100,
          direction: "DEBIT",
          expected: {
            financialMeaning: "NON_EXISTENT_MEANING",
            isEligibleExpense: "not-a-boolean",
            category: "INVALID_CATEGORY",
            spendingTier: "INVALID_TIER",
          },
        },
      ];
      const result = validateEvaluationDataset(invalidDataset);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("financialMeaning")));
      assert.ok(result.errors.some((e) => e.includes("isEligibleExpense")));
      assert.ok(result.errors.some((e) => e.includes("category")));
      assert.ok(result.errors.some((e) => e.includes("spendingTier")));
    });
  });

  // =========================================================================
  // 2. Hand-Verifiable Metric Calculations
  // =========================================================================
  describe("2. Metric Calculations & Denominators", () => {
    it("computes exact hand-verifiable precision, recall, and F1 on small fixtures", () => {
      const fixtures: EvaluationFixture[] = [
        {
          id: "1",
          description: "Food 1",
          amount: 10,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "FOOD",
            spendingTier: "ESSENTIAL",
          },
        },
        {
          id: "2",
          description: "Food 2",
          amount: 20,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "FOOD",
            spendingTier: "ESSENTIAL",
          },
        },
        {
          id: "3",
          description: "Bills 1",
          amount: 30,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "BILLS",
            spendingTier: "ESSENTIAL",
          },
        },
        {
          id: "4",
          description: "Fuel 1",
          amount: 40,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "FUEL",
            spendingTier: "ESSENTIAL",
          },
        },
      ];

      const predictions: EvaluationPrediction[] = [
        { category: "FOOD", spendingTier: "ESSENTIAL", confidence: 0.9 },
        { category: "BILLS", spendingTier: "ESSENTIAL", confidence: 0.9 },
        { category: "BILLS", spendingTier: "ESSENTIAL", confidence: 0.9 },
        { category: "FUEL", spendingTier: "ESSENTIAL", confidence: 0.9 },
      ];

      const report = evaluatePredictions(fixtures, predictions, { confidenceThreshold: 0.65 });

      assert.equal(report.categoryOverall.accuracy, 0.75);
      assert.equal(report.categoryOverall.correctCount, 3);
      assert.equal(report.categoryOverall.totalSamples, 4);

      const food = report.categoryOverall.byClass["FOOD"];
      assert.equal(food.truePositives, 1);
      assert.equal(food.falsePositives, 0);
      assert.equal(food.falseNegatives, 1);
      assert.equal(food.precision, 1.0);
      assert.equal(food.recall, 0.5);
      assert.ok(Math.abs((food.f1 || 0) - 2 / 3) < 0.001);

      const bills = report.categoryOverall.byClass["BILLS"];
      assert.equal(bills.truePositives, 1);
      assert.equal(bills.falsePositives, 1);
      assert.equal(bills.falseNegatives, 0);
      assert.equal(bills.precision, 0.5);
      assert.equal(bills.recall, 1.0);
      assert.ok(Math.abs((bills.f1 || 0) - 2 / 3) < 0.001);
    });

    it("evaluates multiple categories and tiers cleanly", () => {
      const fixtures: EvaluationFixture[] = [
        {
          id: "T1",
          description: "Fancy Restaurant",
          amount: 5000,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "FOOD",
            spendingTier: "LUXURY",
          },
        },
        {
          id: "T2",
          description: "Metro Card",
          amount: 200,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "TRAVEL",
            spendingTier: "ESSENTIAL",
          },
        },
        {
          id: "T3",
          description: "Movie",
          amount: 600,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "ENTERTAINMENT",
            spendingTier: "GOOD_TO_HAVE",
          },
        },
      ];

      const predictions: EvaluationPrediction[] = [
        { category: "FOOD", spendingTier: "LUXURY", confidence: 0.9 },
        { category: "TRAVEL", spendingTier: "ESSENTIAL", confidence: 0.9 },
        { category: "ENTERTAINMENT", spendingTier: "GOOD_TO_HAVE", confidence: 0.9 },
      ];

      const report = evaluatePredictions(fixtures, predictions);
      assert.equal(report.spendingTierOverall.accuracy, 1.0);
      assert.equal(report.categoryOverall.accuracy, 1.0);
      assert.equal(report.spendingTierOverall.byClass["LUXURY"].truePositives, 1);
      assert.equal(report.spendingTierOverall.byClass["ESSENTIAL"].truePositives, 1);
      assert.equal(report.spendingTierOverall.byClass["GOOD_TO_HAVE"].truePositives, 1);
    });
  });

  // =========================================================================
  // 3. Multi-label Tag Metrics & Precision/Recall
  // =========================================================================
  describe("3. Multi-Label Tag Evaluation", () => {
    it("evaluates multiple tags per transaction and does not penalize valid untagged rows", () => {
      const fixtures: EvaluationFixture[] = [
        {
          id: "TAG-1",
          description: "Food Delivery",
          amount: 500,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "FOOD",
            spendingTier: "GOOD_TO_HAVE",
            tags: ["food", "delivery", "dinner"],
          },
        },
        {
          id: "TAG-2",
          description: "Plain purchase with no tags",
          amount: 100,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "OTHER",
            spendingTier: "UNCLASSIFIED",
            tags: [],
          },
        },
      ];

      const predictions: EvaluationPrediction[] = [
        {
          category: "FOOD",
          spendingTier: "GOOD_TO_HAVE",
          confidence: 0.9,
          tags: ["food", "delivery"],
        },
        {
          category: "OTHER",
          spendingTier: "UNCLASSIFIED",
          confidence: 0.9,
          tags: [],
        },
      ];

      const report = evaluatePredictions(fixtures, predictions);
      assert.equal(report.tags.totalTransactionsWithTags, 1);
      assert.equal(report.tags.totalGroundTruthTags, 3);
      assert.equal(report.tags.totalPredictedTags, 2);
      assert.equal(report.tags.microPrecision, 1.0);
      assert.ok(Math.abs(report.tags.microRecall - 2 / 3) < 0.001);
      assert.ok(Math.abs(report.tags.microF1 - 0.8) < 0.001);
    });
  });

  // =========================================================================
  // 4. Financial Meaning, False Positives & Expense Omission
  // =========================================================================
  describe("4. Financial Meaning & Expense Integrity", () => {
    it("detects when a salary credit is erroneously counted as an eligible expense", () => {
      const fixtures: EvaluationFixture[] = [
        {
          id: "CR-1",
          description: "SALARY CR OCT 2026",
          amount: 100000,
          direction: "CREDIT",
          expected: {
            financialMeaning: "INCOME",
            isEligibleExpense: false,
            category: "OTHER",
            spendingTier: "UNCLASSIFIED",
          },
        },
      ];

      const badPredictions: EvaluationPrediction[] = [
        {
          financialMeaning: "EXPENSE",
          isEligibleExpense: true,
          category: "OTHER",
          confidence: 0.9,
        },
      ];

      const report = evaluatePredictions(fixtures, badPredictions);
      assert.equal(report.financial.falsePositiveExpenseCount, 1);
      assert.equal(report.financial.falsePositiveExpenseRate, 1.0);
      assert.equal(report.financial.eligibilityAccuracy, 0.0);

      const fpTarget = report.acceptanceTargets.find((t) =>
        t.metricName.includes("False-positive")
      );
      assert.ok(fpTarget);
      assert.equal(fpTarget.passed, false);
    });

    it("detects when an actual expense is erroneously dropped or omitted", () => {
      const fixtures: EvaluationFixture[] = [
        {
          id: "DR-1",
          description: "GROCERY STORE",
          amount: 500,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "FOOD",
            spendingTier: "ESSENTIAL",
          },
        },
      ];

      const badPredictions: EvaluationPrediction[] = [
        {
          financialMeaning: "TRANSFER",
          isEligibleExpense: false,
          category: "FOOD",
          confidence: 0.9,
        },
      ];

      const report = evaluatePredictions(fixtures, badPredictions);
      assert.equal(report.financial.omittedExpensesCount, 1);
      assert.equal(report.financial.validExpenseOmissionRate, 1.0);

      const dropTarget = report.acceptanceTargets.find((t) => t.metricName.includes("dropped"));
      assert.ok(dropTarget);
      assert.equal(dropTarget.passed, false);
    });
  });

  // =========================================================================
  // 5. Accuracy & Coverage Evaluated Together
  // =========================================================================
  describe("5. Accuracy and Coverage Together", () => {
    it("reports automatic classification accuracy separately from low-confidence review items", () => {
      const fixtures: EvaluationFixture[] = [
        {
          id: "HIGH-CONF",
          description: "Swiggy Order",
          amount: 300,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "FOOD",
            spendingTier: "GOOD_TO_HAVE",
          },
        },
        {
          id: "LOW-CONF",
          description: "Opaque Narration 123",
          amount: 250,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "OTHER",
            spendingTier: "UNCLASSIFIED",
          },
        },
      ];

      const predictions: EvaluationPrediction[] = [
        { category: "FOOD", spendingTier: "GOOD_TO_HAVE", confidence: 0.95 },
        { category: "SHOPPING", spendingTier: "GOOD_TO_HAVE", confidence: 0.4 },
      ];

      const report = evaluatePredictions(fixtures, predictions, { confidenceThreshold: 0.65 });
      assert.equal(report.coverage.totalSamples, 2);
      assert.equal(report.coverage.autoClassifiedCount, 1);
      assert.equal(report.coverage.reviewCount, 1);
      assert.equal(report.coverage.coverageRate, 0.5);
      assert.equal(report.coverage.reviewRate, 0.5);

      assert.equal(report.coverage.autoCategoryAccuracy, 1.0);
      assert.equal(report.categoryAutomatic.accuracy, 1.0);
      assert.equal(report.categoryOverall.accuracy, 0.5);
    });
  });

  // =========================================================================
  // 6. Zero Division & Edge Case Safety
  // =========================================================================
  describe("6. Edge Cases & Zero Division Safety", () => {
    it("handles an empty dataset gracefully without crashing or emitting NaN", () => {
      const report = evaluatePredictions([], []);
      assert.equal(report.datasetSize, 0);
      assert.equal(report.categoryOverall.accuracy, 0);
      assert.equal(report.coverage.autoCategoryAccuracy, 0);
      assert.equal(report.tags.microF1, 0);
      assert.equal(isNaN(report.financial.directionAccuracy), false);
    });

    it("handles categories with 0 ground-truth examples gracefully", () => {
      const fixtures: EvaluationFixture[] = [
        {
          id: "ONLY-FOOD",
          description: "Food",
          amount: 50,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "FOOD",
            spendingTier: "ESSENTIAL",
          },
        },
      ];
      const predictions: EvaluationPrediction[] = [
        { category: "FOOD", spendingTier: "ESSENTIAL", confidence: 0.9 },
      ];

      const report = evaluatePredictions(fixtures, predictions);
      const edu = report.categoryOverall.byClass["EDUCATION"];
      assert.equal(edu.support, 0);
      assert.equal(edu.precision, null);
      assert.equal(edu.recall, null);
      assert.equal(edu.f1, null);
    });

    it("resiliently sanitizes malformed predictions in runner", async () => {
      const badAdapter: ClassificationAdapter = {
        name: "MalformedOutputAdapter",
        classify: () => {
          return {
            confidence: NaN,
            category: 12345 as any,
            tags: "not-an-array" as any,
          };
        },
      };

      const fixtures: EvaluationFixture[] = [
        {
          id: "MALFORMED-1",
          description: "Testing bad output",
          amount: 100,
          direction: "DEBIT",
          expected: {
            financialMeaning: "EXPENSE",
            isEligibleExpense: true,
            category: "OTHER",
            spendingTier: "UNCLASSIFIED",
          },
        },
      ];

      const report = await runEvaluation({ adapter: badAdapter, dataset: fixtures });
      assert.equal(report.datasetSize, 1);
      assert.equal(report.coverage.reviewCount, 1);
      assert.equal(report.coverage.autoClassifiedCount, 0);
    });
  });

  // =========================================================================
  // 7. Deterministic Baseline Runner & Target Verification
  // =========================================================================
  describe("7. Deterministic Baseline Runner Execution", () => {
    it("runs deterministic baseline adapter against full dataset and meets acceptance targets", async () => {
      const adapter = new DeterministicBaselineAdapter();
      const report = await runEvaluation({
        adapter,
        dataset: EVALUATION_DATASET,
        confidenceThreshold: 0.65,
      });

      assert.equal(report.datasetSize, EVALUATION_DATASET.length);
      assert.ok(report.datasetSize >= 60);

      assert.equal(report.financial.eligibilityAccuracy, 1.0);
      assert.equal(report.financial.omittedExpensesCount, 0);
      assert.equal(report.financial.falsePositiveExpenseCount, 0);

      assert.ok(
        report.coverage.autoCategoryAccuracy >= 0.95,
        `Auto category accuracy was ${report.coverage.autoCategoryAccuracy}, expected >= 0.95`
      );
      assert.ok(
        report.coverage.autoTierAccuracy >= 0.9,
        `Auto tier accuracy was ${report.coverage.autoTierAccuracy}, expected >= 0.90`
      );

      for (const t of report.acceptanceTargets) {
        assert.equal(t.passed, true, `Target failed: ${t.metricName} (actual=${t.actualValue})`);
      }

      const md = generateMarkdownReport(report);
      assert.ok(md.includes("# FinOne Classification Evaluation Report"));
      assert.ok(md.includes("Acceptance Targets Verification"));
      assert.ok(md.includes("DeterministicBaselineAdapter"));
    });

    it("verifies production taxonomy adapter bridge fallback behavior", async () => {
      const adapter = new ProductionTaxonomyAdapter();
      const fixture: EvaluationFixture = {
        id: "PROD-BRIDGE",
        description: "Swiggy Order",
        amount: 300,
        direction: "DEBIT",
        expected: {
          financialMeaning: "EXPENSE",
          isEligibleExpense: true,
          category: "FOOD",
          spendingTier: "GOOD_TO_HAVE",
        },
      };

      const pred = await adapter.classify(fixture);
      assert.ok(pred);
      if (!adapter.isProductionAvailable) {
        assert.equal(pred.requiresReview, true);
        assert.equal(pred.confidence, 0.1);
      }
    });
  });
});

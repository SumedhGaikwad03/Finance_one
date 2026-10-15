/**
 * FinOne Classification Evaluation Framework — Core Types
 *
 * Defines test-only evaluation contracts for evaluating transaction classification,
 * financial eligibility, spending tiers, and multi-label tags independently of any
 * specific production classifier or LLM provider.
 */

export const EVALUATION_CATEGORIES = [
  "FOOD",
  "FUEL",
  "SHOPPING",
  "BILLS",
  "ENTERTAINMENT",
  "HEALTH",
  "TRAVEL",
  "EDUCATION",
  "SUBSCRIPTION",
  "GIFT",
  "OTHER",
] as const;

export type EvaluationCategory = (typeof EVALUATION_CATEGORIES)[number];

export const EVALUATION_SPENDING_TIERS = [
  "ESSENTIAL",
  "GOOD_TO_HAVE",
  "LUXURY",
  "UNCLASSIFIED",
] as const;

export type EvaluationSpendingTier = (typeof EVALUATION_SPENDING_TIERS)[number];

export const EVALUATION_FINANCIAL_MEANINGS = [
  "EXPENSE",
  "INCOME",
  "TRANSFER",
  "BALANCE_ROW",
  "INVALID",
] as const;

export type EvaluationFinancialMeaning = (typeof EVALUATION_FINANCIAL_MEANINGS)[number];

export type EvaluationDirection = "DEBIT" | "CREDIT";

/**
 * Expected ground-truth label for an evaluation fixture.
 */
export interface EvaluationExpectedLabel {
  financialMeaning: EvaluationFinancialMeaning;
  isEligibleExpense: boolean;
  category: EvaluationCategory;
  spendingTier: EvaluationSpendingTier;
  tags?: string[];
  isAmbiguous?: boolean;
  ambiguityReason?: string;
}

/**
 * A single labelled transaction in the evaluation benchmark dataset.
 */
export interface EvaluationFixture {
  id: string;
  description: string;
  amount: number;
  direction: EvaluationDirection;
  date?: string;
  expected: EvaluationExpectedLabel;
}

/**
 * Prediction emitted by a candidate classifier or adapter.
 */
export interface EvaluationPrediction {
  financialMeaning?: EvaluationFinancialMeaning;
  isEligibleExpense?: boolean;
  category?: EvaluationCategory | string;
  spendingTier?: EvaluationSpendingTier | string;
  tags?: string[];
  confidence: number;
  requiresReview?: boolean;
  rawResponse?: unknown;
}

/**
 * Pluggable classifier adapter interface.
 * Any classifier (deterministic rules, regex, local Ollama, cloud LLM) implements this.
 */
export interface ClassificationAdapter {
  readonly name: string;
  readonly version?: string;
  classify(fixture: EvaluationFixture): Promise<EvaluationPrediction> | EvaluationPrediction;
}

/**
 * Per-class precision, recall, and F1 metrics.
 */
export interface ClassMetrics {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  support: number;
  precision: number | null;
  recall: number | null;
  f1: number | null;
}

/**
 * Evaluation metrics for a discrete classification dimension (Category or Tier).
 */
export interface DimensionMetrics {
  totalSamples: number;
  evaluatedSamples: number;
  correctCount: number;
  accuracy: number;
  macroPrecision: number | null;
  macroRecall: number | null;
  macroF1: number | null;
  byClass: Record<string, ClassMetrics>;
}

/**
 * Tag-level precision, recall, and F1 (multi-label evaluation).
 */
export interface TagEvaluationMetrics {
  totalTransactionsWithTags: number;
  totalGroundTruthTags: number;
  totalPredictedTags: number;
  microPrecision: number;
  microRecall: number;
  microF1: number;
  macroF1: number | null;
  byTag: Record<string, ClassMetrics>;
}

/**
 * Financial interpretation and expense eligibility metrics.
 */
export interface FinancialEligibilityMetrics {
  totalSamples: number;
  directionAccuracy: number;
  directionCorrectCount: number;
  financialMeaningAccuracy: number;
  financialMeaningCorrectCount: number;
  eligibilityAccuracy: number;
  eligibilityCorrectCount: number;
  totalActualExpenses: number;
  omittedExpensesCount: number;
  validExpenseOmissionRate: number; // False Negatives / Total Actual Expenses
  totalNonExpenses: number;
  falsePositiveExpenseCount: number;
  falsePositiveExpenseRate: number; // False Positives / Total Non-Expenses
}

/**
 * Accuracy and coverage metrics evaluated together.
 */
export interface CoverageEvaluationMetrics {
  totalSamples: number;
  confidenceThreshold: number;
  autoClassifiedCount: number;
  coverageRate: number; // autoClassifiedCount / totalSamples
  reviewCount: number;
  reviewRate: number; // reviewCount / totalSamples
  unclassifiedTierCount: number;
  unclassifiedTierRate: number; // predicted UNCLASSIFIED / autoClassifiedCount
  autoCategoryAccuracy: number;
  autoTierAccuracy: number;
  autoErrorRate: number; // 1 - autoCategoryAccuracy
}

/**
 * Target verification item against project goals.
 */
export interface AcceptanceTargetResult {
  metricName: string;
  targetDescription: string;
  targetValue: number;
  actualValue: number;
  unit: "%" | "count" | "ratio";
  passed: boolean;
}

/**
 * Detailed case analysis for ambiguous or failed predictions.
 */
export interface EvaluationCaseComparison {
  id: string;
  description: string;
  amount: number;
  direction: EvaluationDirection;
  expected: EvaluationExpectedLabel;
  predicted: EvaluationPrediction;
  isAutoClassified: boolean;
  categoryMatch: boolean;
  tierMatch: boolean;
  eligibilityMatch: boolean;
  isAmbiguous: boolean;
}

/**
 * Comprehensive Evaluation Report structure.
 */
export interface FullEvaluationReport {
  adapterName: string;
  adapterVersion?: string;
  timestamp: string;
  confidenceThreshold: number;
  datasetSize: number;
  financial: FinancialEligibilityMetrics;
  categoryOverall: DimensionMetrics;
  categoryAutomatic: DimensionMetrics;
  spendingTierOverall: DimensionMetrics;
  spendingTierAutomatic: DimensionMetrics;
  tags: TagEvaluationMetrics;
  coverage: CoverageEvaluationMetrics;
  breakdownByFinancialMeaning: Record<
    string,
    {
      total: number;
      autoClassified: number;
      categoryAccuracy: number;
      tierAccuracy: number;
    }
  >;
  acceptanceTargets: AcceptanceTargetResult[];
  caseComparisons: EvaluationCaseComparison[];
}

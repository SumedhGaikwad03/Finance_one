import { evaluatePredictions } from "./metrics/evaluator";
import {
  ClassificationAdapter,
  EvaluationFixture,
  EvaluationPrediction,
  FullEvaluationReport,
} from "./types/evaluation.types";

export interface RunnerOptions {
  adapter: ClassificationAdapter;
  dataset: EvaluationFixture[];
  confidenceThreshold?: number; // Default: 0.65
}

/**
 * Executes an evaluation run of a classifier adapter across an evaluation dataset.
 */
export async function runEvaluation(options: RunnerOptions): Promise<FullEvaluationReport> {
  const { adapter, dataset, confidenceThreshold = 0.65 } = options;

  const predictions: EvaluationPrediction[] = [];

  for (let i = 0; i < dataset.length; i++) {
    const fixture = dataset[i];
    try {
      const pred = await adapter.classify(fixture);
      predictions.push(sanitizePrediction(pred));
    } catch (err) {
      predictions.push({
        category: "OTHER",
        spendingTier: "UNCLASSIFIED",
        confidence: 0,
        requiresReview: true,
        rawResponse: { error: String(err) },
      });
    }
  }

  return evaluatePredictions(dataset, predictions, {
    confidenceThreshold,
    adapterName: adapter.name,
    adapterVersion: adapter.version,
  });
}

/**
 * Sanitizes predictions to prevent NaN, invalid types, or undefined crashing metrics.
 */
function sanitizePrediction(p: any): EvaluationPrediction {
  if (!p || typeof p !== "object") {
    return {
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      confidence: 0,
      requiresReview: true,
    };
  }

  const confidence =
    typeof p.confidence === "number" && !isNaN(p.confidence)
      ? Math.max(0, Math.min(1, p.confidence))
      : 0;

  return {
    financialMeaning: p.financialMeaning,
    isEligibleExpense: typeof p.isEligibleExpense === "boolean" ? p.isEligibleExpense : undefined,
    category: typeof p.category === "string" ? p.category : "OTHER",
    spendingTier: typeof p.spendingTier === "string" ? p.spendingTier : "UNCLASSIFIED",
    tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
    confidence,
    requiresReview: typeof p.requiresReview === "boolean" ? p.requiresReview : confidence < 0.65,
    rawResponse: p.rawResponse,
  };
}

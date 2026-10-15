import {
  ClassificationAdapter,
  EvaluationCategory,
  EvaluationFixture,
  EvaluationPrediction,
  EvaluationSpendingTier,
} from "../types/evaluation.types";

/**
 * Adapter interface for FinOne's production ClassificationService.
 *
 * This adapter serves as the documented integration bridge between the Evaluation
 * Framework and the Classification Taxonomy workstream (Branch 01). Once PR #3
 * is merged into main, this adapter connects directly to `ClassificationService.classifyTransaction()`.
 */
export class ProductionTaxonomyAdapter implements ClassificationAdapter {
  readonly name = "ProductionTaxonomyAdapter";
  readonly version = "pending-pr3-merge";

  private serviceInstance: any = null;
  private isAvailable: boolean = false;

  constructor() {
    this.initService();
  }

  private initService() {
    try {
      const serviceModule = require("../../classification/services/classification.service");
      if (serviceModule && serviceModule.ClassificationService) {
        this.serviceInstance = new serviceModule.ClassificationService();
        this.isAvailable = true;
      }
    } catch {
      this.isAvailable = false;
      this.serviceInstance = null;
    }
  }

  get isProductionAvailable(): boolean {
    return this.isAvailable;
  }

  async classify(fixture: EvaluationFixture): Promise<EvaluationPrediction> {
    if (!this.isAvailable || !this.serviceInstance) {
      return {
        financialMeaning: fixture.direction === "DEBIT" ? "EXPENSE" : "INCOME",
        isEligibleExpense: fixture.direction === "DEBIT",
        category: "OTHER",
        spendingTier: "UNCLASSIFIED",
        tags: [],
        confidence: 0.1,
        requiresReview: true,
        rawResponse: {
          status: "pending_integration",
          message:
            "Production classification service is pending merge of feature/01-classification-taxonomy.",
        },
      };
    }

    try {
      const result = await this.serviceInstance.classifyTransaction({
        title: fixture.description,
        amount: fixture.amount,
        direction: fixture.direction,
      });

      return {
        financialMeaning: fixture.direction === "DEBIT" ? "EXPENSE" : "INCOME",
        isEligibleExpense: fixture.direction === "DEBIT",
        category: (result.category as EvaluationCategory) || "OTHER",
        spendingTier: (result.spendingTier as EvaluationSpendingTier) || "UNCLASSIFIED",
        tags: result.tags || [],
        confidence: result.confidence || 0.5,
        requiresReview: result.needsReview || result.confidence < 0.65,
        rawResponse: result,
      };
    } catch (err) {
      return {
        category: "OTHER",
        spendingTier: "UNCLASSIFIED",
        confidence: 0,
        requiresReview: true,
        rawResponse: { error: String(err) },
      };
    }
  }
}

import {
  ClassificationAdapter,
  EvaluationCategory,
  EvaluationFixture,
  EvaluationPrediction,
  EvaluationSpendingTier,
} from "../types/evaluation.types";
import {
  determineFinancialEligibility,
} from "../../classification/contracts/classification.contract";
import { ClassificationService } from "../../classification/services/classification.service";
import { Category, Priority } from "../../generated/prisma/enums";

/**
 * Adapter interface for FinOne's production ClassificationService.
 *
 * Connects directly to `determineFinancialEligibility` for ledger integrity
 * and `ClassificationService.classifyCandidate` for deterministic classification.
 */
export class ProductionTaxonomyAdapter implements ClassificationAdapter {
  readonly name = "ProductionTaxonomyAdapter";
  readonly version = "1.0.0-contracts";

  private serviceInstance: ClassificationService;
  private isAvailable: boolean = true;

  constructor() {
    this.serviceInstance = new ClassificationService();
  }

  get isProductionAvailable(): boolean {
    return this.isAvailable;
  }

  async classify(fixture: EvaluationFixture): Promise<EvaluationPrediction> {
    const isCredit = fixture.direction === "CREDIT";
    const isDebit = fixture.direction === "DEBIT";

    // 1. Check user-confirmed override first (precedence)
    if (fixture.userConfirmed && fixture.existingCategory) {
      const isExpense = fixture.expected?.isEligibleExpense ?? true;
      return {
        financialMeaning: fixture.expected?.financialMeaning || (isExpense ? "EXPENSE" : "INCOME"),
        isEligibleExpense: isExpense,
        category: fixture.existingCategory,
        spendingTier: fixture.existingPriority || "UNCLASSIFIED",
        tags: fixture.existingTags || [],
        confidence: 1.0,
        requiresReview: false,
      };
    }

    // 2. Deterministic financial eligibility
    const eligibility = determineFinancialEligibility({
      amount: fixture.amount,
      isCredit,
      isDebit,
      narration: fixture.description,
    });

    if (!eligibility.isEligibleExpense) {
      return {
        financialMeaning: eligibility.recordType,
        isEligibleExpense: false,
        category: "OTHER",
        spendingTier: "UNCLASSIFIED",
        tags: [],
        confidence: 0.99,
        requiresReview: eligibility.recordType === "INVALID",
      };
    }

    // 3. Classify candidate through ClassificationService
    try {
      const result = await this.serviceInstance.classifyCandidate({
        amount: fixture.amount,
        title: fixture.description,
        rawNarration: fixture.description,
        transactionDate: fixture.date ? new Date(fixture.date) : new Date(),
        source: "MANUAL",
        userConfirmed: fixture.userConfirmed,
        existingCategory: fixture.existingCategory as Category,
        existingPriority: fixture.existingPriority as Priority,
        existingTags: fixture.existingTags,
      });

      return {
        financialMeaning: eligibility.recordType,
        isEligibleExpense: eligibility.isEligibleExpense,
        category: (result.category as EvaluationCategory) || "OTHER",
        spendingTier: (result.priority as EvaluationSpendingTier) || "UNCLASSIFIED",
        tags: result.tags || [],
        confidence: result.confidence,
        requiresReview: result.needsReview || result.confidence < 0.65,
        rawResponse: result,
      };
    } catch (err) {
      return {
        financialMeaning: eligibility.recordType,
        isEligibleExpense: eligibility.isEligibleExpense,
        category: "OTHER",
        spendingTier: "UNCLASSIFIED",
        confidence: 0,
        requiresReview: true,
        rawResponse: { error: String(err) },
      };
    }
  }
}

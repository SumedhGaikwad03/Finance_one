import { Category, Priority } from "../../generated/prisma/enums";
import {
    ClassificationCandidate,
    ClassificationResult,
    ClassificationSourceType,
    TransactionClassificationProvider,
} from "../contracts/classification.contract";
import { MerchantRuleClassifier } from "../providers/merchant-rule.classifier";
import { RuleBasedClassifier } from "../providers/rule-based.classifier";

export interface ClassificationPipelineOptions {
    minConfidenceThreshold?: number;
    defaultFallbackPriority?: Priority;
}

export class ClassificationService {
    private providers: TransactionClassificationProvider[] = [];
    private minConfidenceThreshold: number;

    constructor(options: ClassificationPipelineOptions = {}) {
        this.minConfidenceThreshold = options.minConfidenceThreshold ?? 0.65;

        // Default pipeline configuration: Merchant Rules first, then Rule-Based Keyword Classifier
        this.registerProvider(new MerchantRuleClassifier());
        this.registerProvider(new RuleBasedClassifier());
    }

    /**
     * Registers a classification provider, maintaining sorting by priorityOrder ascending.
     */
    public registerProvider(provider: TransactionClassificationProvider): void {
        this.providers.push(provider);
        this.providers.sort((a, b) => a.priorityOrder - b.priorityOrder);
    }

    /**
     * Returns list of currently active provider IDs.
     */
    public getActiveProviders(): string[] {
        return this.providers.map((p) => p.providerId);
    }

    /**
     * Orchestrates classification for a candidate following strict precedence rules:
     * 1. User Explicit / Confirmed (Immutable)
     * 2. Registered Providers in priority order (Merchant -> Keyword -> LLM)
     * 3. Fallback Defaults (OTHER + UNCLASSIFIED)
     *
     * Invariant: Financial fields (amount, date, direction) are NEVER modified.
     */
    public async classifyCandidate(
        candidate: ClassificationCandidate
    ): Promise<ClassificationResult> {
        const classifiedAt = new Date().toISOString();

        // Level 1: User Confirmed / Explicit Manual Classification
        if (candidate.userConfirmed && candidate.existingCategory) {
            return {
                category: candidate.existingCategory,
                priority: candidate.existingPriority || Priority.UNCLASSIFIED,
                tags: candidate.existingTags || [],
                confidence: 1.0,
                needsReview: false,
                userConfirmed: true,
                providerId: "user_explicit",
                sourceType: "USER_EXPLICIT",
                reasoning: "User-confirmed classification preserved across reimports and updates",
                classifiedAt,
                isCategoryUnclassified: false,
                isPriorityUnclassified: candidate.existingPriority === Priority.UNCLASSIFIED,
            };
        }

        // Level 2 - 4: Registered Providers in priority order
        let resolvedCategory: Category | undefined = candidate.existingCategory || undefined;
        let resolvedPriority: Priority | undefined = candidate.existingPriority || undefined;
        const resolvedTags: Set<string> = new Set(candidate.existingTags || []);
        let highestConfidence = 0;
        let selectedProviderId = "fallback_default";
        let selectedSourceType: ClassificationSourceType = "FALLBACK_DEFAULT";
        let selectedReasoning: string | undefined;

        for (const provider of this.providers) {
            try {
                const suggestion = await provider.classify(candidate);
                if (!suggestion) continue;

                // Adopt category if not yet resolved or if this suggestion has higher confidence
                if (suggestion.category && (!resolvedCategory || suggestion.confidence > highestConfidence)) {
                    resolvedCategory = suggestion.category;
                }

                // Adopt priority if not yet resolved or if this suggestion has higher confidence
                if (suggestion.priority && (!resolvedPriority || suggestion.confidence > highestConfidence)) {
                    resolvedPriority = suggestion.priority;
                }

                // Accumulate suggested tags
                if (suggestion.tags) {
                    for (const t of suggestion.tags) {
                        resolvedTags.add(t);
                    }
                }

                if (suggestion.confidence > highestConfidence) {
                    highestConfidence = suggestion.confidence;
                    selectedProviderId = suggestion.providerId;
                    selectedSourceType =
                        provider.providerType === "merchant_map"
                            ? "MERCHANT_RULE"
                            : provider.providerType === "deterministic_rule"
                            ? "KEYWORD_RULE"
                            : provider.providerType === "local_llm"
                            ? "LOCAL_LLM"
                            : "CLOUD_LLM";
                    selectedReasoning = suggestion.reasoning;
                }

                // If high confidence match achieved (>= 0.9), stop early
                if (highestConfidence >= 0.9 && resolvedCategory && resolvedPriority) {
                    break;
                }
            } catch (err) {
                // Individual provider error must never crash the pipeline
                console.error(`Classification provider '${provider.providerId}' failed:`, err);
            }
        }

        // Level 5: Canonical Fallbacks for unresolved dimensions
        const isCategoryUnclassified = !resolvedCategory;
        const isPriorityUnclassified = !resolvedPriority || resolvedPriority === Priority.UNCLASSIFIED;
        const finalCategory = resolvedCategory || Category.OTHER;
        const finalPriority = resolvedPriority || Priority.UNCLASSIFIED;
        const finalTags = Array.from(resolvedTags);

        // A transaction needs review if confidence is low, tier is UNCLASSIFIED, or category was unclassified/unknown.
        // Explicit Category.OTHER with adequate confidence does NOT trigger review (not conflated with unknown).
        const needsReview =
            highestConfidence < this.minConfidenceThreshold ||
            finalPriority === Priority.UNCLASSIFIED ||
            isCategoryUnclassified;

        return {
            category: finalCategory,
            priority: finalPriority,
            tags: finalTags,
            confidence: highestConfidence > 0 ? highestConfidence : 0.2,
            needsReview,
            userConfirmed: false,
            providerId: selectedProviderId,
            sourceType: selectedSourceType,
            reasoning: selectedReasoning || (isCategoryUnclassified ? "Default fallback for unclassified category" : "Resolved classification"),
            classifiedAt,
            isCategoryUnclassified,
            isPriorityUnclassified,
        };
    }
}

export const defaultClassificationService = new ClassificationService();

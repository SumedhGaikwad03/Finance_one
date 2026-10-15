import { Category, Priority } from "../../generated/prisma/enums";
import {
    ClassificationCandidate,
    ClassificationSuggestion,
    TAXONOMY_CATEGORIES,
    TAXONOMY_PRIORITIES,
    TransactionClassificationProvider,
} from "../contracts/classification.contract";

/**
 * Expected JSON response format from any LLM classification provider.
 */
export interface LlmClassificationOutputPayload {
    category?: string;
    priority?: string;
    tags?: string[];
    confidence?: number;
    reasoning?: string;
}

/**
 * Validates and converts raw LLM JSON output to a safe ClassificationSuggestion.
 * Guarantees that:
 * 1. Only valid Category and Priority enums are accepted.
 * 2. Financial amounts, dates, or eligibility are NEVER modified.
 * 3. Confidence is strictly bounded [0.0, 1.0].
 */
export function validateLlmClassificationPayload(
    raw: unknown,
    providerId: string = "llm_classifier"
): ClassificationSuggestion | null {
    if (!raw || typeof raw !== "object") return null;

    const payload = raw as LlmClassificationOutputPayload;

    let validCategory: Category | undefined;
    if (payload.category) {
        const upper = payload.category.trim().toUpperCase();
        if (TAXONOMY_CATEGORIES.includes(upper as Category)) {
            validCategory = upper as Category;
        }
    }

    let validPriority: Priority | undefined;
    if (payload.priority) {
        const upper = payload.priority.trim().toUpperCase();
        if (TAXONOMY_PRIORITIES.includes(upper as Priority)) {
            validPriority = upper as Priority;
        }
    }

    const safeTags: string[] = [];
    if (Array.isArray(payload.tags)) {
        for (const t of payload.tags) {
            if (typeof t === "string") {
                const clean = t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
                if (clean.length > 0 && clean.length <= 30) {
                    safeTags.push(clean);
                }
            }
        }
    }

    let rawConf = typeof payload.confidence === "number" ? payload.confidence : 0.7;
    if (isNaN(rawConf)) rawConf = 0.5;
    const boundedConfidence = Math.max(0.0, Math.min(1.0, rawConf));

    if (!validCategory && !validPriority && safeTags.length === 0) {
        return null;
    }

    return {
        category: validCategory,
        priority: validPriority,
        tags: safeTags.length > 0 ? safeTags : undefined,
        confidence: boundedConfidence,
        providerId,
        reasoning: typeof payload.reasoning === "string" ? payload.reasoning.slice(0, 300) : undefined,
    };
}

/**
 * System prompt specification for LLM classification models.
 */
export const LLM_CLASSIFICATION_SYSTEM_PROMPT = `You are a financial classification assistant for Finance One.
Your task is to classify a single personal expense transaction based on its title, notes, and raw narration.

Allowed Categories:
- FOOD (Groceries, restaurants, cafes, snacks, food delivery)
- FUEL (Automobile fuel, petrol, diesel, local commute transit)
- SHOPPING (Retail, clothing, gadgets, personal items)
- BILLS (Utilities, electricity, water, rent, internet, recurring bills)
- ENTERTAINMENT (Movies, concerts, gaming, outings, shows)
- HEALTH (Medical care, doctors, pharmacies, medicines, fitness)
- TRAVEL (Long-distance travel, vacations, flights, hotels)
- EDUCATION (Courses, books, tuition, school/college fees)
- SUBSCRIPTION (Digital subscriptions, SaaS, software, streaming)
- GIFT (Presents, celebrations, charities, donations)
- OTHER (Uncategorized or miscellaneous)

Allowed Spending Tiers (Priority):
- ESSENTIAL (Non-negotiable core survival needs: rent, utilities, basic groceries, medicine)
- GOOD_TO_HAVE (Comfort and lifestyle enhancements: dining out, shopping, hobbies, cabs)
- LUXURY (Discretionary premium spending: fine dining, luxury travel, lavish items)
- UNCLASSIFIED (Use when ambiguous or uncertain)

Rules:
1. Return ONLY valid JSON conforming to:
   { "category": "CATEGORY", "priority": "PRIORITY", "tags": ["tag1"], "confidence": 0.85, "reasoning": "brief explanation" }
2. NEVER modify or comment on transaction amounts, dates, or financial direction.
3. If unsure of category, use "OTHER". If unsure of spending tier, use "UNCLASSIFIED".
`;

/**
 * Base interface for local or remote LLM classification providers.
 */
export interface LlmClassifierProvider extends TransactionClassificationProvider {
    readonly providerType: "local_llm" | "cloud_llm";
    readonly modelName: string;
}

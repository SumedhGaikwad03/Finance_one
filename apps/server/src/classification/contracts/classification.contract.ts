import { Category, Priority, TransactionSource } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";

/**
 * ============================================================================
 * FINANCE ONE — FORMAL TRANSACTION CLASSIFICATION TAXONOMY & CONTRACT
 * ============================================================================
 *
 * This contract formalizes the multi-dimensional classification taxonomy for
 * Finance One transactions. It establishes:
 *   1. Financial Meaning & Transaction Eligibility (Expense vs Credit/Transfer/Balance)
 *   2. Expense Category (What money was spent on)
 *   3. Spending Tier / Intent (Budgetary necessity: Essential / Good to Have / Luxury / Unclassified)
 *   4. Optional Tags (Orthogonal contextual attributes)
 *   5. Provenance & Confidence Metadata
 *   6. Provider-Independent Classification Contract
 */

// ----------------------------------------------------------------------------
// 1. FINANCIAL RECORD ELIGIBILITY & MEANING
// ----------------------------------------------------------------------------

export type FinancialRecordType =
    | "EXPENSE"          // Outgoing debit representing actual consumption
    | "INCOME"           // Incoming credit (salary, deposit, refund, interest)
    | "TRANSFER"         // Account-to-account transfer or liquidity rebalancing
    | "BALANCE_SUMMARY"  // Statement opening/closing balance or summary row
    | "INVALID";         // Malformed row missing required financial fields

export interface FinancialEligibility {
    recordType: FinancialRecordType;
    isEligibleExpense: boolean;
    reason?: string;
}

// ----------------------------------------------------------------------------
// 2. EXPENSE CATEGORY TAXONOMY
// ----------------------------------------------------------------------------

export const TAXONOMY_CATEGORIES = [
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
] as const;

export type TaxonomyCategory = typeof TAXONOMY_CATEGORIES[number];

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
    FOOD: "Food, dining, groceries, cafes, and restaurants",
    FUEL: "Automobile fuel, petrol, diesel, and essential local transit",
    SHOPPING: "Retail shopping, clothing, gadgets, and personal goods",
    BILLS: "Utilities, rent, electricity, water, internet, and recurring bills",
    ENTERTAINMENT: "Movies, concerts, gaming, outings, and recreation",
    HEALTH: "Medical care, doctors, pharmacies, medicines, and fitness",
    TRAVEL: "Long-distance travel, vacations, flights, and hotels",
    EDUCATION: "Courses, books, tuition fees, schooling, and training",
    SUBSCRIPTION: "Digital subscriptions, software licenses, streaming, and SaaS",
    GIFT: "Presents, celebrations, donations, and charitable giving",
    OTHER: "Uncategorized or general miscellaneous expenses",
};

// ----------------------------------------------------------------------------
// 3. SPENDING TIER TAXONOMY (PRIORITY)
// ----------------------------------------------------------------------------

export const TAXONOMY_PRIORITIES = [
    Priority.ESSENTIAL,
    Priority.GOOD_TO_HAVE,
    Priority.LUXURY,
    Priority.UNCLASSIFIED,
] as const;

export type TaxonomyPriority = typeof TAXONOMY_PRIORITIES[number];

export const PRIORITY_DESCRIPTIONS: Record<Priority, string> = {
    ESSENTIAL: "Core survival needs: rent, utilities, basic groceries, healthcare",
    GOOD_TO_HAVE: "Comfort and lifestyle enhancements: dining out, shopping, hobbies",
    LUXURY: "Discretionary premium spending: fine dining, luxury travel, lavish items",
    UNCLASSIFIED: "Pending review / unassigned tier: valid expense awaiting classification",
};

// ----------------------------------------------------------------------------
// 4. CANONICAL OPTIONAL TAGS
// ----------------------------------------------------------------------------

/**
 * Standard tag vocabulary describing orthogonal transaction attributes.
 * Tags MUST NOT duplicate Category or Priority dimensions.
 */
export const CANONICAL_TAGS = [
    "recurring",
    "subscription",
    "work_expense",
    "reimbursable",
    "tax_deductible",
    "travel_trip",
    "emergency",
    "family",
    "shared_split",
    "cash_withdrawal",
] as const;

export type CanonicalTag = typeof CANONICAL_TAGS[number];

// ----------------------------------------------------------------------------
// 5. PROVENANCE & CLASSIFICATION CONFIDENCE METADATA
// ----------------------------------------------------------------------------

export type ClassificationSourceType =
    | "USER_EXPLICIT"    // Set manually during creation or modal edit
    | "MERCHANT_RULE"   // Matched by deterministic merchant rule
    | "KEYWORD_RULE"    // Matched by deterministic keyword rule
    | "LOCAL_LLM"       // Predicted by local Ollama model
    | "CLOUD_LLM"       // Predicted by configured 3rd-party LLM API
    | "FALLBACK_DEFAULT"; // Default assignment for unclassified items

export interface ClassificationMetadata {
    sourceType: ClassificationSourceType;
    confidence: number; // 0.0 to 1.0
    providerId: string;
    ruleId?: string;
    reasoning?: string;
    userConfirmed: boolean;
    needsReview: boolean;
    classifiedAt: string; // ISO 8601
    tags: string[];
}

// ----------------------------------------------------------------------------
// 6. CLASSIFIER CONTRACT
// ----------------------------------------------------------------------------

/**
 * Input candidate provided to classification providers.
 * Immutable financial values (amount, date, source) are provided for context
 * but must NEVER be altered by any classifier.
 */
export interface ClassificationCandidate {
    readonly amount: number | Prisma.Decimal;
    readonly title: string | null;
    readonly notes?: string | null;
    readonly rawNarration?: string | null;
    readonly transactionDate: Date;
    readonly source: TransactionSource;
    readonly existingCategory?: Category | null;
    readonly existingPriority?: Priority | null;
    readonly existingTags?: string[];
    readonly userConfirmed?: boolean;
}

/**
 * Suggestion produced by a classification provider.
 */
export interface ClassificationSuggestion {
    category?: Category;
    priority?: Priority;
    tags?: string[];
    confidence: number; // 0.0 to 1.0
    providerId: string;
    reasoning?: string;
    ruleId?: string;
}

/**
 * Resolved classification result after applying precedence and validation.
 */
export interface ClassificationResult {
    category: Category;
    priority: Priority;
    tags: string[];
    confidence: number;
    needsReview: boolean;
    userConfirmed: boolean;
    providerId: string;
    sourceType: ClassificationSourceType;
    reasoning?: string;
    classifiedAt: string;
}

/**
 * Provider-Independent Classification Contract.
 * Implementations can be deterministic rules, merchant lookups, local LLMs, or cloud APIs.
 */
export interface TransactionClassificationProvider {
    readonly providerId: string;
    readonly providerType: "deterministic_rule" | "merchant_map" | "local_llm" | "cloud_llm";
    readonly priorityOrder: number; // Lower numbers run first

    classify(candidate: ClassificationCandidate): Promise<ClassificationSuggestion | null>;
    classifyBatch?(candidates: ClassificationCandidate[]): Promise<(ClassificationSuggestion | null)[]>;
}

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
    isCategoryUnclassified?: boolean;
    isPriorityUnclassified?: boolean;
}

/**
 * Deterministically evaluates financial eligibility and record type.
 * Decided completely deterministically without any LLM or heuristic classifier.
 */
export function determineFinancialEligibility(params: {
    amount?: number | Prisma.Decimal | null;
    isCredit?: boolean;
    isDebit?: boolean;
    narration?: string | null;
}): FinancialEligibility {
    const text = (params.narration || "").trim().toLowerCase();

    // 1. Validation / Invalid check (empty narration or missing/non-positive amount)
    if (!text) {
        return {
            recordType: "INVALID",
            isEligibleExpense: false,
            reason: "Missing or empty transaction narration",
        };
    }

    // 1. Balance Summary detection (can appear with zero or blank amounts in statement header/footers)
    const summaryPatterns = [
        /^(opening|closing|current|available|ledger|clear)\s+(?:[\w-]+\s+)*balance/i,
        /^(opening|closing|current|available|ledger|clear)\s*balance/i,
        /^(total|subtotal|summary|brought forward|carried forward|b\/f|c\/f)$/i,
        /^(statement|account)\s*(summary|period|overview|total)/i,
        /^balance\s*(b\/f|c\/f|as on)/i,
        /^grand\s*total/i,
        /statement summary/i,
        /\bledger\s*balance\b/i,
    ];
    if (summaryPatterns.some((p) => p.test(text))) {
        return {
            recordType: "BALANCE_SUMMARY",
            isEligibleExpense: false,
            reason: "Statement summary or balance header/footer row",
        };
    }

    // 2. Amount Validation Check
    if (params.amount === null || params.amount === undefined) {
        return {
            recordType: "INVALID",
            isEligibleExpense: false,
            reason: "Missing monetary amount",
        };
    }
    const numAmount = params.amount instanceof Prisma.Decimal ? params.amount.toNumber() : Number(params.amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
        return {
            recordType: "INVALID",
            isEligibleExpense: false,
            reason: "Invalid, zero, or negative monetary amount",
        };
    }

    // 3. Transfer detection (internal accounts, deposits, sweeps, investments)
    const transferPatterns = [
        /\b(fund\s*transfer|ac\s*trf|account\s*transfer|internal\s*transfer|self\s*transfer|neft\s*trf|imps\s*trf)\b/i,
        /\b(trf|transfer|outward)\s+to\s+(?:[\w-]+\s+)*(self|account|savings|current|fixed\s*deposit|fd|rd|own\s*account|ppf)\b/i,
        /\b(trf|transfer|outward)\s*to\s*(self|account|savings|current|fixed\s*deposit|fd|rd|own\s*account|ppf)\b/i,
        /\b(to\s*own\s*account|own\s*account\s*transfer)\b/i,
        /\b(fd\s*creation|rd\s*a\/c|rd\s*instalment|auto\s*sweep|sweep\s*transfer|sip-.*mutual|ppf\s*account)\b/i,
    ];
    if (transferPatterns.some((p) => p.test(text))) {
        return {
            recordType: "TRANSFER",
            isEligibleExpense: false,
            reason: "Internal account transfer or liquidity rebalancing - excluded from expense ledger",
        };
    }

    // 4. Direction Check: Credits vs Debits
    if (params.isCredit && !params.isDebit) {
        return {
            recordType: "INCOME",
            isEligibleExpense: false,
            reason: "Credit / deposit entry - excluded from expense ledger",
        };
    }

    // Income keywords check
    const incomeKeywords = [
        /\b(salary|payroll|dividend|interest\s*credit|interest\s*paid|refund\s*credited|refund\s*processed|cashback\s*credited|cash\s*deposit|credit\s*by\s*freelance)\b/i,
    ];
    if (params.isCredit || incomeKeywords.some((p) => p.test(text))) {
        return {
            recordType: "INCOME",
            isEligibleExpense: false,
            reason: "Credit / deposit entry (income, salary, or refund) - excluded from expense ledger",
        };
    }

    // 5. Eligible Expense
    return {
        recordType: "EXPENSE",
        isEligibleExpense: true,
        reason: "Valid outgoing expense debit",
    };
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
    isCategoryUnclassified?: boolean;
    isPriorityUnclassified?: boolean;
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

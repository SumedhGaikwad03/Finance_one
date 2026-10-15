import {
  ClassificationAdapter,
  EvaluationCategory,
  EvaluationFixture,
  EvaluationPrediction,
  EvaluationSpendingTier,
} from "../types/evaluation.types";

/**
 * Known merchant directory with high-confidence domain mappings.
 */
interface MerchantRule {
  pattern: RegExp;
  category: EvaluationCategory;
  tier: EvaluationSpendingTier;
  tags: string[];
  confidence: number;
}

const MERCHANT_RULES: MerchantRule[] = [
  // Food & Dining
  {
    pattern: /swiggy/i,
    category: "FOOD",
    tier: "GOOD_TO_HAVE",
    tags: ["food", "delivery", "dinner"],
    confidence: 0.95,
  },
  {
    pattern: /zomato/i,
    category: "FOOD",
    tier: "GOOD_TO_HAVE",
    tags: ["food", "dining", "weekend"],
    confidence: 0.95,
  },
  {
    pattern: /dmart/i,
    category: "FOOD",
    tier: "ESSENTIAL",
    tags: ["groceries", "supermarket", "household"],
    confidence: 0.95,
  },
  {
    pattern: /blinkit/i,
    category: "FOOD",
    tier: "ESSENTIAL",
    tags: ["groceries", "quick-commerce"],
    confidence: 0.95,
  },
  {
    pattern: /zepto/i,
    category: "FOOD",
    tier: "ESSENTIAL",
    tags: ["groceries", "quick-commerce"],
    confidence: 0.95,
  },
  {
    pattern: /starbucks/i,
    category: "FOOD",
    tier: "LUXURY",
    tags: ["coffee", "cafe", "discretionary"],
    confidence: 0.95,
  },
  {
    pattern: /nature.*basket/i,
    category: "FOOD",
    tier: "LUXURY",
    tags: ["groceries", "gourmet", "luxury"],
    confidence: 0.95,
  },
  {
    pattern: /chai|tea.*corner/i,
    category: "FOOD",
    tier: "GOOD_TO_HAVE",
    tags: ["tea", "snacks"],
    confidence: 0.85,
  },

  // Fuel
  {
    pattern: /shell/i,
    category: "FUEL",
    tier: "ESSENTIAL",
    tags: ["fuel", "petrol", "vehicle"],
    confidence: 0.95,
  },
  {
    pattern: /hpcl/i,
    category: "FUEL",
    tier: "ESSENTIAL",
    tags: ["fuel", "petrol"],
    confidence: 0.95,
  },
  {
    pattern: /iocl/i,
    category: "FUEL",
    tier: "ESSENTIAL",
    tags: ["fuel", "petrol"],
    confidence: 0.95,
  },
  {
    pattern: /bpcl/i,
    category: "FUEL",
    tier: "ESSENTIAL",
    tags: ["fuel", "highway"],
    confidence: 0.95,
  },

  // Shopping
  {
    pattern: /amazon.*seller|amazon.*retail/i,
    category: "SHOPPING",
    tier: "GOOD_TO_HAVE",
    tags: ["shopping", "online", "retail"],
    confidence: 0.9,
  },
  {
    pattern: /flipkart/i,
    category: "SHOPPING",
    tier: "GOOD_TO_HAVE",
    tags: ["shopping", "electronics"],
    confidence: 0.9,
  },
  {
    pattern: /myntra/i,
    category: "SHOPPING",
    tier: "GOOD_TO_HAVE",
    tags: ["shopping", "clothing"],
    confidence: 0.95,
  },
  {
    pattern: /zara/i,
    category: "SHOPPING",
    tier: "LUXURY",
    tags: ["shopping", "clothing", "luxury"],
    confidence: 0.95,
  },
  {
    pattern: /uniqlo/i,
    category: "SHOPPING",
    tier: "GOOD_TO_HAVE",
    tags: ["shopping", "clothing"],
    confidence: 0.95,
  },

  // Bills & Utilities
  {
    pattern: /bescom/i,
    category: "BILLS",
    tier: "ESSENTIAL",
    tags: ["bills", "utility", "electricity"],
    confidence: 0.95,
  },
  {
    pattern: /tata power/i,
    category: "BILLS",
    tier: "ESSENTIAL",
    tags: ["bills", "electricity"],
    confidence: 0.95,
  },
  {
    pattern: /bwssb/i,
    category: "BILLS",
    tier: "ESSENTIAL",
    tags: ["bills", "utility", "water"],
    confidence: 0.95,
  },
  {
    pattern: /airtel.*broadband|airtel.*fiber/i,
    category: "BILLS",
    tier: "ESSENTIAL",
    tags: ["bills", "internet", "broadband"],
    confidence: 0.95,
  },
  {
    pattern: /indane|lpg.*gas/i,
    category: "BILLS",
    tier: "ESSENTIAL",
    tags: ["bills", "utility", "gas"],
    confidence: 0.95,
  },
  {
    pattern: /jio.*postpaid/i,
    category: "BILLS",
    tier: "ESSENTIAL",
    tags: ["bills", "mobile"],
    confidence: 0.95,
  },
  {
    pattern: /amazon.*pay.*bills/i,
    category: "BILLS",
    tier: "ESSENTIAL",
    tags: ["bills", "amazon-pay"],
    confidence: 0.85,
  },

  // Entertainment
  {
    pattern: /bookmyshow/i,
    category: "ENTERTAINMENT",
    tier: "GOOD_TO_HAVE",
    tags: ["entertainment", "movie", "weekend"],
    confidence: 0.95,
  },
  {
    pattern: /pvr|inox/i,
    category: "ENTERTAINMENT",
    tier: "GOOD_TO_HAVE",
    tags: ["entertainment", "movie"],
    confidence: 0.95,
  },
  {
    pattern: /steam.*game|valve/i,
    category: "ENTERTAINMENT",
    tier: "GOOD_TO_HAVE",
    tags: ["entertainment", "gaming"],
    confidence: 0.95,
  },

  // Health
  {
    pattern: /apollo.*pharmacy/i,
    category: "HEALTH",
    tier: "ESSENTIAL",
    tags: ["health", "pharmacy", "medicine"],
    confidence: 0.95,
  },
  {
    pattern: /practo/i,
    category: "HEALTH",
    tier: "ESSENTIAL",
    tags: ["health", "doctor"],
    confidence: 0.95,
  },
  {
    pattern: /lal pathlabs/i,
    category: "HEALTH",
    tier: "ESSENTIAL",
    tags: ["health", "lab", "diagnostics"],
    confidence: 0.95,
  },
  {
    pattern: /fortis/i,
    category: "HEALTH",
    tier: "ESSENTIAL",
    tags: ["health", "hospital"],
    confidence: 0.95,
  },

  // Travel
  {
    pattern: /uber/i,
    category: "TRAVEL",
    tier: "ESSENTIAL",
    tags: ["travel", "commute", "cab"],
    confidence: 0.95,
  },
  {
    pattern: /ola/i,
    category: "TRAVEL",
    tier: "ESSENTIAL",
    tags: ["travel", "commute", "cab"],
    confidence: 0.95,
  },
  {
    pattern: /irctc|railway/i,
    category: "TRAVEL",
    tier: "GOOD_TO_HAVE",
    tags: ["travel", "train", "railway"],
    confidence: 0.95,
  },
  {
    pattern: /makemytrip/i,
    category: "TRAVEL",
    tier: "GOOD_TO_HAVE",
    tags: ["travel", "flight", "vacation"],
    confidence: 0.95,
  },
  {
    pattern: /fastag/i,
    category: "TRAVEL",
    tier: "ESSENTIAL",
    tags: ["travel", "toll"],
    confidence: 0.95,
  },
  {
    pattern: /metro.*recharge|namma metro/i,
    category: "TRAVEL",
    tier: "ESSENTIAL",
    tags: ["travel", "commute", "metro"],
    confidence: 0.95,
  },

  // Education
  {
    pattern: /coursera/i,
    category: "EDUCATION",
    tier: "GOOD_TO_HAVE",
    tags: ["education", "course", "learning"],
    confidence: 0.95,
  },
  {
    pattern: /udemy/i,
    category: "EDUCATION",
    tier: "GOOD_TO_HAVE",
    tags: ["education", "course"],
    confidence: 0.95,
  },
  {
    pattern: /allen.*career|tuition/i,
    category: "EDUCATION",
    tier: "ESSENTIAL",
    tags: ["education", "tuition", "coaching"],
    confidence: 0.95,
  },

  // Subscriptions
  {
    pattern: /netflix/i,
    category: "SUBSCRIPTION",
    tier: "GOOD_TO_HAVE",
    tags: ["subscription", "streaming", "ott"],
    confidence: 0.95,
  },
  {
    pattern: /spotify/i,
    category: "SUBSCRIPTION",
    tier: "GOOD_TO_HAVE",
    tags: ["subscription", "music"],
    confidence: 0.95,
  },
  {
    pattern: /google.*one|google storage/i,
    category: "SUBSCRIPTION",
    tier: "ESSENTIAL",
    tags: ["subscription", "cloud", "tech"],
    confidence: 0.95,
  },
  {
    pattern: /github.*copilot/i,
    category: "SUBSCRIPTION",
    tier: "ESSENTIAL",
    tags: ["subscription", "software", "tech"],
    confidence: 0.95,
  },
  {
    pattern: /hotstar|disney/i,
    category: "SUBSCRIPTION",
    tier: "GOOD_TO_HAVE",
    tags: ["subscription", "streaming"],
    confidence: 0.95,
  },
  {
    pattern: /airtel.*xstream/i,
    category: "SUBSCRIPTION",
    tier: "GOOD_TO_HAVE",
    tags: ["subscription", "streaming"],
    confidence: 0.9,
  },

  // Gifts
  {
    pattern: /ferns n petals/i,
    category: "GIFT",
    tier: "GOOD_TO_HAVE",
    tags: ["gift", "flowers", "celebration"],
    confidence: 0.95,
  },
  {
    pattern: /cry.*child/i,
    category: "GIFT",
    tier: "GOOD_TO_HAVE",
    tags: ["gift", "charity", "donation"],
    confidence: 0.95,
  },

  // Other specific
  {
    pattern: /property tax/i,
    category: "OTHER",
    tier: "ESSENTIAL",
    tags: ["tax", "government"],
    confidence: 0.95,
  },
];

/**
 * Deterministic Baseline Classifier Adapter.
 *
 * Implements full financial meaning detection, rule-based classification,
 * spending tier assignment, tag extraction, and confidence scoring without
 * any external AI or database dependencies.
 */
export class DeterministicBaselineAdapter implements ClassificationAdapter {
  readonly name = "DeterministicBaselineAdapter";
  readonly version = "1.0.0-rules";

  classify(fixture: EvaluationFixture): EvaluationPrediction {
    const desc = fixture.description || "";
    const amount = fixture.amount;
    const direction = fixture.direction;

    // 1. Edge Case: Invalid records (zero amount, empty description)
    if (amount <= 0 || !desc.trim()) {
      return {
        financialMeaning: "INVALID",
        isEligibleExpense: false,
        category: "OTHER",
        spendingTier: "UNCLASSIFIED",
        tags: [],
        confidence: 0.95,
        requiresReview: true,
      };
    }

    // 2. Balance Rows (Opening / Closing balance records)
    if (/opening balance|closing balance|balance b\/f|balance c\/f/i.test(desc)) {
      return {
        financialMeaning: "BALANCE_ROW",
        isEligibleExpense: false,
        category: "OTHER",
        spendingTier: "UNCLASSIFIED",
        tags: ["balance", "statement"],
        confidence: 0.99,
        requiresReview: false,
      };
    }

    // 3. Credits & Incoming Income (Salary, Dividends, Interest, Client Payments)
    if (
      direction === "CREDIT" ||
      /salary|payroll|dividend|interest paid|interest credited|freelance client/i.test(desc)
    ) {
      if (/refund|reversal/i.test(desc)) {
        return {
          financialMeaning: "TRANSFER",
          isEligibleExpense: false,
          category: /flipkart|amazon/i.test(desc) ? "SHOPPING" : "BILLS",
          spendingTier: "UNCLASSIFIED",
          tags: ["refund"],
          confidence: 0.92,
          requiresReview: false,
        };
      }

      if (/sweep|transfer/i.test(desc)) {
        return {
          financialMeaning: "TRANSFER",
          isEligibleExpense: false,
          category: "OTHER",
          spendingTier: "UNCLASSIFIED",
          tags: ["transfer"],
          confidence: 0.9,
          requiresReview: false,
        };
      }

      return {
        financialMeaning: "INCOME",
        isEligibleExpense: false,
        category: "OTHER",
        spendingTier: "UNCLASSIFIED",
        tags: ["salary", "income"],
        confidence: 0.96,
        requiresReview: false,
      };
    }

    // 4. Transfers (FD, RD, Investment transfers)
    if (/transfer to fixed deposit|fd creation|rd a\/c|sweep transfer/i.test(desc)) {
      return {
        financialMeaning: "TRANSFER",
        isEligibleExpense: false,
        category: "OTHER",
        spendingTier: "UNCLASSIFIED",
        tags: ["transfer", "savings"],
        confidence: 0.95,
        requiresReview: false,
      };
    }

    // 5. Explicit Merchant Matching (High Confidence)
    for (const rule of MERCHANT_RULES) {
      if (rule.pattern.test(desc)) {
        return {
          financialMeaning: "EXPENSE",
          isEligibleExpense: true,
          category: rule.category,
          spendingTier: rule.tier,
          tags: rule.tags,
          confidence: rule.confidence,
          requiresReview: false,
        };
      }
    }

    // 6. Generic Keyword Fallbacks
    if (/grocer|supermarket|food|dining|restaurant|kitchen|cafe|coffee|snacks/i.test(desc)) {
      return {
        financialMeaning: "EXPENSE",
        isEligibleExpense: true,
        category: "FOOD",
        spendingTier: "GOOD_TO_HAVE",
        tags: ["food"],
        confidence: 0.75,
        requiresReview: false,
      };
    }

    if (/petrol|fuel|diesel|cng/i.test(desc)) {
      return {
        financialMeaning: "EXPENSE",
        isEligibleExpense: true,
        category: "FUEL",
        spendingTier: "ESSENTIAL",
        tags: ["fuel"],
        confidence: 0.8,
        requiresReview: false,
      };
    }

    if (/electricity|water bill|broadband|wifi|cylinder|utility|postpaid/i.test(desc)) {
      return {
        financialMeaning: "EXPENSE",
        isEligibleExpense: true,
        category: "BILLS",
        spendingTier: "ESSENTIAL",
        tags: ["bills"],
        confidence: 0.8,
        requiresReview: false,
      };
    }

    if (/medicine|pharmacy|clinic|hospital|doctor|lab/i.test(desc)) {
      return {
        financialMeaning: "EXPENSE",
        isEligibleExpense: true,
        category: "HEALTH",
        spendingTier: "ESSENTIAL",
        tags: ["health"],
        confidence: 0.8,
        requiresReview: false,
      };
    }

    if (/cab|taxi|train|ticket|flight|toll|metro/i.test(desc)) {
      return {
        financialMeaning: "EXPENSE",
        isEligibleExpense: true,
        category: "TRAVEL",
        spendingTier: "ESSENTIAL",
        tags: ["travel"],
        confidence: 0.8,
        requiresReview: false,
      };
    }

    // 7. Ambiguous or Unknown fallback
    // Flag low confidence to trigger review according to confidence threshold
    return {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: [],
      confidence: 0.45,
      requiresReview: true,
    };
  }
}

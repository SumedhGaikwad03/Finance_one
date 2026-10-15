import { Category, Priority } from "../../generated/prisma/enums";
import {
    ClassificationCandidate,
    ClassificationSuggestion,
    TransactionClassificationProvider,
} from "../contracts/classification.contract";

export interface MerchantRule {
    pattern: RegExp;
    category: Category;
    priority: Priority;
    tags?: string[];
    merchantName: string;
}

/**
 * Built-in and user-customizable merchant rules dictionary.
 */
export const DEFAULT_MERCHANT_RULES: MerchantRule[] = [
    { pattern: /\b(swiggy|zomato|ubereats)\b/i, category: Category.FOOD, priority: Priority.GOOD_TO_HAVE, tags: ["dining", "food_delivery"], merchantName: "Food Delivery" },
    { pattern: /\b(blinkit|zepto|instamart|bigbasket|dunzo)\b/i, category: Category.FOOD, priority: Priority.ESSENTIAL, tags: ["groceries", "quick_commerce"], merchantName: "Quick Grocery" },
    { pattern: /\b(bescom|tatapower|adani\s*electricity|mahavitaran)\b/i, category: Category.BILLS, priority: Priority.ESSENTIAL, tags: ["electricity", "recurring"], merchantName: "Electricity Board" },
    { pattern: /\b(airtel|jio|vodafone|vi\s*bill)\b/i, category: Category.BILLS, priority: Priority.ESSENTIAL, tags: ["telecom", "recurring"], merchantName: "Telecom Provider" },
    { pattern: /\b(netflix|spotify|hotstar|prime\s*video|apple\.com\/bill)\b/i, category: Category.SUBSCRIPTION, priority: Priority.GOOD_TO_HAVE, tags: ["subscription", "streaming"], merchantName: "Digital Entertainment" },
    { pattern: /\b(uber|ola|rapido)\b/i, category: Category.TRAVEL, priority: Priority.ESSENTIAL, tags: ["cab", "commute"], merchantName: "Ride Hailing" },
    { pattern: /\b(apollo\s*pharmacy|medplus|pharmeasy|1mg)\b/i, category: Category.HEALTH, priority: Priority.ESSENTIAL, tags: ["pharmacy", "medical"], merchantName: "Pharmacy" },
    { pattern: /\b(amazon|flipkart|myntra)\b/i, category: Category.SHOPPING, priority: Priority.GOOD_TO_HAVE, tags: ["ecommerce"], merchantName: "Online Marketplace" },
    { pattern: /\b(pvr|inox|cinepolis)\b/i, category: Category.ENTERTAINMENT, priority: Priority.GOOD_TO_HAVE, tags: ["cinema", "outing"], merchantName: "Movie Theatre" },
    { pattern: /\b(hpcl|bpcl|ioc|shell)\b/i, category: Category.FUEL, priority: Priority.ESSENTIAL, tags: ["petrol", "fuel"], merchantName: "Fuel Station" },
];

export class MerchantRuleClassifier implements TransactionClassificationProvider {
    public readonly providerId = "merchant_rule_classifier";
    public readonly providerType = "merchant_map";
    public readonly priorityOrder = 10; // Runs before keyword classifier

    private customRules: MerchantRule[] = [];

    constructor(customRules: MerchantRule[] = []) {
        this.customRules = customRules;
    }

    public registerRule(rule: MerchantRule): void {
        this.customRules.push(rule);
    }

    public async classify(candidate: ClassificationCandidate): Promise<ClassificationSuggestion | null> {
        const textParts = [
            candidate.title || "",
            candidate.rawNarration || "",
        ];
        const text = textParts.join(" ").trim();
        if (!text) return null;

        // Check custom rules first, then default rules
        const rules = [...this.customRules, ...DEFAULT_MERCHANT_RULES];

        for (const rule of rules) {
            if (rule.pattern.test(text)) {
                return {
                    category: rule.category,
                    priority: rule.priority,
                    tags: rule.tags,
                    confidence: 0.95, // High confidence for explicit merchant pattern
                    providerId: this.providerId,
                    reasoning: `Matched merchant pattern for ${rule.merchantName}`,
                    ruleId: `merchant_${rule.merchantName.toLowerCase().replace(/\s+/g, "_")}`,
                };
            }
        }

        return null;
    }
}

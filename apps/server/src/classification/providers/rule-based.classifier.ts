import { Category, Priority } from "../../generated/prisma/enums";
import {
    ClassificationCandidate,
    ClassificationSuggestion,
    TransactionClassificationProvider,
} from "../contracts/classification.contract";

export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
    FOOD: [
        "food", "lunch", "dinner", "breakfast", "brunch", "snack", "snacks",
        "coffee", "tea", "cafe", "restaurant", "pizza", "burger", "groceries",
        "grocery", "swiggy", "zomato", "starbucks", "mcdonalds", "subway",
        "eat", "meal", "drinks", "beer", "wine", "bar", "bakery", "chai",
        "supermarket", "blinkit", "zepto", "instamart", "bigbasket"
    ],
    FUEL: [
        "fuel", "petrol", "diesel", "cng", "gas station", "shell", "hpcl",
        "bpcl", "ioc", "gasoline"
    ],
    SHOPPING: [
        "shopping", "clothes", "cloth", "shirt", "pants", "shoes", "amazon",
        "flipkart", "myntra", "zara", "h&m", "electronics", "gadget", "phone",
        "laptop", "mall", "purchase", "dress", "watch", "retail"
    ],
    BILLS: [
        "bill", "bills", "electricity", "water", "power", "wifi", "internet",
        "broadband", "rent", "maintenance", "gas", "mobile recharge", "recharge",
        "utility", "utilities", "dth", "airtel", "jio", "vodafone"
    ],
    ENTERTAINMENT: [
        "movie", "movies", "cinema", "theatre", "pvr", "inox", "gaming",
        "games", "game", "concert", "party", "club", "outing", "pub", "event",
        "show", "playstation", "steam"
    ],
    HEALTH: [
        "health", "doctor", "hospital", "medicine", "medicines", "pharmacy",
        "medical", "dentist", "clinic", "gym", "fitness", "therapy", "checkup",
        "pills", "pharma", "apollo", "cultfit"
    ],
    TRAVEL: [
        "travel", "uber", "ola", "auto", "cab", "taxi", "train", "flight",
        "metro", "bus", "ticket", "tickets", "hotel", "trip", "toll",
        "parking", "rapido", "commute", "airfare", "makemytrip", "indigo"
    ],
    EDUCATION: [
        "education", "school", "college", "course", "udemy", "coursera",
        "tuition", "fees", "fee", "book", "books", "exam", "stationery",
        "class", "classes"
    ],
    SUBSCRIPTION: [
        "subscription", "netflix", "spotify", "prime", "amazon prime",
        "youtube", "disney", "hotstar", "apple", "icloud", "chatgpt",
        "gemini", "software", "saas", "membership"
    ],
    GIFT: [
        "gift", "present", "donation", "charity", "birthday", "anniversary",
        "gifted"
    ],
    OTHER: [
        "misc", "miscellaneous", "cash", "atm", "other", "general"
    ],
};

export const PRIORITY_KEYWORDS: Record<Priority, string[]> = {
    LUXURY: [
        "luxury", "fine dining", "expensive", "resort", "vacation",
        "designer", "vip", "first class", "5 star", "five star"
    ],
    GOOD_TO_HAVE: [
        "good to have", "movie", "gaming", "games", "gadget", "cafe",
        "gift", "subscription", "snack", "party", "club", "dessert",
        "cocktail", "hobby"
    ],
    ESSENTIAL: [
        "essential", "rent", "bills", "electricity", "water", "groceries",
        "grocery", "food", "lunch", "dinner", "breakfast", "fuel", "petrol",
        "medicine", "doctor", "health", "hospital", "education", "fee",
        "metro", "bus", "train", "work commute"
    ],
    UNCLASSIFIED: [
        "unclassified", "unassigned", "uncategorized", "unknown", "none"
    ],
};

const TAG_INFERENCE_RULES: Array<{ tag: string; keywords: string[] }> = [
    { tag: "subscription", keywords: ["subscription", "netflix", "spotify", "prime", "hotstar", "membership", "saas"] },
    { tag: "recurring", keywords: ["bill", "electricity", "rent", "broadband", "wifi", "subscription", "maintenance"] },
    { tag: "travel_trip", keywords: ["flight", "hotel", "resort", "vacation", "trip", "airfare"] },
    { tag: "work_expense", keywords: ["client", "conference", "work", "office", "stationery"] },
];

export class RuleBasedClassifier implements TransactionClassificationProvider {
    public readonly providerId = "rule_based_keyword_classifier";
    public readonly providerType = "deterministic_rule";
    public readonly priorityOrder = 20; // Runs after merchant map (order 10)

    public async classify(candidate: ClassificationCandidate): Promise<ClassificationSuggestion | null> {
        const textParts = [
            candidate.title || "",
            candidate.notes || "",
            candidate.rawNarration || "",
        ];
        const combinedText = textParts.join(" ").toLowerCase();

        if (!combinedText.trim()) {
            return null;
        }

        // 1. Detect Category
        let detectedCategory: Category | undefined;
        let categoryConfidence = 0;
        let matchedCategoryWord = "";

        for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
            if (cat === Category.OTHER) continue;
            for (const kw of keywords) {
                const regex = new RegExp(`\\b${kw}\\b`, "i");
                if (regex.test(combinedText)) {
                    detectedCategory = cat;
                    categoryConfidence = 0.85;
                    matchedCategoryWord = kw;
                    break;
                }
            }
            if (detectedCategory) break;
        }

        // 2. Detect Priority / Spending Tier
        let detectedPriority: Priority | undefined;
        let priorityConfidence = 0;
        let matchedPriorityWord = "";

        for (const [pri, keywords] of Object.entries(PRIORITY_KEYWORDS) as [Priority, string[]][]) {
            if (pri === Priority.UNCLASSIFIED) continue;
            for (const kw of keywords) {
                const regex = new RegExp(`\\b${kw}\\b`, "i");
                if (regex.test(combinedText)) {
                    detectedPriority = pri;
                    priorityConfidence = 0.8;
                    matchedPriorityWord = kw;
                    break;
                }
            }
            if (detectedPriority) break;
        }

        // 3. Fallback Spending Tier heuristic derived from Category if explicit tier was not mentioned
        if (!detectedPriority && detectedCategory) {
            if (
                detectedCategory === Category.FOOD ||
                detectedCategory === Category.BILLS ||
                detectedCategory === Category.HEALTH ||
                detectedCategory === Category.FUEL
            ) {
                detectedPriority = Priority.ESSENTIAL;
                priorityConfidence = 0.7;
            } else if (
                detectedCategory === Category.ENTERTAINMENT ||
                detectedCategory === Category.SHOPPING ||
                detectedCategory === Category.SUBSCRIPTION ||
                detectedCategory === Category.GIFT
            ) {
                detectedPriority = Priority.GOOD_TO_HAVE;
                priorityConfidence = 0.65;
            }
        }

        // 4. Infer Tags
        const inferredTags: string[] = [];
        for (const rule of TAG_INFERENCE_RULES) {
            for (const kw of rule.keywords) {
                const regex = new RegExp(`\\b${kw}\\b`, "i");
                if (regex.test(combinedText)) {
                    inferredTags.push(rule.tag);
                    break;
                }
            }
        }

        if (!detectedCategory && !detectedPriority && inferredTags.length === 0) {
            return null;
        }

        const overallConfidence = Math.max(categoryConfidence, priorityConfidence, 0.5);

        return {
            category: detectedCategory,
            priority: detectedPriority,
            tags: inferredTags.length > 0 ? inferredTags : undefined,
            confidence: overallConfidence,
            providerId: this.providerId,
            reasoning: `Keyword match: ${[matchedCategoryWord, matchedPriorityWord].filter(Boolean).join(", ")}`,
            ruleId: `kw_${matchedCategoryWord || matchedPriorityWord || "inferred"}`,
        };
    }
}

import type { TransactionCategory, TransactionPriority, ParsedTransactionResponse } from "../types/dashboard.types";

const CATEGORY_KEYWORDS: Record<TransactionCategory, string[]> = {
    FOOD: [
        "food", "lunch", "dinner", "breakfast", "brunch", "snack", "snacks",
        "coffee", "tea", "cafe", "restaurant", "pizza", "burger", "groceries",
        "grocery", "swiggy", "zomato", "starbucks", "mcdonalds", "subway",
        "eat", "meal", "drinks", "beer", "wine", "bar", "bakery", "chai"
    ],
    FUEL: [
        "fuel", "petrol", "diesel", "cng", "gas station", "shell", "hpcl",
        "bpcl", "ioc", "gasoline"
    ],
    SHOPPING: [
        "shopping", "clothes", "cloth", "shirt", "pants", "shoes", "amazon",
        "flipkart", "myntra", "zara", "h&m", "electronics", "gadget", "phone",
        "laptop", "mall", "purchase", "dress", "watch"
    ],
    BILLS: [
        "bill", "bills", "electricity", "water", "power", "wifi", "internet",
        "broadband", "rent", "maintenance", "gas", "mobile recharge", "recharge",
        "utility", "utilities", "dth"
    ],
    ENTERTAINMENT: [
        "movie", "movies", "cinema", "theatre", "pvr", "inox", "gaming",
        "games", "game", "concert", "party", "club", "outing", "pub", "event",
        "show"
    ],
    HEALTH: [
        "health", "doctor", "hospital", "medicine", "medicines", "pharmacy",
        "medical", "dentist", "clinic", "gym", "fitness", "therapy", "checkup",
        "pills", "pharma"
    ],
    TRAVEL: [
        "travel", "uber", "ola", "auto", "cab", "taxi", "train", "flight",
        "metro", "bus", "ticket", "tickets", "hotel", "trip", "toll",
        "parking", "rapido", "commute", "airfare"
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
        "salary", "investment", "freelance", "misc", "cash", "atm", "other",
        "expense", "spent"
    ]
};

const PRIORITY_KEYWORDS: Record<TransactionPriority, string[]> = {
    LUXURY: [
        "luxury", "fine dining", "expensive", "resort", "vacation",
        "designer", "vip", "first class"
    ],
    GOOD_TO_HAVE: [
        "good to have", "movie", "gaming", "games", "gadget", "cafe",
        "gift", "subscription", "snack", "party", "club", "dessert"
    ],
    ESSENTIAL: [
        "essential", "rent", "bills", "electricity", "water", "groceries",
        "grocery", "food", "lunch", "dinner", "breakfast", "fuel", "petrol",
        "medicine", "doctor", "health", "hospital", "education", "fee",
        "metro", "bus", "train", "work"
    ]
};

export function clientParseQuickTransaction(input: string): ParsedTransactionResponse {
    const rawText = (input || "").trim();
    if (!rawText) {
        return {
            amount: null,
            title: "Expense",
            category: "OTHER",
            priority: "ESSENTIAL",
            transactionDate: new Date().toISOString(),
            rawText: "",
            confidence: 0,
            extractedFields: {
                amountDetected: false,
                categoryDetected: false,
                priorityDetected: false,
                dateDetected: false
            }
        };
    }

    let cleanText = rawText;
    let extractedDate: Date = new Date();
    let dateDetected = false;

    if (/\byesterday\b/i.test(cleanText)) {
        extractedDate = new Date();
        extractedDate.setDate(extractedDate.getDate() - 1);
        cleanText = cleanText.replace(/\byesterday\b/gi, " ");
        dateDetected = true;
    } else if (/\btoday\b/i.test(cleanText)) {
        extractedDate = new Date();
        cleanText = cleanText.replace(/\btoday\b/gi, " ");
        dateDetected = true;
    }

    let detectedAmount: number | null = null;
    let amountDetected = false;

    const amountRegex = /(?:₹|rs\.?|inr|\$)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)\s*(?:₹|rs\.?|inr|\$|bucks|rupees)?/i;
    const amountMatch = cleanText.match(amountRegex);

    if (amountMatch && amountMatch[1]) {
        const parsedNum = parseFloat(amountMatch[1].replace(/,/g, ""));
        if (!isNaN(parsedNum) && parsedNum > 0) {
            detectedAmount = parsedNum;
            amountDetected = true;
            cleanText = cleanText.replace(amountMatch[0], " ");
        }
    }

    const fillerWords = /\b(spent|on|for|paid|at|bought|got|to|the|a|an|in|of|my|rs|inr|rupees|bucks)\b/gi;
    const titleText = cleanText.replace(fillerWords, " ").replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();

    let detectedCategory: TransactionCategory = "OTHER";
    let categoryDetected = false;
    const lowerInput = rawText.toLowerCase();

    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [TransactionCategory, string[]][]) {
        if (cat === "OTHER") continue;
        for (const kw of keywords) {
            const regex = new RegExp(`\\b${kw}\\b`, "i");
            if (regex.test(lowerInput)) {
                detectedCategory = cat;
                categoryDetected = true;
                break;
            }
        }
        if (categoryDetected) break;
    }

    let detectedPriority: TransactionPriority = "ESSENTIAL";
    let priorityDetected = false;

    for (const [pri, keywords] of Object.entries(PRIORITY_KEYWORDS) as [TransactionPriority, string[]][]) {
        for (const kw of keywords) {
            const regex = new RegExp(`\\b${kw}\\b`, "i");
            if (regex.test(lowerInput)) {
                detectedPriority = pri;
                priorityDetected = true;
                break;
            }
        }
        if (priorityDetected) break;
    }

    if (!priorityDetected) {
        if (detectedCategory === "FOOD" || detectedCategory === "BILLS" || detectedCategory === "HEALTH" || detectedCategory === "FUEL") {
            detectedPriority = "ESSENTIAL";
        } else if (detectedCategory === "ENTERTAINMENT" || detectedCategory === "SHOPPING" || detectedCategory === "SUBSCRIPTION" || detectedCategory === "GIFT") {
            detectedPriority = "GOOD_TO_HAVE";
        }
    }

    let finalTitle = titleText;
    if (!finalTitle) {
        if (categoryDetected) {
            finalTitle = detectedCategory.charAt(0) + detectedCategory.slice(1).toLowerCase();
        } else {
            finalTitle = "Expense";
        }
    } else {
        finalTitle = finalTitle
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
    }

    if (finalTitle.length > 50) {
        finalTitle = finalTitle.slice(0, 50).trim();
    }

    let confidence = 0.2;
    if (amountDetected) confidence += 0.4;
    if (categoryDetected) confidence += 0.25;
    if (titleText.length > 1) confidence += 0.15;

    return {
        amount: detectedAmount,
        title: finalTitle,
        category: detectedCategory,
        priority: detectedPriority,
        transactionDate: extractedDate.toISOString(),
        rawText,
        confidence: Math.min(1.0, confidence),
        extractedFields: {
            amountDetected,
            categoryDetected,
            priorityDetected,
            dateDetected
        }
    };
}

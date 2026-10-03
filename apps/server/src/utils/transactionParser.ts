import { Category, Priority } from "../generated/prisma/enums";

export interface ParsedTransactionResult {
    amount: number | null;
    title: string;
    category: Category;
    priority: Priority;
    transactionDate: string;
    notes?: string;
    rawText: string;
    confidence: number;
    extractedFields: {
        amountDetected: boolean;
        categoryDetected: boolean;
        priorityDetected: boolean;
        dateDetected: boolean;
    };
}

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
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

const PRIORITY_KEYWORDS: Record<Priority, string[]> = {
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

export function parseQuickTransaction(input: string): ParsedTransactionResult {
    const rawText = (input || "").trim();
    if (!rawText) {
        return {
            amount: null,
            title: "Expense",
            category: Category.OTHER,
            priority: Priority.ESSENTIAL,
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

    // Detect relative dates
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

    // Detect Amount
    // Matches patterns like: ₹450, 450, 450.50, rs 450, 450rs, $450, spent 450
    let detectedAmount: number | null = null;
    let amountDetected = false;

    const amountRegex = /(?:₹|rs\.?|inr|\$)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)\s*(?:₹|rs\.?|inr|\$|bucks|rupees)?/i;
    const amountMatch = cleanText.match(amountRegex);

    if (amountMatch && amountMatch[1]) {
        const parsedNum = parseFloat(amountMatch[1].replace(/,/g, ""));
        if (!isNaN(parsedNum) && parsedNum > 0) {
            detectedAmount = parsedNum;
            amountDetected = true;
            // Remove the matched amount chunk from text for title extraction
            cleanText = cleanText.replace(amountMatch[0], " ");
        }
    }

    // Clean extraneous filler words for title/category inference
    const fillerWords = /\b(spent|on|for|paid|at|bought|got|to|the|a|an|in|of|my|rs|inr|rupees|bucks)\b/gi;
    let titleText = cleanText.replace(fillerWords, " ").replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();

    // Category detection
    let detectedCategory: Category = Category.OTHER;
    let categoryDetected = false;
    const lowerInput = rawText.toLowerCase();

    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
        if (cat === Category.OTHER) continue;
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

    // Priority detection
    let detectedPriority: Priority = Priority.ESSENTIAL;
    let priorityDetected = false;

    for (const [pri, keywords] of Object.entries(PRIORITY_KEYWORDS) as [Priority, string[]][]) {
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

    // Default priority based on category if not explicitly mentioned
    if (!priorityDetected) {
        if (detectedCategory === Category.FOOD || detectedCategory === Category.BILLS || detectedCategory === Category.HEALTH || detectedCategory === Category.FUEL) {
            detectedPriority = Priority.ESSENTIAL;
        } else if (detectedCategory === Category.ENTERTAINMENT || detectedCategory === Category.SHOPPING || detectedCategory === Category.SUBSCRIPTION || detectedCategory === Category.GIFT) {
            detectedPriority = Priority.GOOD_TO_HAVE;
        }
    }

    // Title construction
    let finalTitle = titleText;
    if (!finalTitle) {
        // Fallback title to category name formatted nicely or "Expense"
        if (categoryDetected) {
            finalTitle = detectedCategory.charAt(0) + detectedCategory.slice(1).toLowerCase();
        } else {
            finalTitle = "Expense";
        }
    } else {
        // Capitalize words
        finalTitle = finalTitle
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
    }

    if (finalTitle.length > 50) {
        finalTitle = finalTitle.slice(0, 50).trim();
    }

    // Confidence calculation
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

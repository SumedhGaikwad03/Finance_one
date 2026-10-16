import { Category } from "../generated/prisma/enums";
import { RecurringType } from "./recurring.types";

export interface KnownMerchantDefinition {
    pattern: RegExp;
    canonicalName: string;
    key: string;
    defaultType: RecurringType;
    defaultCategory: Category;
    isSubscription: boolean;
}

export const KNOWN_RECURRING_MERCHANTS: KnownMerchantDefinition[] = [
    // Digital Subscriptions
    { pattern: /\b(netflix|nflx)\b/i, canonicalName: "Netflix", key: "netflix", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(spotify)\b/i, canonicalName: "Spotify", key: "spotify", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(prime\s*video|amazon\s*prime|amzn\s*prime)\b/i, canonicalName: "Amazon Prime", key: "amazon_prime", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(hotstar|disney\+?)\b/i, canonicalName: "Disney+ Hotstar", key: "hotstar", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(youtube\s*(?:premium|sub|music)?)\b/i, canonicalName: "YouTube Premium", key: "youtube", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(apple\s*(?:music|tv|one|icloud|\.com\/bill)?)\b/i, canonicalName: "Apple Services", key: "apple_services", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(google\s*(?:one|storage|play|cloud)?)\b/i, canonicalName: "Google One", key: "google_one", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(chatgpt|openai)\b/i, canonicalName: "OpenAI ChatGPT", key: "openai_chatgpt", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(github)\b/i, canonicalName: "GitHub", key: "github", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(notion)\b/i, canonicalName: "Notion", key: "notion", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(duolingo)\b/i, canonicalName: "Duolingo", key: "duolingo", defaultType: "SUBSCRIPTION", defaultCategory: Category.EDUCATION, isSubscription: true },
    { pattern: /\b(coursera)\b/i, canonicalName: "Coursera", key: "coursera", defaultType: "SUBSCRIPTION", defaultCategory: Category.EDUCATION, isSubscription: true },
    { pattern: /\b(audible)\b/i, canonicalName: "Audible", key: "audible", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(sonyliv)\b/i, canonicalName: "SonyLIV", key: "sonyliv", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(zee5)\b/i, canonicalName: "ZEE5", key: "zee5", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(linkedin\s*(?:premium|learning)?)\b/i, canonicalName: "LinkedIn Premium", key: "linkedin", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(adobe|creative\s*cloud)\b/i, canonicalName: "Adobe", key: "adobe", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },
    { pattern: /\b(canva)\b/i, canonicalName: "Canva", key: "canva", defaultType: "SUBSCRIPTION", defaultCategory: Category.SUBSCRIPTION, isSubscription: true },

    // Telecom & Broadband Bills
    { pattern: /\b(airtel|bharti\s*airtel)\b/i, canonicalName: "Airtel", key: "airtel", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },
    { pattern: /\b(jio|reliance\s*jio)\b/i, canonicalName: "Reliance Jio", key: "jio", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },
    { pattern: /\b(vodafone|vi\s*bill|idea)\b/i, canonicalName: "Vi (Vodafone Idea)", key: "vi", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },
    { pattern: /\b(act\s*corp|act\s*fibernet|act\s*broadband)\b/i, canonicalName: "ACT Fibernet", key: "act_fibernet", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },
    { pattern: /\b(hathway)\b/i, canonicalName: "Hathway Broadband", key: "hathway", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },
    { pattern: /\b(tata\s*play|tata\s*sky)\b/i, canonicalName: "Tata Play", key: "tata_play", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },

    // Electricity, Utilities & Gas
    { pattern: /\b(tatapower|tata\s*power)\b/i, canonicalName: "Tata Power", key: "tata_power", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },
    { pattern: /\b(bescom)\b/i, canonicalName: "BESCOM Electricity", key: "bescom", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },
    { pattern: /\b(adani\s*electricity)\b/i, canonicalName: "Adani Electricity", key: "adani_electricity", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },
    { pattern: /\b(mahavitaran|msedcl)\b/i, canonicalName: "MSEDCL Mahavitaran", key: "msedcl", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },
    { pattern: /\b(cesc)\b/i, canonicalName: "CESC Electricity", key: "cesc", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },
    { pattern: /\b(mahanagar\s*gas|mgl|igl|indraprastha\s*gas)\b/i, canonicalName: "Piped Natural Gas", key: "piped_gas", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },

    // Rent, EMI & Financial Recurring Obligations
    { pattern: /\b(rent|house\s*rent|pg\s*rent|flat\s*maintenance)\b/i, canonicalName: "House Rent / Maintenance", key: "rent_maintenance", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },
    { pattern: /\b(emi|loan\s*emi|chq\s*s\d+|bajaj\s*finserv|hdb\s*financial|home\s*loan)\b/i, canonicalName: "Loan EMI", key: "loan_emi", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },
    { pattern: /\b(lic|life\s*insurance|hdfc\s*life|sbi\s*life|max\s*life|icici\s*pru)\b/i, canonicalName: "Insurance Premium", key: "insurance_premium", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },
    { pattern: /\b(sbi\s*cards|hdfc\s*credit\s*card|icici\s*credit\s*card|amex|american\s*express|cred\s*club|cred\b)/i, canonicalName: "Credit Card Bill", key: "credit_card_bill", defaultType: "BILL_PAYMENT", defaultCategory: Category.BILLS, isSubscription: false },

    // Fitness, Memberships & Daily Recurring Services
    { pattern: /\b(cult\.?fit|curefit)\b/i, canonicalName: "Cult.fit", key: "cultfit", defaultType: "GENERAL_RECURRING", defaultCategory: Category.HEALTH, isSubscription: true },
    { pattern: /\b(gold['’]?s\s*gym|anytime\s*fitness|gym\s*membership)\b/i, canonicalName: "Gym Membership", key: "gym_membership", defaultType: "GENERAL_RECURRING", defaultCategory: Category.HEALTH, isSubscription: false },
    { pattern: /\b(country\s*delight|milkbasket|bbdaily|daily\s*milk)\b/i, canonicalName: "Milk & Grocery Daily Subscription", key: "daily_milk_groceries", defaultType: "GENERAL_RECURRING", defaultCategory: Category.FOOD, isSubscription: false },
];

export interface NormalizedMerchantResult {
    canonicalName: string;
    normalizedKey: string;
    isKnownMerchant: boolean;
    knownDefinition?: KnownMerchantDefinition;
    cleanedNarration: string;
}

/**
 * Deterministically strips noisy banking prefixes, reference codes, dates, and locations.
 */
export function cleanNarration(raw: string): string {
    if (!raw) return "";

    let text = raw.trim();

    // 1. Strip common banking routing prefixes
    text = text.replace(/^(?:upi[-/]|neft[-/]|imps[-/]|rtgs[-/]|pos\s+|ib\s+billpay\s+|ach[-/]|debit[-/]|billdesk\s+|razorpay\*|paytm\*|cc\s+bill\s+)/i, "");

    // 2. Remove typical banking UPI handles: e.g. "cultfit@hdfc", "user@okhdfcbank"
    text = text.replace(/@\w+/g, " ");

    // 3. Remove dates embedded in narration (e.g. "15-OCT-2026", "04/06/2026", "JUN 2026")
    text = text.replace(/\b\d{1,2}[-\/\s](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2})[-\/\s]\d{2,4}\b/gi, " ");
    text = text.replace(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}\b/gi, " ");

    // 4. Split delimiters into spaces so reference codes and words are cleanly tokenized
    text = text.replace(/[-_/]/g, " ");

    // 5. Remove alphanumeric reference codes that contain both letters and digits (e.g. "S4923306", "NHDF6376325463")
    text = text.replace(/\b(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{5,}\b/g, " ");

    // 6. Remove numeric codes (e.g. invoice/cheque numbers, telephone numbers)
    text = text.replace(/\b\d{4,}\b/g, " ");

    // 7. Remove city/location tags commonly suffixed in POS transactions
    text = text.replace(/\b(?:mumbai|bangalore|bengaluru|delhi|new\s*delhi|hyderabad|pune|chennai|kolkata|in|ind)\b/gi, " ");

    // 8. Normalize punctuation and whitespace
    text = text.replace(/[^a-zA-Z0-9\s.+&/]/g, " ");
    text = text.replace(/\s+/g, " ").trim();

    return text;
}

/**
 * Normalizes a transaction title or raw narration into a stable canonical merchant and clustering key.
 */
export function normalizeMerchant(title: string | null | undefined, notes?: string | null): NormalizedMerchantResult {
    const raw = `${title || ""} ${notes || ""}`.trim();
    const cleaned = cleanNarration(raw || (title || "Unknown Payee"));

    // Check against known recurring merchants first
    for (const def of KNOWN_RECURRING_MERCHANTS) {
        if (def.pattern.test(raw) || def.pattern.test(cleaned)) {
            return {
                canonicalName: def.canonicalName,
                normalizedKey: `known_${def.key}`,
                isKnownMerchant: true,
                knownDefinition: def,
                cleanedNarration: cleaned || def.canonicalName,
            };
        }
    }

    // For arbitrary merchants: create a stable slug from significant words
    const significantTokens = cleaned
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 2 && !/^(the|and|for|via|pvt|ltd|inc|llc|com|pay|bill)$/.test(t));

    const keyToken = significantTokens.slice(0, 3).join("_") || "misc_payee";

    // Format a nice canonical display name
    const displayWords = (cleaned || title || "Unknown Payee")
        .split(/\s+/)
        .slice(0, 4)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

    return {
        canonicalName: displayWords || "Unknown Payee",
        normalizedKey: `gen_${keyToken}`,
        isKnownMerchant: false,
        cleanedNarration: cleaned,
    };
}

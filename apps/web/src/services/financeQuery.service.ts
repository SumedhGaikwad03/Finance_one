import type {
    FinanceQuery,
    QuerySuggestion,
    QueryExecutionResult,
    TimePeriodOption,
    AggregatedDataPoint,
    CategoryBreakdownItem,
} from "../types/financeQuery.types";
import type {
    Transaction,
    TransactionCategory,
    TransactionQueryParams,
} from "../types/dashboard.types";
import * as transactionService from "./transaction.service";
import { CATEGORY_METADATA } from "../components/query/CategorySelector";

export const DEFAULT_SUGGESTIONS: QuerySuggestion[] = [
    {
        id: "spending_this_month",
        title: "Show my spending this month",
        description: "Explore category breakdown for the current month",
        icon: "📊",
        initialQuery: {
            timePeriod: "THIS_MONTH",
            aggregation: "CATEGORY_BREAKDOWN",
            visualization: "CHART",
        },
        autoConfirm: true,
    },
    {
        id: "compare_recent_months",
        title: "Compare this month with last month",
        description: "Monthly comparison over the last 3 months",
        icon: "📈",
        initialQuery: {
            timePeriod: "LAST_3_MONTHS",
            aggregation: "MONTHLY",
            visualization: "CHART",
        },
        autoConfirm: true,
    },
    {
        id: "top_expenses",
        title: "What are my top expenses?",
        description: "Highest transactions recorded recently",
        icon: "🏷️",
        initialQuery: {
            timePeriod: "THIS_MONTH",
            aggregation: "TRANSACTION_LIST",
            visualization: "TABLE",
            limit: 10,
        },
        autoConfirm: true,
    },
    {
        id: "transport_expenses",
        title: "Show my transport expenses",
        description: "Fuel, Uber, and travel over last 3 months",
        icon: "✈️",
        initialQuery: {
            category: "TRAVEL",
            timePeriod: "LAST_3_MONTHS",
            aggregation: "MONTHLY",
            visualization: "CHART",
        },
        autoConfirm: true,
    },
    {
        id: "food_expenses",
        title: "Food & Dining breakdown",
        description: "Daily spending on food and restaurants",
        icon: "🍔",
        initialQuery: {
            category: "FOOD",
            timePeriod: "THIS_MONTH",
            aggregation: "DAILY",
            visualization: "CHART",
        },
        autoConfirm: true,
    },
    {
        id: "custom_query",
        title: "Build a custom query",
        description: "Step-by-step assistant to explore any dimension",
        icon: "🧭",
        initialQuery: {
            timePeriod: "THIS_MONTH",
            aggregation: "MONTHLY",
            visualization: "CHART",
        },
        autoConfirm: false,
    },
];

/**
 * Calculates start and end ISO dates based on a named TimePeriodOption.
 */
export function calculateDateRange(period: TimePeriodOption): { startDate?: string; endDate?: string } {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    switch (period) {
        case "THIS_MONTH": {
            const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            return { startDate: start.toISOString(), endDate };
        }
        case "LAST_MONTH": {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            return { startDate: start.toISOString(), endDate: end.toISOString() };
        }
        case "LAST_3_MONTHS": {
            const start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
            return { startDate: start.toISOString(), endDate };
        }
        case "LAST_6_MONTHS": {
            const start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
            return { startDate: start.toISOString(), endDate };
        }
        case "THIS_YEAR": {
            const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            return { startDate: start.toISOString(), endDate };
        }
        case "LAST_7_DAYS": {
            const start = new Date();
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            return { startDate: start.toISOString(), endDate };
        }
        case "LAST_30_DAYS": {
            const start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            return { startDate: start.toISOString(), endDate };
        }
        case "ALL_TIME":
        default:
            return {};
    }
}

/**
 * Deterministic Natural Language Interpreter.
 * Translates user text queries into structured FinanceQuery parameters.
 * Modularly architected so a future LLM API can drop in seamlessly.
 */
export function parseNaturalLanguageIntent(prompt: string): Partial<FinanceQuery> {
    const text = prompt.toLowerCase().trim();
    const result: Partial<FinanceQuery> = {
        rawPrompt: prompt,
    };

    // 1. Detect Category
    if (text.includes("transport") || text.includes("travel") || text.includes("uber") || text.includes("flight") || text.includes("cab")) {
        result.category = "TRAVEL";
    } else if (text.includes("food") || text.includes("dinner") || text.includes("grocery") || text.includes("groceries") || text.includes("restaurant") || text.includes("lunch") || text.includes("swiggy") || text.includes("zomato")) {
        result.category = "FOOD";
    } else if (text.includes("shop") || text.includes("amazon") || text.includes("cloth") || text.includes("retail") || text.includes("buy")) {
        result.category = "SHOPPING";
    } else if (text.includes("bill") || text.includes("utilit") || text.includes("electric") || text.includes("rent") || text.includes("recharge")) {
        result.category = "BILLS";
    } else if (text.includes("entertain") || text.includes("movie") || text.includes("game") || text.includes("cinema")) {
        result.category = "ENTERTAINMENT";
    } else if (text.includes("health") || text.includes("doctor") || text.includes("med") || text.includes("pharmacy") || text.includes("gym")) {
        result.category = "HEALTH";
    } else if (text.includes("fuel") || text.includes("petrol") || text.includes("gas") || text.includes("diesel")) {
        result.category = "FUEL";
    } else if (text.includes("subscript") || text.includes("netflix") || text.includes("spotify") || text.includes("saas")) {
        result.category = "SUBSCRIPTION";
    } else if (text.includes("edu") || text.includes("course") || text.includes("book") || text.includes("tuition")) {
        result.category = "EDUCATION";
    } else if (text.includes("gift") || text.includes("donat")) {
        result.category = "GIFT";
    }

    // 2. Detect Priority
    if (text.includes("essential") || text.includes("need")) {
        result.priority = "ESSENTIAL";
    } else if (text.includes("luxury") || text.includes("splurge") || text.includes("discretionary")) {
        result.priority = "LUXURY";
    } else if (text.includes("good to have") || text.includes("comfort")) {
        result.priority = "GOOD_TO_HAVE";
    }

    // 3. Detect Time Period
    if (text.includes("last 3 months") || text.includes("3 months") || text.includes("past 3 months")) {
        result.timePeriod = "LAST_3_MONTHS";
    } else if (text.includes("last 6 months") || text.includes("6 months") || text.includes("half year")) {
        result.timePeriod = "LAST_6_MONTHS";
    } else if (text.includes("last month") || text.includes("previous month")) {
        result.timePeriod = "LAST_MONTH";
    } else if (text.includes("this year") || text.includes("year to date") || text.includes("ytd")) {
        result.timePeriod = "THIS_YEAR";
    } else if (text.includes("last 7 days") || text.includes("past week") || text.includes("this week")) {
        result.timePeriod = "LAST_7_DAYS";
    } else if (text.includes("last 30 days") || text.includes("past month")) {
        result.timePeriod = "LAST_30_DAYS";
    } else if (text.includes("this month") || text.includes("current month")) {
        result.timePeriod = "THIS_MONTH";
    } else if (text.includes("all time") || text.includes("ever") || text.includes("total history")) {
        result.timePeriod = "ALL_TIME";
    }

    // 4. Detect Aggregation View
    if (text.includes("daily") || text.includes("day by day") || text.includes("per day")) {
        result.aggregation = "DAILY";
        result.visualization = "CHART";
    } else if (text.includes("weekly") || text.includes("per week")) {
        result.aggregation = "WEEKLY";
        result.visualization = "CHART";
    } else if (text.includes("monthly") || text.includes("per month") || text.includes("month by month") || text.includes("compare")) {
        result.aggregation = "MONTHLY";
        result.visualization = "CHART";
    } else if (text.includes("breakdown") || text.includes("category") || text.includes("categories") || text.includes("distribution")) {
        result.aggregation = "CATEGORY_BREAKDOWN";
        result.visualization = "CHART";
    } else if (text.includes("top") || text.includes("highest") || text.includes("list") || text.includes("transactions") || text.includes("table")) {
        result.aggregation = "TRANSACTION_LIST";
        result.visualization = "TABLE";
    }

    // 5. Detect Amount Thresholds
    const overAmountMatch = text.match(/(?:over|above|greater than|>)\s*(?:rs|₹|inr)?\s*(\d+)/i);
    if (overAmountMatch) {
        result.minAmount = Number(overAmountMatch[1]);
    }

    const underAmountMatch = text.match(/(?:under|below|less than|<)\s*(?:rs|₹|inr)?\s*(\d+)/i);
    if (underAmountMatch) {
        result.maxAmount = Number(underAmountMatch[1]);
    }

    return result;
}

/**
 * Executes a structured FinanceQuery against real transactions and computes statistical summaries.
 */
export async function executeFinanceQuery(query: FinanceQuery): Promise<QueryExecutionResult> {
    const { startDate, endDate } = calculateDateRange(query.timePeriod);

    // Build backend query parameters
    const params: TransactionQueryParams = {
        startDate,
        endDate,
        minAmount: query.minAmount,
        maxAmount: query.maxAmount,
        search: query.search,
        limit: query.limit || 100,
        sortBy: query.aggregation === "TRANSACTION_LIST" ? "amount" : "transactionDate",
        sortDirection: "desc",
    };

    if (query.category) {
        params.category = query.category;
    }
    if (query.priority) {
        params.priority = query.priority;
    }

    // Fetch real transactions from API
    const transactions: Transaction[] = await transactionService.queryTransactions(params);

    // Compute metrics
    const totalSpent = transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const transactionCount = transactions.length;
    const averageAmount = transactionCount > 0 ? Math.round(totalSpent / transactionCount) : 0;

    let highestAmount = 0;
    let lowestAmount = Infinity;
    for (const tx of transactions) {
        const amt = Number(tx.amount) || 0;
        if (amt > highestAmount) highestAmount = amt;
        if (amt < lowestAmount) lowestAmount = amt;
    }
    if (lowestAmount === Infinity) lowestAmount = 0;

    // Build Time-Series or Categorical Aggregation
    const chartData: AggregatedDataPoint[] = [];
    const bucketMap: Record<string, { label: string; amount: number; count: number }> = {};

    if (query.aggregation === "MONTHLY") {
        for (const tx of transactions) {
            const date = new Date(tx.transactionDate);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
            if (!bucketMap[key]) {
                bucketMap[key] = { label, amount: 0, count: 0 };
            }
            bucketMap[key].amount += Number(tx.amount) || 0;
            bucketMap[key].count += 1;
        }
    } else if (query.aggregation === "DAILY") {
        for (const tx of transactions) {
            const date = new Date(tx.transactionDate);
            const key = date.toISOString().slice(0, 10);
            const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            if (!bucketMap[key]) {
                bucketMap[key] = { label, amount: 0, count: 0 };
            }
            bucketMap[key].amount += Number(tx.amount) || 0;
            bucketMap[key].count += 1;
        }
    } else if (query.aggregation === "WEEKLY") {
        for (const tx of transactions) {
            const date = new Date(tx.transactionDate);
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            const key = startOfWeek.toISOString().slice(0, 10);
            const label = `Wk ${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
            if (!bucketMap[key]) {
                bucketMap[key] = { label, amount: 0, count: 0 };
            }
            bucketMap[key].amount += Number(tx.amount) || 0;
            bucketMap[key].count += 1;
        }
    }

    // Sort buckets chronologically
    const sortedKeys = Object.keys(bucketMap).sort();
    let highestPeriod: { label: string; amount: number } | undefined;
    let lowestPeriod: { label: string; amount: number } | undefined;

    for (const key of sortedKeys) {
        const item = bucketMap[key];
        chartData.push({
            dateKey: key,
            label: item.label,
            amount: item.amount,
            count: item.count,
        });

        if (!highestPeriod || item.amount > highestPeriod.amount) {
            highestPeriod = { label: item.label, amount: item.amount };
        }
        if (!lowestPeriod || item.amount < lowestPeriod.amount) {
            lowestPeriod = { label: item.label, amount: item.amount };
        }
    }

    // Build Category Breakdown
    const catMap: Record<string, number> = {};
    for (const tx of transactions) {
        catMap[tx.category] = (catMap[tx.category] || 0) + (Number(tx.amount) || 0);
    }
    const categoryBreakdown: CategoryBreakdownItem[] = Object.entries(catMap)
        .map(([cat, amount]) => {
            const meta = CATEGORY_METADATA[cat as TransactionCategory] || { label: cat, icon: "🏷️" };
            return {
                category: cat as TransactionCategory,
                label: meta.label,
                icon: meta.icon,
                amount,
                percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
            };
        })
        .sort((a, b) => b.amount - a.amount);

    // Formulate clean natural language summary
    const periodLabel = query.timePeriod.replace(/_/g, " ").toLowerCase();
    const categoryLabel = query.category ? CATEGORY_METADATA[query.category]?.label || query.category : "all categories";
    const summaryText = `Found ${transactionCount} transactions for ${categoryLabel} across ${periodLabel}, totaling ₹${totalSpent.toLocaleString()}.`;

    return {
        query,
        transactions,
        totalSpent,
        transactionCount,
        averageAmount,
        highestAmount,
        lowestAmount,
        highestPeriod,
        lowestPeriod,
        chartData,
        categoryBreakdown,
        summaryText,
    };
}

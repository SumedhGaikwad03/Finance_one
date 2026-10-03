import { useState, useRef, useEffect } from "react";
import type {
    FinanceQuery,
    QueryBuilderStep,
    TimePeriodOption,
} from "../../types/financeQuery.types";
import type { TransactionCategory } from "../../types/dashboard.types";
import { CATEGORY_METADATA } from "../query/CategorySelector";
import { ArrowLeft, Search, Check, Sparkles, X } from "lucide-react";

interface QueryStepProps {
    step: QueryBuilderStep;
    query: FinanceQuery;
    onUpdateQuery: (updates: Partial<FinanceQuery>) => void;
    onNext: (finalPatch?: Partial<FinanceQuery>) => void;
    onBack: () => void;
}

const TRANSITION_DELAY_MS = 120;

export const CATEGORY_ITEMS: {
    value: TransactionCategory | null;
    label: string;
    icon: string;
    desc: string;
}[] = [
    { value: null, label: "Everything", icon: "🌐", desc: "All expenses combined" },
    { value: "FOOD", label: "Food & Dining", icon: "🍔", desc: "Groceries, cafes, dine-out" },
    { value: "SHOPPING", label: "Shopping", icon: "🛍️", desc: "Retail, clothes, gadgets" },
    { value: "FUEL", label: "Fuel & Transport", icon: "⛽", desc: "Gas, petrol, public transit" },
    { value: "BILLS", label: "Bills & Utilities", icon: "💡", desc: "Electricity, water, rent" },
    { value: "ENTERTAINMENT", label: "Entertainment", icon: "🎬", desc: "Movies, games, outings" },
    { value: "HEALTH", label: "Health & Care", icon: "🩺", desc: "Medicine, doctor, gym" },
    { value: "TRAVEL", label: "Travel & Vacations", icon: "✈️", desc: "Flights, hotels, trips" },
    { value: "EDUCATION", label: "Education", icon: "📚", desc: "Courses, books, tuition" },
    { value: "SUBSCRIPTION", label: "Subscriptions", icon: "📱", desc: "Netflix, Spotify, SaaS" },
    { value: "GIFT", label: "Gifts & Donations", icon: "🎁", desc: "Presents, charities" },
    { value: "OTHER", label: "Other / Misc", icon: "📦", desc: "Miscellaneous expenses" },
];

export const TIMEFRAME_OPTIONS: {
    id: TimePeriodOption;
    label: string;
    desc: string;
    badge?: string;
}[] = [
    { id: "THIS_MONTH", label: "This month", desc: "Current calendar month", badge: "Popular" },
    { id: "LAST_MONTH", label: "Last month", desc: "Full previous calendar month" },
    { id: "LAST_3_MONTHS", label: "Last 3 months", desc: "Past 90 days quarterly view" },
    { id: "THIS_YEAR", label: "This year", desc: "Jan 1st to today (YTD)" },
];

export const QueryStep = ({
    step,
    query,
    onUpdateQuery,
    onNext,
    onBack,
}: QueryStepProps) => {
    const [categorySearch, setCategorySearch] = useState("");
    const [transitioningItem, setTransitioningItem] = useState<string | null>(null);
    const isTransitioningRef = useRef(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        isTransitioningRef.current = false;
        setTransitioningItem(null);
    }, [step]);

    const handleSelectAndAdvance = (patch: Partial<FinanceQuery>, itemId: string) => {
        if (isTransitioningRef.current) return;
        isTransitioningRef.current = true;
        setTransitioningItem(itemId);
        onUpdateQuery(patch);

        timeoutRef.current = setTimeout(() => {
            onNext(patch);
            isTransitioningRef.current = false;
            setTransitioningItem(null);
        }, TRANSITION_DELAY_MS);
    };

    const filteredCategories = CATEGORY_ITEMS.filter((item) => {
        if (!categorySearch.trim()) return true;
        const queryText = categorySearch.toLowerCase();
        return (
            item.label.toLowerCase().includes(queryText) ||
            item.desc.toLowerCase().includes(queryText)
        );
    });

    // ==========================================
    // STEP 1: CATEGORY SELECTION ("Where did you spend?")
    // ==========================================
    if (step === "SELECT_CATEGORY" || step === "INITIAL" || step === "SELECT_GOAL") {
        return (
            <div className="space-y-4 animate-in fade-in duration-150">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-extrabold uppercase tracking-wide">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        Where did I spend?
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        Where did you spend?
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                        Tap a category or choose everything to see where your money went.
                    </p>
                </div>

                {/* Quick Search Input */}
                <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Filter categories (e.g. Food, Shopping)..."
                        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all"
                    />
                    {categorySearch && (
                        <button
                            type="button"
                            onClick={() => setCategorySearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
                            aria-label="Clear search"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 max-h-[340px] sm:max-h-[380px] overflow-y-auto overscroll-contain pr-1">
                    {filteredCategories.map((cat) => {
                        const isSelected =
                            cat.value === null
                                ? query.category === null && (!query.categories || query.categories.length === 0)
                                : query.category === cat.value;
                        const itemId = cat.value === null ? "EVERYTHING" : cat.value;
                        const isJustSelected = transitioningItem === itemId;

                        return (
                            <button
                                key={itemId}
                                type="button"
                                onClick={() =>
                                    handleSelectAndAdvance(
                                        {
                                            category: cat.value,
                                            categories: cat.value ? [cat.value] : [],
                                            goal: "WHERE_SPENT",
                                            aggregation: cat.value ? "DAILY" : "CATEGORY_BREAKDOWN",
                                        },
                                        itemId
                                    )
                                }
                                className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative active:scale-[0.97] min-h-[64px] sm:min-h-[72px] flex flex-col justify-between ${
                                    isJustSelected || (isSelected && transitioningItem === null)
                                        ? "bg-purple-50/95 border-purple-400 ring-2 ring-purple-500/20 text-purple-950 font-bold shadow-2xs"
                                        : "bg-white border-slate-200/90 hover:border-purple-200 hover:bg-slate-50 text-slate-700"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-base sm:text-lg" aria-hidden="true">
                                        {cat.icon}
                                    </span>
                                    {(isJustSelected || (isSelected && transitioningItem === null)) && (
                                        <span className="p-0.5 rounded-full bg-purple-600 text-white animate-in zoom-in-50 duration-100">
                                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-xs block font-bold text-slate-900 truncate">
                                        {cat.label}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block truncate">
                                        {cat.desc}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ==========================================
    // STEP 2: TIMEFRAME SELECTION ("When?")
    // ==========================================
    if (step === "SELECT_PERIOD") {
        const categoryLabel = query.category
            ? CATEGORY_METADATA[query.category]?.label || query.category
            : "Everything";
        const categoryIcon = query.category
            ? CATEGORY_METADATA[query.category]?.icon || "🏷️"
            : "🌐";

        return (
            <div className="space-y-4 animate-in fade-in duration-150">
                {/* Header & Back Action */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                    </button>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold">
                        <span>{categoryIcon}</span>
                        <span>{categoryLabel}</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        When?
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                        Select a timeframe to automatically generate your spending insights.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 max-h-[380px] overflow-y-auto overscroll-contain pr-1">
                    {TIMEFRAME_OPTIONS.map((opt) => {
                        const isSelected = query.timePeriod === opt.id;
                        const isJustSelected = transitioningItem === opt.id;

                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                    handleSelectAndAdvance(
                                        {
                                            timePeriod: opt.id,
                                            goal: "WHERE_SPENT",
                                            aggregation: query.category ? "DAILY" : "CATEGORY_BREAKDOWN",
                                            visualization: "CHART",
                                        },
                                        opt.id
                                    )
                                }
                                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between active:scale-[0.98] min-h-[58px] sm:min-h-[64px] ${
                                    isJustSelected || (isSelected && transitioningItem === null)
                                        ? "bg-purple-50/95 border-purple-400 ring-2 ring-purple-500/20 text-purple-950 font-bold shadow-2xs"
                                        : "bg-white border-slate-200/90 hover:border-purple-200 hover:bg-slate-50 text-slate-700"
                                }`}
                            >
                                <div className="space-y-0.5 min-w-0 pr-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                                            {opt.label}
                                        </span>
                                        {opt.badge && (
                                             <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[9px] font-extrabold uppercase">
                                                {opt.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">
                                        {opt.desc}
                                    </span>
                                </div>

                                {(isJustSelected || (isSelected && transitioningItem === null)) && (
                                    <span className="p-1 rounded-full bg-purple-600 text-white shrink-0 animate-in zoom-in-50 duration-100">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
};

export default QueryStep;

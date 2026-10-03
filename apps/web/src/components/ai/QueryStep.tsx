import { useState, useRef, useEffect } from "react";
import type {
    FinanceQuery,
    QueryBuilderStep,
    TimePeriodOption,
    AggregationView,
    ExplorationGoal,
} from "../../types/financeQuery.types";
import type { TransactionCategory } from "../../types/dashboard.types";
import { CATEGORY_METADATA } from "../query/CategorySelector";
import { ArrowLeft, Search, Check, Sparkles } from "lucide-react";

interface QueryStepProps {
    step: QueryBuilderStep;
    query: FinanceQuery;
    onUpdateQuery: (updates: Partial<FinanceQuery>) => void;
    onNext: () => void;
    onBack: () => void;
}

const TRANSITION_DELAY_MS = 180;

const GOAL_CARDS: {
    id: ExplorationGoal;
    title: string;
    description: string;
    icon: string;
    defaults: Partial<FinanceQuery>;
}[] = [
    {
        id: "WHERE_SPENT",
        title: "Where did I spend?",
        description: "Category breakdown and spending distribution across your budget.",
        icon: "📊",
        defaults: {
            goal: "WHERE_SPENT",
            aggregation: "CATEGORY_BREAKDOWN",
            category: null,
            timePeriod: "THIS_MONTH",
            visualization: "CHART",
        },
    },
    {
        id: "HOW_CHANGING",
        title: "How is it changing?",
        description: "Compare periods and identify spending trends over time.",
        icon: "📈",
        defaults: {
            goal: "HOW_CHANGING",
            aggregation: "MONTHLY",
            timePeriod: "LAST_3_MONTHS",
            visualization: "CHART",
        },
    },
    {
        id: "HIGHEST_EXPENSES",
        title: "What costs me the most?",
        description: "Find your highest single expenses and peak spending periods.",
        icon: "🔥",
        defaults: {
            goal: "HIGHEST_EXPENSES",
            aggregation: "TRANSACTION_LIST",
            timePeriod: "THIS_MONTH",
            visualization: "TABLE",
        },
    },
    {
        id: "BUDGET_TRACKING",
        title: "Am I on track?",
        description: "Review essential vs luxury spending and financial priorities.",
        icon: "🎯",
        defaults: {
            goal: "BUDGET_TRACKING",
            priority: "ESSENTIAL",
            aggregation: "CATEGORY_BREAKDOWN",
            timePeriod: "THIS_MONTH",
            visualization: "CHART",
        },
    },
];

const PERIOD_OPTIONS: { id: TimePeriodOption; label: string; desc: string; badge?: string }[] = [
    { id: "THIS_MONTH", label: "This Month", desc: "1st of current month to today", badge: "Popular" },
    { id: "LAST_MONTH", label: "Last Month", desc: "Full previous calendar month" },
    { id: "LAST_3_MONTHS", label: "Last 3 Months", desc: "Quarterly historical view" },
    { id: "LAST_6_MONTHS", label: "Last 6 Months", desc: "Half-year spending view" },
    { id: "THIS_YEAR", label: "This Year (YTD)", desc: "Jan 1st to today" },
    { id: "LAST_7_DAYS", label: "This Week", desc: "Past 7 days activity" },
    { id: "LAST_30_DAYS", label: "Last 30 Days", desc: "Rolling 30 days" },
    { id: "ALL_TIME", label: "All Time", desc: "Entire transaction history" },
];

const VIEW_OPTIONS: { id: AggregationView; label: string; desc: string; icon: string }[] = [
    { id: "CATEGORY_BREAKDOWN", label: "Category breakdown", desc: "Donut chart of spending distribution", icon: "🍩" },
    { id: "MONTHLY", label: "Trends over time", desc: "Month-by-month spending bars", icon: "📊" },
    { id: "TOTAL", label: "Total amount", desc: "High-level summary figures and key stats", icon: "🎯" },
    { id: "TRANSACTION_LIST", label: "Transaction list", desc: "Itemized transaction records ledger", icon: "📋" },
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

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Reset transition state whenever step changes
    useEffect(() => {
        isTransitioningRef.current = false;
        setTransitioningItem(null);
    }, [step]);

    // Unified auto-advance selection handler with visual feedback
    const handleSelectAndAdvance = (patch: Partial<FinanceQuery>, itemId: string) => {
        if (isTransitioningRef.current) return;
        isTransitioningRef.current = true;
        setTransitioningItem(itemId);
        onUpdateQuery(patch);

        timeoutRef.current = setTimeout(() => {
            onNext();
            isTransitioningRef.current = false;
            setTransitioningItem(null);
        }, TRANSITION_DELAY_MS);
    };

    const categories = Object.keys(CATEGORY_METADATA) as TransactionCategory[];

    const filteredCategories = categories.filter((cat) => {
        if (!categorySearch.trim()) return true;
        const meta = CATEGORY_METADATA[cat];
        return (
            meta.label.toLowerCase().includes(categorySearch.toLowerCase()) ||
            cat.toLowerCase().includes(categorySearch.toLowerCase())
        );
    });

    // ==========================================
    // STEP 1: EXPLORATION GOAL
    // ==========================================
    if (step === "SELECT_GOAL") {
        return (
            <div className="space-y-6 animate-in fade-in duration-150">
                <div className="space-y-1.5 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold uppercase tracking-wide">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        Step 1 • Goal
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        What would you like to explore?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                        Choose a question to guide your financial inquiry.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {GOAL_CARDS.map((card) => {
                        const isSelected = query.goal === card.id;
                        const isJustSelected = transitioningItem === card.id;

                        return (
                            <button
                                key={card.id}
                                type="button"
                                onClick={() =>
                                    handleSelectAndAdvance(
                                        {
                                            ...card.defaults,
                                            goal: card.id,
                                        },
                                        card.id
                                    )
                                }
                                className={`group p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative active:scale-[0.98] ${
                                    isJustSelected || isSelected
                                        ? "bg-purple-50/95 border-purple-400 ring-3 ring-purple-500/20 shadow-sm"
                                        : "bg-white border-slate-200/90 hover:border-purple-200 hover:bg-slate-50/80 shadow-2xs hover:shadow-xs"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <span
                                        className="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform"
                                        aria-hidden="true"
                                    >
                                        {card.icon}
                                    </span>
                                    {(isJustSelected || isSelected) && (
                                        <span className="p-1 rounded-full bg-purple-600 text-white animate-in zoom-in-50 duration-100">
                                            <Check className="w-3 h-3" />
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-sm font-black text-slate-900 group-hover:text-purple-700 transition-colors mb-1">
                                    {card.title}
                                </h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {card.description}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Custom Exploration option */}
                <div className="pt-1">
                    <button
                        type="button"
                        onClick={() => handleSelectAndAdvance({ goal: "CUSTOM" }, "CUSTOM")}
                        className="w-full py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-between transition-all cursor-pointer active:scale-[0.99]"
                    >
                        <span>Or customize every parameter manually</span>
                        <span className="text-slate-400">→</span>
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // STEP 2: CATEGORY SELECTION (Auto-Advancing)
    // ==========================================
    if (step === "SELECT_CATEGORY") {
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

                    <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">
                        Step 2 of 4
                    </span>
                </div>

                <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                        What category?
                    </h3>
                    <p className="text-xs text-slate-500">
                        Tap any category to immediately select and advance.
                    </p>
                </div>

                {/* Category Search Input */}
                <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Filter categories (e.g., Food, Travel, Bills)..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all"
                    />
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {/* All Categories Option */}
                    {(!categorySearch.trim() || "all categories".includes(categorySearch.toLowerCase())) && (
                        <button
                            type="button"
                            onClick={() => handleSelectAndAdvance({ category: null }, "ALL_CATEGORIES")}
                            className={`p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative active:scale-[0.97] ${
                                transitioningItem === "ALL_CATEGORIES" || (query.category === null && transitioningItem === null)
                                    ? "bg-purple-50/95 border-purple-400 ring-3 ring-purple-500/20 text-purple-950 font-bold shadow-2xs"
                                    : "bg-white border-slate-200/90 hover:border-purple-200 hover:bg-slate-50 text-slate-700"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-base" aria-hidden="true">🌐</span>
                                {(transitioningItem === "ALL_CATEGORIES" || (query.category === null && transitioningItem === null)) && (
                                    <span className="p-0.5 rounded-full bg-purple-600 text-white animate-in zoom-in-50 duration-100">
                                        <Check className="w-2.5 h-2.5" />
                                    </span>
                                )}
                            </div>
                            <span className="text-xs block font-bold text-slate-900">All Categories</span>
                            <span className="text-[10px] text-slate-400 block truncate">Total expenditure</span>
                        </button>
                    )}

                    {filteredCategories.map((cat) => {
                        const meta = CATEGORY_METADATA[cat];
                        const isSelected = query.category === cat;
                        const isJustSelected = transitioningItem === cat;

                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => handleSelectAndAdvance({ category: cat }, cat)}
                                className={`p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative active:scale-[0.97] ${
                                    isJustSelected || (isSelected && transitioningItem === null)
                                        ? "bg-purple-50/95 border-purple-400 ring-3 ring-purple-500/20 text-purple-950 font-bold shadow-2xs"
                                        : "bg-white border-slate-200/90 hover:border-purple-200 hover:bg-slate-50 text-slate-700"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-base" aria-hidden="true">{meta.icon}</span>
                                    {(isJustSelected || (isSelected && transitioningItem === null)) && (
                                        <span className="p-0.5 rounded-full bg-purple-600 text-white animate-in zoom-in-50 duration-100">
                                            <Check className="w-2.5 h-2.5" />
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs block font-bold text-slate-900 truncate">{meta.label}</span>
                                <span className="text-[10px] text-slate-400 block truncate">{meta.description}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ==========================================
    // STEP 3: TIME PERIOD (Auto-Advancing)
    // ==========================================
    if (step === "SELECT_PERIOD") {
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

                    <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">
                        Step 3 of 4
                    </span>
                </div>

                <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                        When?
                    </h3>
                    <p className="text-xs text-slate-500">
                        Select a timeframe to automatically proceed to view formats.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {PERIOD_OPTIONS.map((opt) => {
                        const isSelected = query.timePeriod === opt.id;
                        const isJustSelected = transitioningItem === opt.id;

                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelectAndAdvance({ timePeriod: opt.id }, opt.id)}
                                className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between active:scale-[0.98] ${
                                    isJustSelected || (isSelected && transitioningItem === null)
                                        ? "bg-purple-50/95 border-purple-400 ring-3 ring-purple-500/20 text-purple-950 font-bold shadow-2xs"
                                        : "bg-white border-slate-200/90 hover:border-purple-200 hover:bg-slate-50 text-slate-700"
                                }`}
                            >
                                <div className="space-y-0.5 min-w-0 pr-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                                        {opt.badge && (
                                            <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[9px] font-extrabold uppercase">
                                                {opt.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[11px] text-slate-400 block truncate">{opt.desc}</span>
                                </div>

                                {(isJustSelected || (isSelected && transitioningItem === null)) && (
                                    <span className="p-1 rounded-full bg-purple-600 text-white shrink-0 animate-in zoom-in-50 duration-100">
                                        <Check className="w-3 h-3" />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ==========================================
    // STEP 4: VIEW / RESULT TYPE (Auto-Advancing to Summary)
    // ==========================================
    if (step === "SELECT_VIEW") {
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

                    <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">
                        Step 4 of 4
                    </span>
                </div>

                <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                        How would you like to see it?
                    </h3>
                    <p className="text-xs text-slate-500">
                        Tap a presentation format to review your final question.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {VIEW_OPTIONS.map((opt) => {
                        const isSelected = query.aggregation === opt.id;
                        const isJustSelected = transitioningItem === opt.id;

                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                    handleSelectAndAdvance(
                                        {
                                            aggregation: opt.id,
                                            visualization: opt.id === "TRANSACTION_LIST" ? "TABLE" : "CHART",
                                        },
                                        opt.id
                                    )
                                }
                                className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                                    isJustSelected || (isSelected && transitioningItem === null)
                                        ? "bg-purple-50/95 border-purple-400 ring-3 ring-purple-500/20 text-purple-950 font-bold shadow-2xs"
                                        : "bg-white border-slate-200/90 hover:border-purple-200 hover:bg-slate-50 text-slate-700"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-2xl" aria-hidden="true">{opt.icon}</span>
                                    {(isJustSelected || (isSelected && transitioningItem === null)) && (
                                        <span className="p-1 rounded-full bg-purple-600 text-white animate-in zoom-in-50 duration-100">
                                            <Check className="w-3 h-3" />
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-bold text-slate-900 block mb-0.5">{opt.label}</span>
                                <span className="text-[11px] text-slate-500 block leading-relaxed">{opt.desc}</span>
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

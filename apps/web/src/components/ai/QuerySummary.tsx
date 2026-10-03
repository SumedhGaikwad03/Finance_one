import type { FinanceQuery, QueryBuilderStep } from "../../types/financeQuery.types";
import { CATEGORY_METADATA } from "../query/CategorySelector";
import { Sparkles, ArrowLeft, Layers, Calendar, BarChart3, Edit2 } from "lucide-react";

interface QuerySummaryProps {
    query: FinanceQuery;
    onExecute?: () => void;
    onModify?: () => void;
    onConfirm?: () => void;
    onBack?: () => void;
    onEditStep?: (step: QueryBuilderStep) => void;
    isExecuting?: boolean;
    isLoading?: boolean;
}

const PERIOD_LABELS: Record<string, string> = {
    THIS_MONTH: "This month",
    LAST_MONTH: "Last month",
    LAST_3_MONTHS: "Last 3 months",
    LAST_6_MONTHS: "Last 6 months",
    THIS_YEAR: "This year",
    LAST_7_DAYS: "This week",
    LAST_30_DAYS: "Last 30 days",
    ALL_TIME: "All time",
};

const VIEW_LABELS: Record<string, string> = {
    TOTAL: "Total amount",
    DAILY: "Daily trends",
    WEEKLY: "Weekly trends",
    MONTHLY: "Trends over time",
    CATEGORY_BREAKDOWN: "Category breakdown",
    TRANSACTION_LIST: "Transaction list",
};

export const QuerySummary = ({
    query,
    onExecute,
    onModify,
    onConfirm,
    onBack,
    onEditStep,
    isExecuting,
    isLoading,
}: QuerySummaryProps) => {
    const isBusy = Boolean(isExecuting || isLoading);
    const handleConfirm = onConfirm || onExecute || (() => {});
    const handleBack = onBack || onModify || (() => { if (onEditStep) onEditStep("SELECT_VIEW"); });

    const categoryLabel = query.category ? (CATEGORY_METADATA[query.category]?.label || query.category) : "All categories";
    const periodLabel = PERIOD_LABELS[query.timePeriod] || query.timePeriod;
    const viewLabel = VIEW_LABELS[query.aggregation] || query.aggregation;

    // Formulate a natural readable question
    const getFormulatedSentence = () => {
        const cat = query.category ? CATEGORY_METADATA[query.category]?.label : "all spending";
        const period = periodLabel.toLowerCase();

        if (query.aggregation === "CATEGORY_BREAKDOWN") {
            return `Show my ${cat} category breakdown for ${period}.`;
        }
        if (query.aggregation === "MONTHLY" || query.aggregation === "DAILY") {
            return `Show trends over time for ${cat} across ${period}.`;
        }
        if (query.aggregation === "TRANSACTION_LIST") {
            return `Show my itemized ${cat} transactions for ${period}.`;
        }
        return `Show my total spending on ${cat} during ${period}.`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-extrabold uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Confirmation
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Here's your question
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Review the choices you've assembled before calculating results.
                </p>
            </div>

            {/* Visual Choices Summary Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-white border border-purple-200/80 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Category pill */}
                    <button
                        type="button"
                        onClick={() => onEditStep?.("SELECT_CATEGORY")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-950 text-xs font-bold shadow-2xs hover:border-purple-300 transition-colors group cursor-pointer"
                        title="Click to edit category"
                    >
                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                        <span>{categoryLabel}</span>
                        <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-purple-600 ml-0.5" />
                    </button>

                    {/* Period pill */}
                    <button
                        type="button"
                        onClick={() => onEditStep?.("SELECT_PERIOD")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-950 text-xs font-bold shadow-2xs hover:border-purple-300 transition-colors group cursor-pointer"
                        title="Click to edit timeframe"
                    >
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        <span>{periodLabel}</span>
                        <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-purple-600 ml-0.5" />
                    </button>

                    {/* View pill */}
                    <button
                        type="button"
                        onClick={() => onEditStep?.("SELECT_VIEW")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-950 text-xs font-bold shadow-2xs hover:border-purple-300 transition-colors group cursor-pointer"
                        title="Click to edit result type"
                    >
                        <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                        <span>{viewLabel}</span>
                        <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-purple-600 ml-0.5" />
                    </button>
                </div>

                {/* Formulated question statement */}
                <div className="pt-2 border-t border-purple-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Compiled inquiry
                    </span>
                    <blockquote className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                        “{getFormulatedSentence()}”
                    </blockquote>
                </div>
            </div>

            {/* Action CTAs */}
            <div className="flex items-center justify-between gap-3 pt-2">
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change step</span>
                </button>

                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isBusy}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                    <Sparkles className="w-4 h-4" />
                    <span>{isBusy ? "Fetching..." : "Generate Results →"}</span>
                </button>
            </div>
        </div>
    );
};

export default QuerySummary;

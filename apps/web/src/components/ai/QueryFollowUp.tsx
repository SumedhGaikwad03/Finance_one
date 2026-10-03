import { useState } from "react";
import { Send, Sparkles, ArrowLeftRight, TrendingUp, Layers, Table, AlertCircle, ChevronDown, ChevronUp, Bot } from "lucide-react";
import type { FinanceQuery } from "../../types/financeQuery.types";

interface QueryFollowUpProps {
    currentQuery: FinanceQuery;
    onApplyFollowUp: (followUpText: string, updatedQueryPatch?: Partial<FinanceQuery>) => void;
    onReset: () => void;
    isLoading?: boolean;
}

interface FollowUpAction {
    id: string;
    label: string;
    icon: typeof Sparkles;
    patch?: Partial<FinanceQuery>;
    promptText?: string;
}

export const QueryFollowUp = ({
    currentQuery,
    onApplyFollowUp,
    onReset,
    isLoading = false,
}: QueryFollowUpProps) => {
    const [promptInput, setPromptInput] = useState("");
    const [isAIExpanded, setIsAIExpanded] = useState(false);

    // Dynamic follow-up suggestion chips
    const followUpActions: FollowUpAction[] = [];

    // Category switch actions
    if (currentQuery.category) {
        followUpActions.push({
            id: "all_categories",
            label: "Explore all categories",
            icon: Layers,
            patch: { category: null, aggregation: "CATEGORY_BREAKDOWN" },
            promptText: "Compare all categories for this period",
        });
    } else {
        followUpActions.push({
            id: "food_only",
            label: "Focus on Food & Dining",
            icon: TrendingUp,
            patch: { category: "FOOD" },
            promptText: "Show only Food expenses",
        });
        followUpActions.push({
            id: "fuel_only",
            label: "Focus on Transport",
            icon: TrendingUp,
            patch: { category: "FUEL" },
            promptText: "Show only Fuel & Transport expenses",
        });
    }

    // Time horizon comparisons
    if (currentQuery.timePeriod === "THIS_MONTH") {
        followUpActions.push({
            id: "last_month",
            label: "Compare with last month",
            icon: ArrowLeftRight,
            patch: { timePeriod: "LAST_MONTH" },
            promptText: "Compare with last month",
        });
        followUpActions.push({
            id: "last_3_months",
            label: "View 3-month trend",
            icon: TrendingUp,
            patch: { timePeriod: "LAST_3_MONTHS", aggregation: "MONTHLY" },
            promptText: "View 3-month trend",
        });
    } else if (currentQuery.timePeriod === "LAST_MONTH") {
        followUpActions.push({
            id: "this_month",
            label: "Back to this month",
            icon: ArrowLeftRight,
            patch: { timePeriod: "THIS_MONTH" },
            promptText: "Show this month's spending",
        });
    } else {
        followUpActions.push({
            id: "this_month",
            label: "Filter to this month",
            icon: ArrowLeftRight,
            patch: { timePeriod: "THIS_MONTH" },
            promptText: "Filter to this month",
        });
    }

    // Toggle priority filter
    if (!currentQuery.priority) {
        followUpActions.push({
            id: "essential_priority",
            label: "Essential only",
            icon: AlertCircle,
            patch: { priority: "ESSENTIAL" },
            promptText: "Show only essential priority transactions",
        });
    }

    // Visualization toggle action
    if (currentQuery.visualization === "CHART") {
        followUpActions.push({
            id: "show_table",
            label: "View table list",
            icon: Table,
            patch: { visualization: "TABLE" },
            promptText: "Show detailed transaction list",
        });
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!promptInput.trim() || isLoading) return;
        onApplyFollowUp(promptInput.trim());
        setPromptInput("");
    };

    const handleActionClick = (action: FollowUpAction) => {
        if (isLoading) return;
        onApplyFollowUp(action.promptText || action.label, action.patch);
    };

    return (
        <div className="space-y-4 pt-4 border-t border-slate-200/80">
            {/* Top Row: Follow up prompt header & Reset button */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Suggested Next Steps
                </span>
                <button
                    type="button"
                    onClick={onReset}
                    className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline transition-all cursor-pointer"
                >
                    + New Query
                </button>
            </div>

            {/* Quick action exploration chips */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {followUpActions.slice(0, 5).map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.id}
                            type="button"
                            onClick={() => handleActionClick(action)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-[11px] sm:text-xs font-bold border border-slate-200 hover:border-purple-200 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                            <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
                            <span>{action.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Secondary AI Beta Entry Point Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 overflow-hidden transition-all">
                <button
                    type="button"
                    onClick={() => setIsAIExpanded(!isAIExpanded)}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
                    aria-expanded={isAIExpanded}
                >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
                        <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                    ✦ Have a custom question?
                                </span>
                                <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 text-[9px] font-extrabold uppercase tracking-wide shrink-0">
                                    AI Beta
                                </span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block truncate">
                                Ask financial questions using natural language.
                            </span>
                        </div>
                    </div>

                    {isAIExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                </button>

                {isAIExpanded && (
                    <div className="px-3.5 sm:px-4 pb-3.5 pt-1 border-t border-slate-200/60 space-y-2 animate-in fade-in duration-150">
                        <form onSubmit={handleSubmit} className="relative flex items-center">
                            <input
                                type="text"
                                value={promptInput}
                                onChange={(e) => setPromptInput(e.target.value)}
                                placeholder="E.g., What did I spend on dining out last weekend?..."
                                disabled={isLoading}
                                className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!promptInput.trim() || isLoading}
                                className="absolute right-1.5 p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-30 transition-all active:scale-90 cursor-pointer"
                                title="Send question"
                            >
                                <Send className="w-3 h-3" />
                            </button>
                        </form>
                        <p className="text-[10px] text-slate-400 italic">
                            AI Beta responses are structured deterministically into Finance One's query engine.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QueryFollowUp;

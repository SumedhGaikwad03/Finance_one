import { Check } from "lucide-react";
import type { FinanceQuery, QueryBuilderStep } from "../../types/financeQuery.types";
import { CATEGORY_METADATA } from "../query/CategorySelector";

interface QueryProgressProps {
    currentStep: QueryBuilderStep;
    query?: FinanceQuery;
    onJumpToStep?: (step: QueryBuilderStep) => void;
}

const PERIOD_LABELS: Record<string, string> = {
    THIS_MONTH: "This month",
    LAST_MONTH: "Last month",
    LAST_3_MONTHS: "Last 3 months",
    THIS_YEAR: "This year",
    LAST_6_MONTHS: "Last 6 months",
    LAST_7_DAYS: "Last 7 days",
    LAST_30_DAYS: "Last 30 days",
    ALL_TIME: "All time",
};

export const QueryProgress = ({
    currentStep,
    query,
    onJumpToStep,
}: QueryProgressProps) => {
    // Hide step progress during loading or results
    if (currentStep === "EXECUTING" || currentStep === "RESULTS") return null;

    const categoryLabel = query?.category
        ? CATEGORY_METADATA[query.category]?.label || query.category
        : "Everything";
    const periodLabel = query ? PERIOD_LABELS[query.timePeriod] || query.timePeriod : "Timeframe";

    const isCategoryCompleted = currentStep === "SELECT_PERIOD";
    const isPeriodCurrent = currentStep === "SELECT_PERIOD";

    return (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            {/* Step 1: Category */}
            <button
                type="button"
                onClick={() => isCategoryCompleted && onJumpToStep?.("SELECT_CATEGORY")}
                disabled={!isCategoryCompleted}
                className={`flex items-center gap-2 text-xs transition-all ${
                    currentStep === "SELECT_CATEGORY"
                        ? "font-extrabold text-purple-700"
                        : isCategoryCompleted
                        ? "font-semibold text-slate-700 hover:text-purple-700 cursor-pointer"
                        : "font-medium text-slate-400"
                }`}
            >
                <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                        isCategoryCompleted
                            ? "bg-purple-600 text-white"
                            : currentStep === "SELECT_CATEGORY"
                            ? "bg-purple-100 text-purple-700 ring-2 ring-purple-500/20"
                            : "bg-slate-100 text-slate-400"
                    }`}
                >
                    {isCategoryCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : "1"}
                </div>
                <span>Category</span>
                {isCategoryCompleted && (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold">
                        {categoryLabel}
                    </span>
                )}
            </button>

            {/* Divider line */}
            <div
                className={`flex-1 h-0.5 mx-3 rounded-full transition-colors ${
                    isCategoryCompleted ? "bg-purple-400" : "bg-slate-200"
                }`}
            />

            {/* Step 2: Timeframe */}
            <div
                className={`flex items-center gap-2 text-xs ${
                    isPeriodCurrent
                        ? "font-extrabold text-purple-700"
                        : "font-medium text-slate-400"
                }`}
            >
                <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                        isPeriodCurrent
                            ? "bg-purple-100 text-purple-700 ring-2 ring-purple-500/20"
                            : "bg-slate-100 text-slate-400"
                    }`}
                >
                    2
                </div>
                <span>Timeframe</span>
                {isPeriodCurrent && query?.timePeriod && (
                    <span className="hidden sm:inline-block text-[10px] text-slate-500 font-medium">
                        ({periodLabel})
                    </span>
                )}
            </div>
        </div>
    );
};

export default QueryProgress;

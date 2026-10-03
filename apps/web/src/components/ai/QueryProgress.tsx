import { Check } from "lucide-react";
import type { FinanceQuery, QueryBuilderStep } from "../../types/financeQuery.types";
import { CATEGORY_METADATA } from "../query/CategorySelector";

interface QueryProgressProps {
    currentStep: QueryBuilderStep;
    query?: FinanceQuery;
    hasResults?: boolean;
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
    hasResults = false,
    onJumpToStep,
}: QueryProgressProps) => {
    const categoryLabel = query?.category
        ? CATEGORY_METADATA[query.category]?.label || query.category
        : "Everything";
    const periodLabel = query ? PERIOD_LABELS[query.timePeriod] || query.timePeriod : "Timeframe";

    const isCategorySelected = currentStep === "SELECT_PERIOD" || currentStep === "EXECUTING" || currentStep === "RESULTS";
    const isPeriodSelected = currentStep === "EXECUTING" || currentStep === "RESULTS";

    return (
        <div className="sticky top-0 z-20 flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xs">
            {/* Step 1: Category */}
            <button
                type="button"
                onClick={() => onJumpToStep?.("SELECT_CATEGORY")}
                className={`flex items-center gap-1.5 sm:gap-2 text-xs transition-all cursor-pointer ${
                    currentStep === "SELECT_CATEGORY"
                        ? "font-extrabold text-purple-700"
                        : isCategorySelected
                        ? "font-semibold text-slate-700 hover:text-purple-700"
                        : "font-medium text-slate-400"
                }`}
            >
                <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                        isCategorySelected
                            ? "bg-purple-600 text-white"
                            : currentStep === "SELECT_CATEGORY"
                            ? "bg-purple-100 text-purple-700 ring-2 ring-purple-500/20"
                            : "bg-slate-100 text-slate-400"
                    }`}
                >
                    {isCategorySelected ? <Check className="w-3 h-3 stroke-[3]" /> : "1"}
                </div>
                <span>Category</span>
                {isCategorySelected && (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold max-w-[90px] truncate">
                        {categoryLabel}
                    </span>
                )}
            </button>

            {/* Divider line 1 */}
            <div
                className={`flex-1 h-0.5 mx-2 sm:mx-3 rounded-full transition-colors ${
                    isCategorySelected ? "bg-purple-400" : "bg-slate-200"
                }`}
            />

            {/* Step 2: Timeframe */}
            <button
                type="button"
                onClick={() => isCategorySelected && onJumpToStep?.("SELECT_PERIOD")}
                disabled={!isCategorySelected}
                className={`flex items-center gap-1.5 sm:gap-2 text-xs transition-all ${
                    currentStep === "SELECT_PERIOD"
                        ? "font-extrabold text-purple-700 cursor-pointer"
                        : isPeriodSelected
                        ? "font-semibold text-slate-700 hover:text-purple-700 cursor-pointer"
                        : isCategorySelected
                        ? "font-medium text-slate-600 hover:text-purple-700 cursor-pointer"
                        : "font-medium text-slate-300 cursor-not-allowed"
                }`}
            >
                <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                        isPeriodSelected
                            ? "bg-purple-600 text-white"
                            : currentStep === "SELECT_PERIOD"
                            ? "bg-purple-100 text-purple-700 ring-2 ring-purple-500/20"
                            : "bg-slate-100 text-slate-400"
                    }`}
                >
                    {isPeriodSelected ? <Check className="w-3 h-3 stroke-[3]" /> : "2"}
                </div>
                <span>Timeframe</span>
                {isPeriodSelected && (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold max-w-[90px] truncate">
                        {periodLabel}
                    </span>
                )}
            </button>

            {/* Divider line 2 (if results exist) */}
            {hasResults && (
                <>
                    <div className="flex-1 h-0.5 mx-2 sm:mx-3 rounded-full bg-purple-400 transition-colors" />

                    {/* Step 3: Results */}
                    <button
                        type="button"
                        onClick={() => onJumpToStep?.("RESULTS")}
                        className={`flex items-center gap-1.5 sm:gap-2 text-xs transition-all cursor-pointer ${
                            currentStep === "RESULTS"
                                ? "font-extrabold text-purple-700"
                                : "font-semibold text-slate-700 hover:text-purple-700"
                        }`}
                    >
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-purple-600 text-white">
                            <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span>Results</span>
                    </button>
                </>
            )}
        </div>
    );
};

export default QueryProgress;

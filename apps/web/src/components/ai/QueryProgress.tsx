import { Check, ChevronRight } from "lucide-react";
import type { FinanceQuery, QueryBuilderStep } from "../../types/financeQuery.types";
import { CATEGORY_METADATA } from "../query/CategorySelector";

interface QueryProgressProps {
    currentStep: QueryBuilderStep;
    query?: FinanceQuery;
    onJumpToStep?: (step: QueryBuilderStep) => void;
    onStepClick?: (step: QueryBuilderStep) => void;
}

const GOAL_LABELS: Record<string, string> = {
    WHERE_SPENT: "Where spent",
    HOW_CHANGING: "Trend change",
    HIGHEST_EXPENSES: "Top expenses",
    BUDGET_TRACKING: "On track",
    CUSTOM: "Custom inquiry",
};

const PERIOD_LABELS: Record<string, string> = {
    THIS_MONTH: "This Month",
    LAST_MONTH: "Last Month",
    LAST_3_MONTHS: "Last 3 Mo",
    LAST_6_MONTHS: "Last 6 Mo",
    THIS_YEAR: "This Year",
    LAST_7_DAYS: "Last 7 Days",
    LAST_30_DAYS: "Last 30 Days",
    ALL_TIME: "All Time",
};

const VIEW_LABELS: Record<string, string> = {
    TOTAL: "Total Amount",
    DAILY: "Daily Trend",
    WEEKLY: "Weekly Trend",
    MONTHLY: "Monthly Bars",
    CATEGORY_BREAKDOWN: "Breakdown",
    TRANSACTION_LIST: "List",
};

export const QueryProgress = ({
    currentStep,
    query,
    onJumpToStep,
    onStepClick,
}: QueryProgressProps) => {
    // If in initial or results view without explicit builder step, don't show full step bar
    if (currentStep === "INITIAL" || currentStep === "SELECT_GOAL") return null;

    const handleStepJump = (target: QueryBuilderStep) => {
        if (onStepClick) onStepClick(target);
        if (onJumpToStep) onJumpToStep(target);
    };

    const goalLabel = query?.goal ? GOAL_LABELS[query.goal] || "Goal" : "Explore";
    const categoryLabel = query?.category ? CATEGORY_METADATA[query.category]?.label || query.category : "All Categories";
    const periodLabel = query ? (PERIOD_LABELS[query.timePeriod] || query.timePeriod) : "Timeframe";
    const viewLabel = query ? (VIEW_LABELS[query.aggregation] || query.aggregation) : "Result Type";

    const stepList = [
        {
            id: "SELECT_GOAL" as QueryBuilderStep,
            stepNum: 1,
            title: "Goal",
            value: goalLabel,
            isCompleted: true,
            isCurrent: false,
        },
        {
            id: "SELECT_CATEGORY" as QueryBuilderStep,
            stepNum: 2,
            title: "Category",
            value: categoryLabel,
            isCompleted: currentStep === "SELECT_PERIOD" || currentStep === "SELECT_VIEW" || currentStep === "CONFIRMATION" || currentStep === "RESULTS",
            isCurrent: currentStep === "SELECT_CATEGORY",
        },
        {
            id: "SELECT_PERIOD" as QueryBuilderStep,
            stepNum: 3,
            title: "When",
            value: periodLabel,
            isCompleted: currentStep === "SELECT_VIEW" || currentStep === "CONFIRMATION" || currentStep === "RESULTS",
            isCurrent: currentStep === "SELECT_PERIOD",
        },
        {
            id: "SELECT_VIEW" as QueryBuilderStep,
            stepNum: 4,
            title: "View",
            value: viewLabel,
            isCompleted: currentStep === "CONFIRMATION" || currentStep === "RESULTS",
            isCurrent: currentStep === "SELECT_VIEW",
        },
    ];

    const currentStepIndex = stepList.findIndex((s) => s.isCurrent);
    const activeStepNumber = currentStepIndex >= 0 ? currentStepIndex + 1 : (currentStep === "CONFIRMATION" ? 4 : 1);

    return (
        <div className="space-y-2 bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 transition-all">
            {/* Top Microcopy & Dot Progress Indicator */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider">
                        {currentStep === "CONFIRMATION" ? "Ready to generate" : `Step ${activeStepNumber} of 4`}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-semibold text-slate-500">
                        {currentStep === "SELECT_CATEGORY" && "Choose category"}
                        {currentStep === "SELECT_PERIOD" && "Select timeframe"}
                        {currentStep === "SELECT_VIEW" && "Choose presentation"}
                        {currentStep === "CONFIRMATION" && "Review your question"}
                    </span>
                </div>

                {/* Dots indicator */}
                <div className="flex items-center gap-1.5" aria-hidden="true">
                    {stepList.map((s) => (
                        <div
                            key={s.id}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                s.isCurrent
                                    ? "w-5 bg-purple-600"
                                    : s.isCompleted
                                    ? "w-2 bg-purple-400"
                                    : "w-2 bg-slate-200"
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Interactive Step Pills */}
            <div className="flex items-center justify-between gap-1 pt-1">
                {stepList.map((step, idx) => (
                    <div key={step.id} className="flex items-center flex-1 min-w-0">
                        <button
                            type="button"
                            onClick={() => handleStepJump(step.id)}
                            disabled={!step.isCompleted && !step.isCurrent}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-left transition-all min-w-0 flex-1 ${
                                step.isCurrent
                                    ? "bg-white text-purple-950 font-bold border border-purple-200 shadow-2xs ring-2 ring-purple-500/10"
                                    : step.isCompleted
                                    ? "text-slate-700 hover:bg-white hover:border-slate-200 font-medium cursor-pointer"
                                    : "text-slate-400 font-normal opacity-60 cursor-not-allowed"
                            }`}
                        >
                            <span
                                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 font-extrabold ${
                                    step.isCompleted
                                        ? "bg-emerald-500 text-white"
                                        : step.isCurrent
                                        ? "bg-purple-600 text-white"
                                        : "bg-slate-200 text-slate-500"
                                }`}
                            >
                                {step.isCompleted ? <Check className="w-2.5 h-2.5" /> : step.stepNum}
                            </span>
                            <div className="min-w-0 truncate hidden sm:block">
                                <span className="block text-[11px] truncate font-bold">
                                    {step.value}
                                </span>
                            </div>
                        </button>

                        {idx < stepList.length - 1 && (
                            <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 mx-0.5" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QueryProgress;

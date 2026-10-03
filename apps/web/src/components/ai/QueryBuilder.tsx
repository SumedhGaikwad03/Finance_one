import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import type {
    FinanceQuery,
    QueryBuilderStep,
    QueryExecutionResult,
} from "../../types/financeQuery.types";
import {
    executeFinanceQuery,
    parseNaturalLanguageIntent,
} from "../../services/financeQuery.service";
import { QueryProgress } from "./QueryProgress";
import { QueryStep } from "./QueryStep";
import { QueryResult } from "./QueryResult";
import { QueryFollowUp } from "./QueryFollowUp";
import { CATEGORY_METADATA } from "../query/CategorySelector";

interface QueryBuilderProps {
    onClose?: () => void;
}

const DEFAULT_QUERY: FinanceQuery = {
    goal: "WHERE_SPENT",
    category: null,
    categories: [],
    priority: null,
    timePeriod: "THIS_MONTH",
    aggregation: "CATEGORY_BREAKDOWN",
    visualization: "CHART",
};

export const QueryBuilder = ({ onClose: _onClose }: QueryBuilderProps) => {
    // Default initial step is now directly Category selection ("Where did you spend?")
    const [step, setStep] = useState<QueryBuilderStep>("SELECT_CATEGORY");
    const [query, setQuery] = useState<FinanceQuery>(DEFAULT_QUERY);
    const [isLoading, setIsLoading] = useState(false);
    const [executionResult, setExecutionResult] = useState<QueryExecutionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Execution Pipeline
    const runExecution = async (targetQuery: FinanceQuery) => {
        setIsLoading(true);
        setError(null);
        setStep("EXECUTING");

        try {
            const result = await executeFinanceQuery(targetQuery);
            setExecutionResult(result);
            setStep("RESULTS");
        } catch (err) {
            console.error("Failed to execute finance query:", err);
            setError("Unable to process this query. Please check your network and try again.");
            setStep("SELECT_PERIOD");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Timeframe selection and immediate execution
    const handlePeriodSelected = async (finalPatch?: Partial<FinanceQuery>) => {
        const compiledQuery: FinanceQuery = {
            ...query,
            ...(finalPatch || {}),
            goal: "WHERE_SPENT",
            aggregation: (finalPatch?.category ?? query.category) ? "DAILY" : "CATEGORY_BREAKDOWN",
            visualization: "CHART",
        };
        setQuery(compiledQuery);
        await runExecution(compiledQuery);
    };

    // Handle Follow-up Actions in Results View
    const handleFollowUp = async (
        followUpText: string,
        patch?: Partial<FinanceQuery>
    ) => {
        let nextQuery: FinanceQuery;
        if (patch) {
            nextQuery = {
                ...query,
                ...patch,
                rawPrompt: followUpText,
            };
        } else {
            const parsed = parseNaturalLanguageIntent(followUpText);
            nextQuery = {
                ...query,
                ...parsed,
                rawPrompt: followUpText,
            };
        }

        setQuery(nextQuery);
        await runExecution(nextQuery);
    };

    // Reset to fresh exploration (Step 1: Category selection)
    const handleReset = () => {
        setQuery(DEFAULT_QUERY);
        setExecutionResult(null);
        setError(null);
        setStep("SELECT_CATEGORY");
    };

    const categoryLabel = query.category
        ? CATEGORY_METADATA[query.category]?.label || query.category
        : "Everything";
    const categoryIcon = query.category
        ? CATEGORY_METADATA[query.category]?.icon || "🏷️"
        : "🌐";

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Main Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
                {/* 2-Step Progress Indicator */}
                <QueryProgress
                    currentStep={step}
                    query={query}
                    onJumpToStep={(targetStep) => setStep(targetStep)}
                />

                {/* Error Banner */}
                {error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold animate-in fade-in duration-150">
                        {error}
                    </div>
                )}

                {/* STEP 1: CATEGORY SELECTION ("Where did you spend?") */}
                {(step === "SELECT_CATEGORY" || step === "INITIAL" || step === "SELECT_GOAL") && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs animate-in fade-in duration-150">
                        <QueryStep
                            step="SELECT_CATEGORY"
                            query={query}
                            onUpdateQuery={(patch) => setQuery((prev) => ({ ...prev, ...patch }))}
                            onNext={() => setStep("SELECT_PERIOD")}
                            onBack={() => {}}
                        />
                    </div>
                )}

                {/* STEP 2: TIMEFRAME SELECTION ("When?") */}
                {step === "SELECT_PERIOD" && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs animate-in fade-in duration-150">
                        <QueryStep
                            step="SELECT_PERIOD"
                            query={query}
                            onUpdateQuery={(patch) => setQuery((prev) => ({ ...prev, ...patch }))}
                            onNext={handlePeriodSelected}
                            onBack={() => setStep("SELECT_CATEGORY")}
                        />
                    </div>
                )}

                {/* EXECUTING STATE */}
                {step === "EXECUTING" && (
                    <div className="py-20 text-center space-y-4 animate-in fade-in duration-150">
                        <div className="p-4 bg-purple-100/80 text-purple-600 rounded-3xl w-fit mx-auto animate-pulse">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-slate-900">
                                Analyzing Spending...
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Calculating totals and category distribution for {categoryLabel}
                            </p>
                        </div>
                    </div>
                )}

                {/* RESULTS VIEW */}
                {step === "RESULTS" && executionResult && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                        {/* Results Top Action Bar */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                            <div className="flex items-center gap-2">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-100/80 text-purple-800 text-xs font-bold">
                                    <span>{categoryIcon}</span>
                                    <span>{categoryLabel}</span>
                                </div>
                                <span className="text-xs font-medium text-slate-500">
                                    • {executionResult.transactionCount} transaction{executionResult.transactionCount === 1 ? "" : "s"}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>New Query</span>
                            </button>
                        </div>

                        {/* Visual & Statistical Results */}
                        <QueryResult result={executionResult} />

                        {/* Follow-up Exploration */}
                        <QueryFollowUp
                            currentQuery={query}
                            onApplyFollowUp={handleFollowUp}
                            onReset={handleReset}
                            isLoading={isLoading}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default QueryBuilder;

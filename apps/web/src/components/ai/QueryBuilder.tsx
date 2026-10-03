import { useState } from "react";
import { Sparkles, Loader2, Bot, Send, ChevronDown, ChevronUp } from "lucide-react";
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
import { QuerySummary } from "./QuerySummary";
import { QueryResult } from "./QueryResult";
import { QueryFollowUp } from "./QueryFollowUp";

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
    const [step, setStep] = useState<QueryBuilderStep>("SELECT_GOAL");
    const [query, setQuery] = useState<FinanceQuery>(DEFAULT_QUERY);
    const [aiPromptInput, setAiPromptInput] = useState("");
    const [isAiBetaOpen, setIsAiBetaOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [executionResult, setExecutionResult] = useState<QueryExecutionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 1. Natural Language AI Beta submission
    const handleAiPromptSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!aiPromptInput.trim()) return;

        const parsed = parseNaturalLanguageIntent(aiPromptInput);
        const compiledQuery: FinanceQuery = {
            ...DEFAULT_QUERY,
            ...parsed,
            rawPrompt: aiPromptInput,
        };

        setQuery(compiledQuery);
        await runExecution(compiledQuery);
    };

    // 2. Execution Pipeline
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
            setStep("CONFIRMATION");
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Handle Follow-up Actions
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

    // 4. Reset to fresh exploration
    const handleReset = () => {
        setQuery(DEFAULT_QUERY);
        setAiPromptInput("");
        setExecutionResult(null);
        setError(null);
        setStep("SELECT_GOAL");
    };

    // 5. Direct navigation between progressive steps
    const handleStepJump = (targetStep: QueryBuilderStep) => {
        setStep(targetStep);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Main Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
                {/* Gamified Step Progress Bar (active during progressive steps & confirmation) */}
                <QueryProgress
                    currentStep={step}
                    query={query}
                    onJumpToStep={handleStepJump}
                />

                {/* STEP 1: OPENING / GOAL SELECTION */}
                {step === "SELECT_GOAL" && (
                    <div className="space-y-6">
                        {/* Opening Header */}
                        <div className="text-center space-y-1.5 pt-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/80 border border-purple-200/80 text-purple-700 text-xs font-black tracking-wide uppercase">
                                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                Query Explorer
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Let's explore your money
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto">
                                Choose what you'd like to know through simple visual choices.
                            </p>
                        </div>

                        {/* Interactive Goal Cards */}
                        <QueryStep
                            step="SELECT_GOAL"
                            query={query}
                            onUpdateQuery={(patch) => setQuery((prev) => ({ ...prev, ...patch }))}
                            onNext={() => setStep("SELECT_CATEGORY")}
                            onBack={() => {}}
                        />

                        {/* Secondary AI Beta Entry Point Card */}
                        <div className="pt-2">
                            <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-4 space-y-3 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 rounded-xl bg-purple-600 text-white shadow-2xs">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xs font-bold text-slate-900">
                                                    ✦ Have a specific question?
                                                </h3>
                                                <span className="px-1.5 py-0.5 rounded-md bg-purple-200/80 text-purple-800 text-[9px] font-black uppercase">
                                                    Beta
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-medium">
                                                Ask questions using natural language.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsAiBetaOpen(!isAiBetaOpen)}
                                        className="p-1.5 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                                        title="Toggle AI prompt input"
                                    >
                                        {isAiBetaOpen ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                {isAiBetaOpen && (
                                    <form onSubmit={handleAiPromptSubmit} className="space-y-2 pt-1 animate-in fade-in duration-150">
                                        <div className="relative flex items-center">
                                            <input
                                                type="text"
                                                value={aiPromptInput}
                                                onChange={(e) => setAiPromptInput(e.target.value)}
                                                placeholder="E.g., How much did I spend on Food last month?..."
                                                disabled={isLoading}
                                                className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!aiPromptInput.trim() || isLoading}
                                                className="absolute right-1.5 p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-30 transition-all active:scale-90 cursor-pointer"
                                                title="Ask question"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 italic">
                                            Beta responses are based on Finance One's current intent classification system.
                                        </p>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* PROGRESSIVE STEPS: Category, Time Period, Result View */}
                {(step === "SELECT_CATEGORY" ||
                    step === "SELECT_PERIOD" ||
                    step === "SELECT_VIEW") && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs animate-in fade-in duration-150">
                        <QueryStep
                            step={step}
                            query={query}
                            onUpdateQuery={(patch) => setQuery((prev) => ({ ...prev, ...patch }))}
                            onNext={() => {
                                if (step === "SELECT_CATEGORY") setStep("SELECT_PERIOD");
                                else if (step === "SELECT_PERIOD") setStep("SELECT_VIEW");
                                else if (step === "SELECT_VIEW") setStep("CONFIRMATION");
                            }}
                            onBack={() => {
                                if (step === "SELECT_CATEGORY") setStep("SELECT_GOAL");
                                else if (step === "SELECT_PERIOD") setStep("SELECT_CATEGORY");
                                else if (step === "SELECT_VIEW") setStep("SELECT_PERIOD");
                            }}
                        />
                    </div>
                )}

                {/* CONFIRMATION STEP: Here's your question */}
                {step === "CONFIRMATION" && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs animate-in fade-in duration-150 space-y-4">
                        {error && (
                            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold">
                                {error}
                            </div>
                        )}

                        <QuerySummary
                            query={query}
                            onEditStep={handleStepJump}
                            onConfirm={() => runExecution(query)}
                            onBack={() => setStep("SELECT_VIEW")}
                            isLoading={isLoading}
                        />
                    </div>
                )}

                {/* EXECUTING STATE */}
                {step === "EXECUTING" && (
                    <div className="py-16 text-center space-y-4 animate-in fade-in duration-150">
                        <div className="p-4 bg-purple-100/80 text-purple-600 rounded-3xl w-fit mx-auto animate-pulse">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-slate-900">
                                Generating Financial Insights...
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Fetching records and calculating aggregations
                            </p>
                        </div>
                    </div>
                )}

                {/* RESULTS VIEW */}
                {step === "RESULTS" && executionResult && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[11px] font-extrabold uppercase">
                                    Results
                                </span>
                                <span className="text-xs font-bold text-slate-700">
                                    {executionResult.transactionCount} transaction{executionResult.transactionCount === 1 ? "" : "s"} found
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep("CONFIRMATION")}
                                className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline transition-all cursor-pointer"
                            >
                                Edit Question
                            </button>
                        </div>

                        {/* Visual & Statistical Results */}
                        <QueryResult result={executionResult} />

                        {/* Continuous Follow-up Exploration */}
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

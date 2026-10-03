import { Bot, Sparkles, Compass, CheckCircle2 } from "lucide-react";

export const AIDirectionSection = () => {
    return (
        <section className="py-16 sm:py-24 bg-white border-t border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    {/* Left: Copy & Direction */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                                Coming Next
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-extrabold uppercase tracking-wide">
                                AI Beta
                            </span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            A more intelligent way to explore your money.
                        </h2>

                        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                            Finance One is experimenting with different AI approaches to make financial questions easier to ask and understand.
                        </p>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                                <span className="text-xs font-semibold text-slate-700">
                                    Natural language intent classification structured into deterministic queries.
                                </span>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                                <span className="text-xs font-semibold text-slate-700">
                                    Zero statistical hallucination — calculations run on real PostgreSQL ledger records.
                                </span>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                                <span className="text-xs font-semibold text-slate-700">
                                    Visual follow-up suggestions to drill into trends, peaks, and breakdowns.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Clean Intent Architecture Visualization Card */}
                    <div className="lg:col-span-6">
                        <div className="p-6 sm:p-7 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-xs space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                                <div className="flex items-center gap-2">
                                    <Bot className="w-4 h-4 text-purple-600" />
                                    <span className="text-xs font-bold text-slate-900">
                                        Exploration Pipeline
                                    </span>
                                </div>
                                <span className="text-[10px] font-extrabold text-purple-700 uppercase bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                                    Deterministic Foundation
                                </span>
                            </div>

                            {/* Step 1: User prompt */}
                            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    1. Natural Question
                                </span>
                                <p className="text-xs font-semibold text-slate-800 italic">
                                    "How much did I spend on dining out last month?"
                                </p>
                            </div>

                            {/* Arrow */}
                            <div className="flex justify-center text-slate-300">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                            </div>

                            {/* Step 2: Structured Query */}
                            <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200/80 shadow-2xs space-y-1">
                                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                                    2. Structured Contract
                                </span>
                                <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                                    <span className="px-2 py-0.5 rounded-md bg-white border border-purple-200 text-purple-900">
                                        Category: FOOD
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-white border border-purple-200 text-purple-900">
                                        Period: LAST_MONTH
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-white border border-purple-200 text-purple-900">
                                        View: DAILY_CHART
                                    </span>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex justify-center text-slate-300">
                                <Compass className="w-4 h-4 text-indigo-400" />
                            </div>

                            {/* Step 3: Verified Output */}
                            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    3. Exact Financial Result
                                </span>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-700">Total Food Spent:</span>
                                    <span className="font-black text-slate-900 text-sm">₹6,420</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AIDirectionSection;

import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { CategorySpendSummary, CategoryDeltaSummary } from "../../types/insights.types";
import { CATEGORY_METADATA } from "../../constants/category.constants";

interface CategoryInsightsSectionProps {
    topCategories: CategorySpendSummary[];
    categoryDeltas: {
        increases: CategoryDeltaSummary[];
        decreases: CategoryDeltaSummary[];
    };
    explanation: string;
}

export const CategoryInsightsSection: React.FC<CategoryInsightsSectionProps> = ({
    topCategories,
    categoryDeltas,
    explanation,
}) => {
    const [deltaTab, setDeltaTab] = useState<"increases" | "decreases">("increases");

    const activeDeltas = deltaTab === "increases" ? categoryDeltas.increases : categoryDeltas.decreases;

    return (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Top Categories Allocation */}
            <div className="lg:col-span-6 p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                Top Spending Categories
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Ranked by total expenditure for the selected month
                            </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {topCategories.length} Active Categories
                        </span>
                    </div>

                    {topCategories.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                            No categorized spending recorded for this month.
                        </div>
                    ) : (
                        <div className="space-y-3 pt-1">
                            {topCategories.slice(0, 5).map((cat, index) => {
                                const meta = CATEGORY_METADATA[cat.category];
                                return (
                                    <div key={cat.category} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 text-center text-slate-400 font-bold">
                                                    #{index + 1}
                                                </span>
                                                <span className="text-base">{meta?.icon ?? "🏷️"}</span>
                                                <span className="font-semibold text-slate-800">
                                                    {cat.displayName}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    ({cat.transactionCount} tx)
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">
                                                    {cat.amount.toLocaleString("en-US", {
                                                        style: "currency",
                                                        currency: "USD",
                                                    })}
                                                </span>
                                                <span className="text-[11px] font-semibold text-slate-500 w-12 text-right">
                                                    {cat.percentage}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                                                style={{ width: `${Math.min(100, Math.max(0, cat.percentage))}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                    {explanation}
                </div>
            </div>

            {/* Category Increases & Decreases Comparison */}
            <div className="lg:col-span-6 p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                Category Shifts vs Prior Month
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Month-over-month category spending changes
                            </p>
                        </div>
                        {/* Tab Toggle */}
                        <div className="flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/60">
                            <button
                                type="button"
                                onClick={() => setDeltaTab("increases")}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                    deltaTab === "increases"
                                        ? "bg-white text-rose-700 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Increases ({categoryDeltas.increases.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeltaTab("decreases")}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                    deltaTab === "decreases"
                                        ? "bg-white text-emerald-700 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Reductions ({categoryDeltas.decreases.length})
                            </button>
                        </div>
                    </div>

                    {activeDeltas.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                            No category spending {deltaTab === "increases" ? "increases" : "reductions"} detected for this period.
                        </div>
                    ) : (
                        <div className="space-y-2.5 pt-1">
                            {activeDeltas.slice(0, 5).map((d) => {
                                const meta = CATEGORY_METADATA[d.category];
                                const isIncrease = d.deltaAmount > 0;
                                return (
                                    <div
                                        key={d.category}
                                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{meta?.icon ?? "🏷️"}</span>
                                            <div>
                                                <span className="text-xs font-semibold text-slate-800 block">
                                                    {d.displayName}
                                                </span>
                                                <span className="text-[10px] text-slate-400 block">
                                                    Prior: ${d.previousAmount.toFixed(2)} → Current: ${d.currentAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span
                                                className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                                                    isIncrease ? "text-rose-600" : "text-emerald-600"
                                                }`}
                                            >
                                                {isIncrease ? (
                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                ) : (
                                                    <ArrowDownRight className="w-3.5 h-3.5" />
                                                )}
                                                {isIncrease ? "+" : ""}
                                                ${Math.abs(d.deltaAmount).toFixed(2)}
                                            </span>
                                            <span className="block text-[10px] text-slate-400 font-medium">
                                                {d.trend === "NEW"
                                                    ? "New Category"
                                                    : d.trend === "DROPPED"
                                                    ? "Zeroed out"
                                                    : d.percentageChange !== null
                                                    ? `${d.percentageChange > 0 ? "+" : ""}${d.percentageChange}%`
                                                    : "Unchanged"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                    Tracking changes against equivalent prior calendar month boundaries.
                </div>
            </div>
        </section>
    );
};

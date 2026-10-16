import React from "react";
import { TrendingUp, TrendingDown, Minus, Info, Zap } from "lucide-react";
import type { MonthlyInsightsResponse } from "../../types/insights.types";

interface MoMComparisonCardProps {
    insights: MonthlyInsightsResponse;
}

export const MoMComparisonCard: React.FC<MoMComparisonCardProps> = ({ insights }) => {
    const { summary, momComparison, period, comparisonPeriod, hasData, hasComparisonData } =
        insights;

    const renderDirectionBadge = () => {
        if (!hasData) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    <Minus className="w-3.5 h-3.5" /> No Spend
                </span>
            );
        }

        if (!hasComparisonData) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                    <Info className="w-3.5 h-3.5" /> First Recorded Month
                </span>
            );
        }

        if (momComparison.direction === "INCREASED") {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{Math.abs(momComparison.deltaAmount).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                    })}{" "}
                    (+{momComparison.percentageChange ?? 0}%)
                </span>
            );
        }

        if (momComparison.direction === "DECREASED") {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    <TrendingDown className="w-3.5 h-3.5" />
                    -{Math.abs(momComparison.deltaAmount).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                    })}{" "}
                    ({momComparison.percentageChange ?? 0}%)
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                <Minus className="w-3.5 h-3.5" /> Unchanged (0.0%)
            </span>
        );
    };

    return (
        <article className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Month-Over-Month Comparison
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        {summary.totalSpent.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                        })}
                    </h3>
                </div>
                <div>{renderDirectionBadge()}</div>
            </div>

            {/* Spend Pacing & Velocity Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Daily Average Spend
                    </div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                        {summary.dailyAverageSpend.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                        })}
                        <span className="text-xs font-normal text-slate-500">/day</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                        Over {period.daysElapsed} of {period.daysInMonth} days
                    </div>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        {comparisonPeriod.monthLabel} Spend
                    </div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                        {momComparison.previousTotal.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                        })}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                        {momComparison.spendVelocity.previousDailyAverage > 0
                            ? `$${momComparison.spendVelocity.previousDailyAverage.toFixed(2)}/day average`
                            : "No prior transactions"}
                    </div>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        <Zap className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Spend Pacing</span>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                        {summary.projectedMonthEndSpend !== null
                            ? summary.projectedMonthEndSpend.toLocaleString("en-US", {
                                  style: "currency",
                                  currency: "USD",
                              })
                            : summary.totalSpent.toLocaleString("en-US", {
                                  style: "currency",
                                  currency: "USD",
                              })}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                        {period.isCurrentMonth && period.daysElapsed < period.daysInMonth
                            ? `Projected pace for ${period.daysInMonth} days`
                            : `Full month completed`}
                    </div>
                </div>
            </div>

            {/* Deterministic Explanation Box */}
            <div className="flex items-start gap-2.5 p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100/80 text-xs text-indigo-950">
                <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">{momComparison.explanation}</p>
            </div>
        </article>
    );
};

import React from "react";
import { Lightbulb, PiggyBank, RefreshCw, Flame, PieChart, ShieldAlert } from "lucide-react";
import type { SavingsOpportunity } from "../../types/insights.types";

interface SavingsOpportunitiesListProps {
    opportunities: SavingsOpportunity[];
}

const OPPORTUNITY_ICONS = {
    SUBSCRIPTION: RefreshCw,
    LUXURY_SURGE: Flame,
    CATEGORY_SURGE: PieChart,
    HIGH_CONCENTRATION: PiggyBank,
    UNCLASSIFIED_REVIEW: ShieldAlert,
};

export const SavingsOpportunitiesList: React.FC<SavingsOpportunitiesListProps> = ({
    opportunities,
}) => {
    return (
        <article className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
                            <Lightbulb className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">
                            Deterministic Savings Opportunities
                        </h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                        Algorithmic suggestions grounded strictly in your verified transaction data
                    </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                    Transparent rule-based heuristics • No generative AI
                </span>
            </div>

            {opportunities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                    No immediate savings triggers identified for this month's spending patterns.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {opportunities.map((opp) => {
                        const Icon = OPPORTUNITY_ICONS[opp.type] || Lightbulb;
                        return (
                            <div
                                key={opp.id}
                                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-3.5 hover:border-slate-300 transition-colors"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-xs font-bold text-slate-900">
                                                {opp.title}
                                            </h4>
                                        </div>
                                        {opp.potentialSavings !== null && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                ~${opp.potentialSavings.toFixed(2)}/mo potential
                                            </span>
                                        )}
                                    </div>

                                    {/* Measured Fact */}
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                                                Measured Fact
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                            {opp.fact}
                                        </p>
                                    </div>

                                    {/* Actionable Suggestion */}
                                    <div className="space-y-1 pt-1 border-t border-slate-200/60">
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                                Suggestion
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                            {opp.suggestion}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </article>
    );
};

import React from "react";
import { Database, CheckCircle2, XCircle } from "lucide-react";
import type { MonthlyInsightsResponse } from "../../types/insights.types";

interface DataProvenanceCardProps {
    insights: MonthlyInsightsResponse;
}

export const DataProvenanceCard: React.FC<DataProvenanceCardProps> = ({ insights }) => {
    const { provenance, period, comparisonPeriod } = insights;

    return (
        <article className="p-5 sm:p-6 bg-slate-50/80 rounded-3xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Data Provenance & Calculation Transparency
                </h4>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
                All insights on this page are produced deterministically from {provenance.source} using {provenance.calculationMethod.toLowerCase()}.
                No third-party large language models or external predictions are involved.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                        Evaluation Windows
                    </span>
                    <span className="font-semibold text-slate-800 block">
                        {period.monthLabel}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                        {period.startDate.split("T")[0]} to {period.endDate.split("T")[0]} (UTC)
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                        Prior: {comparisonPeriod.startDate.split("T")[0]} to {comparisonPeriod.endDate.split("T")[0]}
                    </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                        Records Included
                    </span>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Confirmed Outgoing Expenses</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                        Categorized debit transactions across all 11 FinOne taxonomy classes.
                    </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                        Records Excluded
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Non-Expense Records</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                        Income, deposits, credits, internal transfers, and statement balance summaries.
                    </span>
                </div>
            </div>
        </article>
    );
};

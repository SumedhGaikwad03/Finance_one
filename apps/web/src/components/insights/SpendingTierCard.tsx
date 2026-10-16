import React from "react";
import { ShieldCheck, Sparkles, HelpCircle } from "lucide-react";
import type { SpendingTierBreakdown } from "../../types/insights.types";

interface SpendingTierCardProps {
    tierBreakdown: SpendingTierBreakdown;
}

export const SpendingTierCard: React.FC<SpendingTierCardProps> = ({
    tierBreakdown,
}) => {
    const { essential, discretionary, unclassified, discretionaryToEssentialRatio, explanation } =
        tierBreakdown;

    return (
        <article className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        Essential vs. Discretionary Allocation
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                        Deterministic breakdown by FinOne spending tiers
                    </p>
                </div>
                {discretionaryToEssentialRatio !== null && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                        <span>Discretionary / Essential Ratio:</span>
                        <span className="font-bold">{discretionaryToEssentialRatio}x</span>
                    </div>
                )}
            </div>

            {/* Segmented Progress Bar */}
            <div className="space-y-1.5">
                <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                    {essential.percentage > 0 && (
                        <div
                            className="h-full bg-slate-800 transition-all duration-300"
                            style={{ width: `${essential.percentage}%` }}
                            title={`Essential: ${essential.percentage}%`}
                        />
                    )}
                    {discretionary.goodToHavePercentage > 0 && (
                        <div
                            className="h-full bg-indigo-600 transition-all duration-300"
                            style={{ width: `${discretionary.goodToHavePercentage}%` }}
                            title={`Good to Have: ${discretionary.goodToHavePercentage}%`}
                        />
                    )}
                    {discretionary.luxuryPercentage > 0 && (
                        <div
                            className="h-full bg-purple-600 transition-all duration-300"
                            style={{ width: `${discretionary.luxuryPercentage}%` }}
                            title={`Luxury: ${discretionary.luxuryPercentage}%`}
                        />
                    )}
                    {unclassified.percentage > 0 && (
                        <div
                            className="h-full bg-amber-400 transition-all duration-300"
                            style={{ width: `${unclassified.percentage}%` }}
                            title={`Unclassified: ${unclassified.percentage}%`}
                        />
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500 pt-0.5">
                    <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-800" /> Essential ({essential.percentage}%)
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Comfort ({discretionary.goodToHavePercentage}%)
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Luxury ({discretionary.luxuryPercentage}%)
                    </span>
                    {unclassified.percentage > 0 && (
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Unclassified ({unclassified.percentage}%)
                        </span>
                    )}
                </div>
            </div>

            {/* Spending Tier Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {/* 1. Essential Needs */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-slate-200 text-slate-800">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-900">
                                Essential Needs
                            </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                            {essential.percentage}%
                        </span>
                    </div>

                    <div className="text-lg font-bold text-slate-900">
                        {essential.amount.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                        })}
                    </div>
                    <div className="text-[11px] text-slate-500">
                        {essential.transactionCount} core living transactions (groceries, rent, utilities, transit).
                    </div>
                </div>

                {/* 2. Discretionary Spending */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-indigo-950">
                                Discretionary
                            </span>
                        </div>
                        <span className="text-[11px] font-semibold text-indigo-700">
                            {discretionary.percentage}%
                        </span>
                    </div>

                    <div className="text-lg font-bold text-indigo-950">
                        {discretionary.totalAmount.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                        })}
                    </div>
                    <div className="text-[11px] text-indigo-900/80 space-y-0.5">
                        <div className="flex justify-between">
                            <span>Good to Have (Comfort):</span>
                            <span className="font-semibold">${discretionary.goodToHaveAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Luxury (Premium):</span>
                            <span className="font-semibold">${discretionary.luxuryAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Unclassified Isolation Card */}
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                                <HelpCircle className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-amber-950">
                                Unclassified
                            </span>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-700">
                            {unclassified.percentage}%
                        </span>
                    </div>

                    <div className="text-lg font-bold text-amber-950">
                        {unclassified.amount.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                        })}
                    </div>
                    <div className="text-[11px] text-amber-900/80">
                        {unclassified.transactionCount > 0
                            ? `${unclassified.transactionCount} transactions pending spending tier assignment.`
                            : "All transactions classified into spending tiers."}
                    </div>
                </div>
            </div>

            {/* Explanation / Transparency Callout */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-600 font-medium">
                {explanation}
            </div>
        </article>
    );
};

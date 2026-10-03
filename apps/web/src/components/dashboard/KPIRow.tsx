import { useMemo } from "react";
import type { TransactionCategory } from "../../types/dashboard.types";
import { CATEGORY_METADATA } from "../query/CategorySelector";

interface KPIRowProps {
    transactionCount: number;
    totalSpent: string;
    categoryTotals: Record<string, string>;
}

const KPIRow = ({
    transactionCount,
    totalSpent,
    categoryTotals,
}: KPIRowProps) => {
    const totalSpentNumber = Number(totalSpent) || 0;

    // Derived metric: Average Transaction Spend
    const averageSpend = useMemo(() => {
        if (transactionCount <= 0 || totalSpentNumber <= 0) return 0;
        return Math.round(totalSpentNumber / transactionCount);
    }, [transactionCount, totalSpentNumber]);

    // Derived metric: Top Spending Category
    const topCategory = useMemo(() => {
        const entries = Object.entries(categoryTotals);
        if (entries.length === 0) return null;

        let maxCat = "";
        let maxAmount = 0;

        for (const [cat, amt] of entries) {
            const num = Number(amt) || 0;
            if (num > maxAmount) {
                maxAmount = num;
                maxCat = cat;
            }
        }

        if (maxAmount <= 0) return null;

        const meta = CATEGORY_METADATA[maxCat as TransactionCategory];
        return {
            category: maxCat,
            label: meta?.label ?? maxCat,
            icon: meta?.icon ?? "🏷️",
            amount: maxAmount,
        };
    }, [categoryTotals]);

    return (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5" aria-label="Key Performance Indicators">
            {/* KPI 1: Total Transactions */}
            <article className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Total Transactions
                </span>
                <div className="flex items-baseline gap-2">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900">
                        {transactionCount}
                    </p>
                    <span className="text-xs text-slate-400 font-medium">
                        logged
                    </span>
                </div>
            </article>

            {/* KPI 2: Average Spend */}
            <article className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Average / Transaction
                </span>
                <div className="flex items-baseline gap-2">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900">
                        ₹{averageSpend.toLocaleString()}
                    </p>
                    <span className="text-xs text-slate-400 font-medium">
                        avg ticket
                    </span>
                </div>
            </article>

            {/* KPI 3: Top Category */}
            <article className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Top Spending Area
                </span>
                {topCategory ? (
                    <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base" aria-hidden="true">
                                {topCategory.icon}
                            </span>
                            <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                {topCategory.label}
                            </p>
                        </div>
                        <span className="text-xs font-semibold text-purple-700 shrink-0">
                            ₹{topCategory.amount.toLocaleString()}
                        </span>
                    </div>
                ) : (
                    <p className="text-xs text-slate-400 font-medium pt-1">
                        No category data yet
                    </p>
                )}
            </article>
        </section>
    );
};

export default KPIRow;

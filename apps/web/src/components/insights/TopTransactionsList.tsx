import React from "react";
import type { TopTransactionItem } from "../../types/insights.types";
import { CATEGORY_METADATA } from "../../constants/category.constants";

interface TopTransactionsListProps {
    transactions: TopTransactionItem[];
}

const PRIORITY_BADGES = {
    ESSENTIAL: "bg-slate-100 text-slate-800",
    GOOD_TO_HAVE: "bg-indigo-50 text-indigo-700",
    LUXURY: "bg-purple-50 text-purple-700",
    UNCLASSIFIED: "bg-amber-50 text-amber-700",
};

export const TopTransactionsList: React.FC<TopTransactionsListProps> = ({
    transactions,
}) => {
    return (
        <article className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        Largest Expenses
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                        Top single outlays during the selected month
                    </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    Top {transactions.length} Purchases
                </span>
            </div>

            {transactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                    No transactions recorded for this period.
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {transactions.map((tx, idx) => {
                        const meta = CATEGORY_METADATA[tx.category];
                        const dateFormatted = new Date(tx.transactionDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        });

                        return (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between py-3 hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
                                        #{idx + 1}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-900">
                                                {tx.title || "Untitled Expense"}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                                    PRIORITY_BADGES[tx.priority]
                                                }`}
                                            >
                                                {tx.priority}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                            <span>
                                                {meta?.icon ?? "🏷️"} {meta?.label ?? tx.category}
                                            </span>
                                            <span>•</span>
                                            <span>{dateFormatted}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-900">
                                        {tx.amount.toLocaleString("en-US", {
                                            style: "currency",
                                            currency: "USD",
                                        })}
                                    </div>
                                    <div className="text-[11px] font-medium text-slate-400">
                                        {tx.percentageOfTotal}% of month
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

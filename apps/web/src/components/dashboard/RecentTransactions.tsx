import type { Transaction, TransactionCategory } from "../../types/dashboard.types";
import { CATEGORY_METADATA } from "../query/CategorySelector";

type RecentTransactionsProps = {
    transactions: Transaction[];
    onViewAll: () => void;
};

const RecentTransactions = ({
    transactions,
    onViewAll,
}: RecentTransactionsProps) => {
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return "Today";
            if (diffDays === 1) return "Yesterday";
            if (diffDays < 7) {
                return date.toLocaleDateString("en-US", { weekday: "short" });
            }
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } catch {
            return dateString;
        }
    };

    return (
        <article className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        Recent Activity
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                        Latest transactions across all accounts
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onViewAll}
                    className="btn-interactive text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
                >
                    View all →
                </button>
            </header>

            {transactions.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                    <p className="text-xs text-slate-400 font-medium">
                        No recent transactions recorded yet.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {transactions.slice(0, 5).map((tx) => {
                        const meta = CATEGORY_METADATA[tx.category as TransactionCategory];
                        const icon = meta?.icon ?? "💳";
                        const categoryLabel = meta?.label ?? tx.category;

                        return (
                            <div
                                key={tx.id}
                                className="py-3 px-2 -mx-2 hover:bg-slate-50/70 rounded-xl transition-colors flex items-center justify-between gap-3 first:pt-1 last:pb-1"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-base shrink-0">
                                        {icon}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                            {tx.title || "Untitled Transaction"}
                                        </h3>
                                        <p className="text-[11px] text-slate-500 truncate">
                                            {categoryLabel} · {formatDate(tx.transactionDate)}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                                        ₹{Number(tx.amount).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </article>
    );
};

export default RecentTransactions;
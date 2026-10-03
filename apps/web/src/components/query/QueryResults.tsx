import type { Transaction } from "../../types/dashboard.types";
import TransactionCard from "../transaction/TransactionCard";

interface QueryResultsProps {
    transactions: Transaction[];
    isLoading: boolean;
    isError: boolean;
    error?: Error | null;
    onRetry: () => void;
    onResetQuery: () => void;
    onEditTransaction: (tx: Transaction) => void;
    onDeleteTransaction: (id: number) => void;
    isDeleting?: boolean;
    summaryDescription?: string;
}

const QueryResults = ({
    transactions,
    isLoading,
    isError,
    onRetry,
    onResetQuery,
    onEditTransaction,
    onDeleteTransaction,
    isDeleting,
    summaryDescription,
}: QueryResultsProps) => {
    if (isLoading) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="inline-block w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-600">
                    Executing query against your ledger...
                </p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-red-200 shadow-sm space-y-3">
                <div className="text-2xl">⚠️</div>
                <h3 className="text-base font-semibold text-slate-800">
                    We couldn&apos;t retrieve those transactions
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                    There was an issue processing your query. Please verify your connection or try again.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={onRetry}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition-colors cursor-pointer"
                    >
                        Try Again
                    </button>
                    <button
                        type="button"
                        onClick={onResetQuery}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>
        );
    }

    const totalAmount = transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    return (
        <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div>
                    <h3 className="text-sm font-bold text-slate-800">
                        Query Results ({transactions.length})
                    </h3>
                    {summaryDescription && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {summaryDescription}
                        </p>
                    )}
                </div>
                {transactions.length > 0 && (
                    <div className="text-left sm:text-right">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                            Total Matching Spend
                        </span>
                        <span className="text-base font-extrabold text-slate-900">
                            ₹{totalAmount.toLocaleString()}
                        </span>
                    </div>
                )}
            </div>

            {transactions.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="text-3xl" aria-hidden="true">
                        🔍
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                        No transactions found
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        No transactions matched your specified criteria. Try broadening your category, date range, or spending limits.
                    </p>
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={onResetQuery}
                            className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
                        >
                            Reset All Filters
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {transactions.map((transaction) => (
                        <TransactionCard
                            key={transaction.id}
                            transaction={transaction}
                            onEdit={onEditTransaction}
                            onDelete={onDeleteTransaction}
                            isDeleting={isDeleting}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default QueryResults;

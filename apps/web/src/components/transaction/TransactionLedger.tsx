import { ReceiptText, Plus, FilterX } from "lucide-react";
import type { Transaction } from "../../types/dashboard.types";
import TransactionRow from "./TransactionRow";
import TransactionCard from "./TransactionCard";

interface TransactionLedgerProps {
    transactions: Transaction[];
    totalCount: number;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
    onAddTransaction: () => void;
    onEdit: (transaction: Transaction) => void;
    onDelete: (transaction: Transaction) => void;
    isDeleting?: boolean;
}

const TransactionLedger = ({
    transactions,
    totalCount,
    hasActiveFilters,
    onClearFilters,
    onAddTransaction,
    onEdit,
    onDelete,
    isDeleting = false,
}: TransactionLedgerProps) => {
    // 1. Overall Empty State (no transactions in database)
    if (totalCount === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
                    <ReceiptText className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                    <h3 className="text-base font-bold text-slate-900">
                        No transactions recorded yet
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Start tracking your daily expenses and payments by logging your first transaction.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onAddTransaction}
                    className="btn-interactive inline-flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-purple-200 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Add First Transaction
                </button>
            </div>
        );
    }

    // 2. Filter Empty State (filters returned 0 results)
    if (transactions.length === 0 && hasActiveFilters) {
        return (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="p-3 bg-slate-100 text-slate-500 rounded-2xl">
                    <FilterX className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-xs">
                    <h3 className="text-sm font-bold text-slate-900">
                        No matching transactions
                    </h3>
                    <p className="text-xs text-slate-500">
                        No records match your search or filter criteria. Try adjusting or clearing your filters.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClearFilters}
                    className="btn-interactive px-4 py-2 text-xs font-semibold text-purple-700 hover:text-purple-800 hover:bg-purple-50 rounded-xl border border-purple-200 transition-colors cursor-pointer"
                >
                    Clear All Filters
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Desktop View: Ledger Table */}
            <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-200/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th scope="col" className="py-3 px-4">Date</th>
                                <th scope="col" className="py-3 px-4">Transaction</th>
                                <th scope="col" className="py-3 px-4">Category</th>
                                <th scope="col" className="py-3 px-4">Priority</th>
                                <th scope="col" className="py-3 px-4 text-right">Amount</th>
                                <th scope="col" className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.map((tx) => (
                                <TransactionRow
                                    key={tx.id}
                                    transaction={tx}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    isDeleting={isDeleting}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View: Cards List */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
                {transactions.map((tx) => (
                    <TransactionCard
                        key={tx.id}
                        transaction={tx}
                        onEdit={onEdit}
                        onDelete={(id) => {
                            const found = transactions.find((t) => t.id === id);
                            if (found) onDelete(found);
                        }}
                        isDeleting={isDeleting}
                    />
                ))}
            </div>
        </div>
    );
};

export default TransactionLedger;

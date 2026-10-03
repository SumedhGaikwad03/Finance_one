import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, PiggyBank, Compass } from "lucide-react";

interface TransactionsHeaderProps {
    onAddTransaction: () => void;
    onToggleExplorer?: () => void;
    isExplorerOpen?: boolean;
}

const TransactionsHeader = ({
    onAddTransaction,
    onToggleExplorer,
    isExplorerOpen = false,
}: TransactionsHeaderProps) => {
    const navigate = useNavigate();

    return (
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold">
                        1
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">
                        Finance One • Ledger
                    </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Transactions
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Manage your transactions and keep track of your spending.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
                <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="btn-interactive inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer shadow-xs"
                >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                    Dashboard
                </button>

                <button
                    type="button"
                    onClick={() => navigate("/budgets")}
                    className="btn-interactive inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer shadow-xs"
                >
                    <PiggyBank className="w-3.5 h-3.5 text-slate-500" />
                    Budgets
                </button>

                {onToggleExplorer && (
                    <button
                        type="button"
                        onClick={onToggleExplorer}
                        className={`btn-interactive inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer shadow-xs ${
                            isExplorerOpen
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                        }`}
                    >
                        <Compass className="w-3.5 h-3.5 text-purple-600" />
                        <span>Query Explorer</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={onAddTransaction}
                    className="btn-interactive inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-sm shadow-purple-200 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Add Transaction
                </button>
            </div>
        </header>
    );
};

export default TransactionsHeader;

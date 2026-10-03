import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, ArrowRightLeft } from "lucide-react";

interface BudgetsHeaderProps {
    onAddBudget: () => void;
}

const BudgetsHeader = ({ onAddBudget }: BudgetsHeaderProps) => {
    const navigate = useNavigate();

    return (
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold">
                        1
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">
                        Finance One • Budgets
                    </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Budget Workspace
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Manage your spending limits, track active periods, and keep your finances on track.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
                <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                    Dashboard
                </button>

                <button
                    type="button"
                    onClick={() => navigate("/transactions")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                    Transactions
                </button>

                <button
                    type="button"
                    onClick={onAddBudget}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl transition-all shadow-sm shadow-purple-200 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Add Budget
                </button>
            </div>
        </header>
    );
};

export default BudgetsHeader;

import { Edit2, Lock, Trash2, Calendar, CheckCircle2 } from "lucide-react";
import type { Budget } from "../../types/budget.types";
import {
    formatBudgetPeriodDateRange,
    isBudgetActive,
} from "../../utils/budgetDateHelpers";

interface BudgetCardProps {
    budget: Budget;
    onEdit: (budget: Budget) => void;
    onLock: (id: number) => void;
    onDelete: (id: number) => void;
}

const BudgetCard = ({
    budget,
    onEdit,
    onLock,
    onDelete,
}: BudgetCardProps) => {
    const isLocked = budget.isLocked;
    const isActive = isBudgetActive(budget.startDate, budget.periodType);
    const dateRange = formatBudgetPeriodDateRange(
        budget.startDate,
        budget.periodType
    );
    const amountNumber = Number(budget.amount) || 0;

    return (
        <article
            className={`relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl border transition-all duration-200 ${
                isActive
                    ? "bg-white border-purple-200 shadow-xs ring-1 ring-purple-100"
                    : isLocked
                    ? "bg-slate-50/70 border-slate-200"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
        >
            <div className="space-y-4">
                {/* Header: Period & Status Pills */}
                <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {budget.periodType}
                    </span>

                    <div className="flex items-center gap-1.5">
                        {isActive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Active
                            </span>
                        )}

                        {isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <Lock className="w-3 h-3 text-amber-600" />
                                Locked
                            </span>
                        ) : (
                            !isActive && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                                    Flexible
                                </span>
                            )
                        )}
                    </div>
                </div>

                {/* Amount */}
                <div>
                    <p className="text-xs text-slate-400 font-medium">Budget Limit</p>
                    <p className="text-2xl font-bold tracking-tight text-slate-900">
                        ₹{amountNumber.toLocaleString()}
                    </p>
                </div>

                {/* Date range */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{dateRange}</span>
                </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center justify-end gap-1.5 pt-5 mt-4 border-t border-slate-100">
                {!isLocked ? (
                    <>
                        <button
                            type="button"
                            onClick={() => onEdit(budget)}
                            aria-label={`Edit budget for ${budget.periodType}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => onLock(budget.id)}
                            aria-label={`Lock budget for ${budget.periodType}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Lock</span>
                        </button>
                    </>
                ) : (
                    <span className="text-[11px] text-slate-400 italic mr-auto">
                        Finalized
                    </span>
                )}

                <button
                    type="button"
                    onClick={() => onDelete(budget.id)}
                    aria-label={`Delete budget for ${budget.periodType}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                </button>
            </div>
        </article>
    );
};

export default BudgetCard;
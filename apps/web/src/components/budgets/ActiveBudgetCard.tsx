import { Edit2, Lock, ShieldCheck, Calendar, Sparkles } from "lucide-react";
import type { Budget } from "../../types/budget.types";
import {
    formatBudgetPeriodDateRange,
    getDaysRemainingInBudget,
} from "../../utils/budgetDateHelpers";
import { formatPercentage, clampPercentage } from "../../utils/formatters";

interface ActiveBudgetCardProps {
    activeBudget: Budget | null;
    totalSpent?: string;
    remainingBudget?: string | null;
    budgetUsage?: number | null;
    onEdit: (budget: Budget) => void;
    onLock: (id: number) => void;
    onCreateClick: () => void;
}

const ActiveBudgetCard = ({
    activeBudget,
    totalSpent = "0",
    remainingBudget = null,
    budgetUsage = null,
    onEdit,
    onLock,
    onCreateClick,
}: ActiveBudgetCardProps) => {
    if (!activeBudget) {
        return (
            <div className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-sm border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-lg">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 text-purple-200 border border-white/10">
                                <Sparkles className="w-3 h-3 text-purple-300" />
                                Active Budget Status
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                            No Active Budget for Current Date
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Create a budget starting today or view your scheduled budgets below to maintain real-time spending control.
                        </p>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={onCreateClick}
                            className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                            + Create Active Budget
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const budgetAmount = Number(activeBudget.amount) || 0;
    const spentNumber = Number(totalSpent) || 0;
    const remainingNumber =
        remainingBudget !== null
            ? Number(remainingBudget)
            : Math.max(budgetAmount - spentNumber, 0);

    // Keep raw unrounded value for precision & progress calculation
    const usageNumber =
        budgetUsage !== null
            ? Number(budgetUsage)
            : budgetAmount > 0
            ? (spentNumber / budgetAmount) * 100
            : 0;

    const isOverBudget = spentNumber > budgetAmount && budgetAmount > 0;
    const progressWidth = clampPercentage(usageNumber, 0, 100);
    const dateRange = formatBudgetPeriodDateRange(
        activeBudget.startDate,
        activeBudget.periodType
    );
    const daysRemaining = getDaysRemainingInBudget(
        activeBudget.startDate,
        activeBudget.periodType
    );

    return (
        <article className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-md border border-slate-800 space-y-6">
            {/* Ambient glow */}
            <div
                className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"
                aria-hidden="true"
            />

            {/* Header: Period, Active Pill, Days Remaining */}
            <div className="relative flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 text-purple-200 border border-white/10">
                        {activeBudget.periodType} BUDGET
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active Period
                    </span>

                    {activeBudget.isLocked && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Lock className="w-3 h-3" />
                            Locked
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dateRange}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-purple-300 font-semibold">
                        {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
                    </span>
                </div>
            </div>

            {/* Metrics Row: Amount, Spent, Remaining */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-1">
                <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-medium">Total Limit</p>
                    <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        ₹{budgetAmount.toLocaleString()}
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-medium">Total Spent</p>
                    <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-200">
                        ₹{spentNumber.toLocaleString()}
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-medium">
                        {isOverBudget ? "Over Budget By" : "Remaining"}
                    </p>
                    <p
                        className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                            isOverBudget ? "text-rose-400" : "text-emerald-400"
                        }`}
                    >
                        {isOverBudget
                            ? `₹${(spentNumber - budgetAmount).toLocaleString()}`
                            : `₹${remainingNumber.toLocaleString()}`}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Budget Consumption</span>
                    <span
                        className={`font-bold ${
                            isOverBudget
                                ? "text-rose-400"
                                : usageNumber > 80
                                ? "text-purple-300"
                                : "text-emerald-400"
                        }`}
                    >
                        {formatPercentage(usageNumber)} utilized
                    </span>
                </div>

                <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            isOverBudget
                                ? "bg-gradient-to-r from-amber-500 to-rose-500"
                                : usageNumber > 80
                                ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                                : "bg-gradient-to-r from-emerald-500 to-teal-400"
                        }`}
                        style={{ width: `${progressWidth}%` }}
                    />
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Real-time spending tracking active for this period</span>
                </div>

                <div className="flex items-center gap-2.5">
                    {!activeBudget.isLocked ? (
                        <>
                            <button
                                type="button"
                                onClick={() => onEdit(activeBudget)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all cursor-pointer"
                            >
                                <Edit2 className="w-3.5 h-3.5 text-purple-300" />
                                Edit Limit
                            </button>
                            <button
                                type="button"
                                onClick={() => onLock(activeBudget.id)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 border border-slate-700 hover:border-amber-500/30 rounded-xl transition-all cursor-pointer"
                            >
                                <Lock className="w-3.5 h-3.5" />
                                Lock Period
                            </button>
                        </>
                    ) : (
                        <span className="text-xs text-slate-400 italic">
                            Budget locked — values are finalized
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
};

export default ActiveBudgetCard;

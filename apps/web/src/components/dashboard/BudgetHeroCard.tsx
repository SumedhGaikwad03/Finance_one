import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Plus, Sparkles } from "lucide-react";
import type { Budget } from "../../types/dashboard.types";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { formatPercentage, clampPercentage } from "../../utils/formatters";

interface BudgetHeroCardProps {
    budget: Budget | null;
    totalSpent: string;
    remainingBudget: string | null;
    budgetUsage: number | null;
    onAddTransaction?: () => void;
}

const BudgetHeroCard = ({
    budget,
    totalSpent,
    remainingBudget,
    budgetUsage,
    onAddTransaction,
}: BudgetHeroCardProps) => {
    const navigate = useNavigate();
    const prefersReducedMotion = usePrefersReducedMotion();

    // Trigger smooth entrance transition for progress bar
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 60);
        return () => clearTimeout(timer);
    }, []);

    const spentNumber = Number(totalSpent) || 0;
    const budgetAmountNumber = budget ? Number(budget.amount) || 0 : 0;
    const remainingNumber =
        remainingBudget !== null
            ? Number(remainingBudget)
            : Math.max(budgetAmountNumber - spentNumber, 0);

    // Keep raw unrounded usage calculation for mathematical precision & progress bar
    const usageNumber =
        budgetUsage !== null
            ? Number(budgetUsage)
            : budgetAmountNumber > 0
            ? (spentNumber / budgetAmountNumber) * 100
            : 0;

    const isOverBudget = spentNumber > budgetAmountNumber && budgetAmountNumber > 0;
    const targetProgressWidth = clampPercentage(usageNumber, 0, 100);
    const displayedProgressWidth = prefersReducedMotion || isMounted ? targetProgressWidth : 0;

    const periodLabel = budget?.periodType
        ? `${budget.periodType} BUDGET`
        : "CURRENT PERIOD";

    const handleAddClick = () => {
        if (onAddTransaction) {
            onAddTransaction();
        } else {
            navigate("/transactions");
        }
    };

    if (!budget) {
        return (
            <article className="relative overflow-hidden p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-sm border border-slate-800/80 flex flex-col justify-between h-full">
                {/* Subtle ambient light */}
                <div
                    className="absolute -right-12 -top-12 w-48 h-48 bg-purple-600/10 rounded-full blur-2xl pointer-events-none"
                    aria-hidden="true"
                />

                <div className="space-y-3 max-w-lg">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 text-purple-200 border border-white/10">
                        <Sparkles className="w-3 h-3 text-purple-300" />
                        Budget Overview
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                        ₹{spentNumber.toLocaleString()} spent so far
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Set up an active budget to track target spending limits, visualize progress, and manage your monthly runway.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-6 mt-auto">
                    <button
                        type="button"
                        onClick={() => navigate("/budgets")}
                        className="btn-interactive inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Set Up Budget
                    </button>
                    <button
                        type="button"
                        onClick={handleAddClick}
                        className="btn-interactive inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                        <Plus className="w-4 h-4 text-slate-300" />
                        Add Transaction
                    </button>
                </div>
            </article>
        );
    }

    return (
        <article className="relative overflow-hidden p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-md border border-slate-800 space-y-5 flex flex-col justify-between h-full">
            {/* Ambient subtle glow */}
            <div
                className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"
                aria-hidden="true"
            />

            {/* Top row: Period and Usage Badge */}
            <div className="relative flex items-center justify-between">
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 text-purple-200 border border-white/10">
                    {periodLabel}
                </span>

                <div className="flex items-center gap-2">
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isOverBudget
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : usageNumber > 80
                                ? "bg-purple-500/20 text-purple-200 border border-purple-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                    >
                        {formatPercentage(usageNumber)} Used
                    </span>
                </div>
            </div>

            {/* Middle row: Big numbers */}
            <div className="relative flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            ₹{spentNumber.toLocaleString()}
                        </h2>
                        <span className="text-sm font-medium text-slate-300">
                            spent
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 font-medium">
                        of ₹{budgetAmountNumber.toLocaleString()} budget limit
                    </p>
                </div>

                <div className="sm:text-right pt-2 sm:pt-0">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        {isOverBudget ? "Over Budget By" : "Remaining Allowance"}
                    </span>
                    <span
                        className={`text-lg sm:text-xl font-bold ${
                            isOverBudget ? "text-amber-400" : "text-emerald-400"
                        }`}
                    >
                        ₹{Math.abs(remainingNumber).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Progress Track */}
            <div className="relative space-y-1.5">
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                            isOverBudget
                                ? "bg-gradient-to-r from-amber-400 to-rose-400"
                                : usageNumber > 80
                                ? "bg-gradient-to-r from-indigo-400 to-purple-400"
                                : "bg-gradient-to-r from-emerald-400 to-teal-300"
                        }`}
                        style={{ width: `${displayedProgressWidth}%` }}
                    />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>₹0</span>
                    <span>₹{budgetAmountNumber.toLocaleString()}</span>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="relative pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 mt-auto">
                <p className="text-xs text-slate-300">
                    {isOverBudget
                        ? "Allocated limit reached for this period."
                        : `You have ${formatPercentage(Math.max(100 - usageNumber, 0))} runway remaining.`}
                </p>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => navigate("/budgets")}
                        className="btn-interactive inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                        <span>Manage Budget</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                    <button
                        type="button"
                        onClick={handleAddClick}
                        className="btn-interactive inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5 text-slate-900" />
                        <span>Add Transaction</span>
                    </button>
                </div>
            </div>
        </article>
    );
};

export default BudgetHeroCard;

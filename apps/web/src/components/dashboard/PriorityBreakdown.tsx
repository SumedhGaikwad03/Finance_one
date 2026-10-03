import { useMemo } from "react";
import type { TransactionPriority } from "../../types/dashboard.types";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { formatPercentage, clampPercentage } from "../../utils/formatters";

interface PriorityBreakdownProps {
    priorityTotals: Record<string, string>;
    totalSpent: string;
}

const PRIORITY_META: Record<
    TransactionPriority,
    { label: string; tag: string; barColor: string; textColor: string }
> = {
    ESSENTIAL: {
        label: "Essential Needs",
        tag: "Core",
        barColor: "bg-slate-800",
        textColor: "text-slate-900",
    },
    GOOD_TO_HAVE: {
        label: "Good to Have",
        tag: "Comfort",
        barColor: "bg-indigo-600",
        textColor: "text-indigo-900",
    },
    LUXURY: {
        label: "Luxury Spending",
        tag: "Discretionary",
        barColor: "bg-purple-600",
        textColor: "text-purple-900",
    },
};

const PriorityBreakdown = ({
    priorityTotals,
    totalSpent,
}: PriorityBreakdownProps) => {
    const totalSpentNumber = Number(totalSpent) || 0;
    const prefersReducedMotion = usePrefersReducedMotion();

    const items = useMemo(() => {
        const priorities: TransactionPriority[] = ["ESSENTIAL", "GOOD_TO_HAVE", "LUXURY"];
        return priorities.map((pri) => {
            const amount = Number(priorityTotals[pri]) || 0;
            const percentage = totalSpentNumber > 0 ? (amount / totalSpentNumber) * 100 : 0;
            return {
                priority: pri,
                amount,
                percentage,
                ...PRIORITY_META[pri],
            };
        });
    }, [priorityTotals, totalSpentNumber]);

    return (
        <article className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        Spending Intent
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                        Allocation by financial priority
                    </p>
                </div>
            </header>

            <div className="space-y-4 pt-1">
                {items.map((item) => (
                    <div key={item.priority} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className={`font-semibold ${item.textColor}`}>
                                    {item.label}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                                    {item.tag}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-normal">
                                    {formatPercentage(item.percentage)}
                                </span>
                                <span className="font-bold text-slate-900">
                                    ₹{item.amount.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${item.barColor} ${
                                    prefersReducedMotion ? "" : "transition-all duration-700 ease-out"
                                }`}
                                style={{ width: `${clampPercentage(item.percentage, 0, 100)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </article>
    );
};

export default PriorityBreakdown;

import { useMemo, useState, useEffect } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import type { TransactionCategory } from "../../types/dashboard.types";
import { CATEGORY_METADATA } from "../query/CategorySelector";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { formatPercentage } from "../../utils/formatters";

interface CategoryDonutChartProps {
    categoryTotals: Record<string, string>;
    totalSpent: string;
}

const DONUT_PALETTE = [
    "#7c3aed", // deep violet
    "#6366f1", // indigo
    "#0d9488", // teal
    "#0284c7", // light blue
    "#f59e0b", // amber
    "#ea580c", // orange
    "#e11d48", // rose
    "#64748b", // slate
];

const CategoryDonutChart = ({
    categoryTotals,
    totalSpent,
}: CategoryDonutChartProps) => {
    const totalSpentNumber = Number(totalSpent) || 0;
    const prefersReducedMotion = usePrefersReducedMotion();

    const [showCenterLabel, setShowCenterLabel] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setShowCenterLabel(true), 250);
        return () => clearTimeout(timer);
    }, []);

    const chartData = useMemo(() => {
        const entries = Object.entries(categoryTotals)
            .map(([cat, amt]) => ({
                category: cat as TransactionCategory,
                label: CATEGORY_METADATA[cat as TransactionCategory]?.label ?? cat,
                icon: CATEGORY_METADATA[cat as TransactionCategory]?.icon ?? "🏷️",
                amount: Number(amt) || 0,
            }))
            .filter((item) => item.amount > 0)
            .sort((a, b) => b.amount - a.amount);

        const total = entries.reduce((acc, curr) => acc + curr.amount, 0);

        return entries.map((item, index) => ({
            ...item,
            percentage: total > 0 ? (item.amount / total) * 100 : 0,
            color: DONUT_PALETTE[index % DONUT_PALETTE.length],
        }));
    }, [categoryTotals]);

    // Format total spent for center badge (e.g. ₹2.5k or ₹850)
    const formattedCenterTotal = useMemo(() => {
        if (totalSpentNumber >= 100000) {
            return `₹${(totalSpentNumber / 100000).toFixed(1)}L`;
        }
        if (totalSpentNumber >= 1000) {
            return `₹${(totalSpentNumber / 1000).toFixed(1)}k`;
        }
        return `₹${totalSpentNumber.toLocaleString()}`;
    }, [totalSpentNumber]);

    return (
        <article className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-full space-y-4">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        Spending Breakdown
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                        Category distribution
                    </p>
                </div>
            </header>

            {chartData.length === 0 ? (
                <div className="py-12 text-center space-y-2 my-auto">
                    <p className="text-xs text-slate-400 font-medium">
                        No category spending recorded yet.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-between gap-4 pt-1 flex-1">
                    {/* Donut Chart with Center Label */}
                    <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="amount"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={72}
                                    paddingAngle={3}
                                    stroke="none"
                                    isAnimationActive={!prefersReducedMotion}
                                    animationDuration={750}
                                    animationEasing="ease-out"
                                >
                                    {chartData.map((entry) => (
                                        <Cell key={`cell-${entry.category}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: unknown) => [
                                        `₹${Number(value || 0).toLocaleString()}`,
                                        "Spent",
                                    ]}
                                    contentStyle={{
                                        backgroundColor: "#0f172a",
                                        borderRadius: "12px",
                                        border: "none",
                                        color: "#ffffff",
                                        fontSize: "12px",
                                        padding: "8px 12px",
                                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                    }}
                                    itemStyle={{ color: "#ffffff" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Value */}
                        <div
                            className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-500 ${
                                prefersReducedMotion || showCenterLabel
                                    ? "opacity-100 scale-100"
                                    : "opacity-0 scale-95"
                            }`}
                        >
                            <span className="text-base font-extrabold text-slate-900 tracking-tight">
                                {formattedCenterTotal}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Total Spent
                            </span>
                        </div>
                    </div>

                    {/* Concise Category Legend List */}
                    <div className="w-full space-y-2 max-h-48 overflow-y-auto pr-1">
                        {chartData.map((item, index) => (
                            <div
                                key={item.category}
                                className={`flex items-center justify-between text-xs transition-all duration-300 ${
                                    prefersReducedMotion || showCenterLabel
                                        ? "opacity-100 translate-y-0"
                                        : "opacity-0 translate-y-1"
                                }`}
                                style={{
                                    transitionDelay: prefersReducedMotion
                                        ? "0ms"
                                        : `${Math.min(index * 60, 300)}ms`,
                                }}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: item.color }}
                                        aria-hidden="true"
                                    />
                                    <span className="text-slate-700 font-medium truncate">
                                        {item.icon} {item.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-right shrink-0">
                                    <span className="text-slate-400 font-normal">
                                        {formatPercentage(item.percentage)}
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                        ₹{item.amount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </article>
    );
};

export default CategoryDonutChart;

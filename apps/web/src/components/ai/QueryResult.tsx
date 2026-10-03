import { useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { BarChart3, Table2, Info } from "lucide-react";
import type { QueryExecutionResult, VisualizationType } from "../../types/financeQuery.types";
import { formatPercentage } from "../../utils/formatters";
import { CategoryBadge, PriorityBadge } from "../transaction/TransactionBadge";
import { CATEGORY_METADATA } from "../query/CategorySelector";

interface QueryResultProps {
    result: QueryExecutionResult;
    onToggleVisualization?: (vis: VisualizationType) => void;
}

const PERIOD_LABELS: Record<string, string> = {
    THIS_MONTH: "This month",
    LAST_MONTH: "Last month",
    LAST_3_MONTHS: "Last 3 months",
    LAST_6_MONTHS: "Last 6 months",
    THIS_YEAR: "This year",
    LAST_7_DAYS: "This week",
    LAST_30_DAYS: "Last 30 days",
    ALL_TIME: "All time",
};

const VIEW_LABELS: Record<string, string> = {
    TOTAL: "Total amount",
    DAILY: "Daily trend",
    WEEKLY: "Weekly trend",
    MONTHLY: "Trends over time",
    CATEGORY_BREAKDOWN: "Category breakdown",
    TRANSACTION_LIST: "Transaction list",
};

const DONUT_COLORS = ["#7c3aed", "#6366f1", "#0d9488", "#0284c7", "#f59e0b", "#ea580c", "#e11d48", "#64748b"];

export const QueryResult = ({
    result,
}: QueryResultProps) => {
    const [viewMode, setViewMode] = useState<VisualizationType>(
        result.query.visualization === "TABLE" ? "TABLE" : "CHART"
    );

    const {
        transactions,
        totalSpent,
        transactionCount,
        averageAmount,
        highestPeriod,
        lowestPeriod,
        chartData,
        categoryBreakdown,
        summaryText,
    } = result;

    const categoryLabel = result.query.category
        ? (CATEGORY_METADATA[result.query.category]?.label || result.query.category)
        : "All categories";
    const periodLabel = PERIOD_LABELS[result.query.timePeriod] || result.query.timePeriod;
    const viewLabel = VIEW_LABELS[result.query.aggregation] || result.query.aggregation;

    if (transactionCount === 0) {
        return (
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-3">
                <div className="p-3 bg-slate-100 text-slate-500 rounded-2xl w-fit mx-auto">
                    <Info className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                        No transactions found
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        No financial records match the selected parameters. Try expanding your timeframe or choosing another category.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-200">
            {/* 0. Exploration Breadcrumb Header */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-700">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    You explored
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-purple-900 font-bold shadow-2xs">
                    {categoryLabel}
                </span>
                <span className="text-slate-300">→</span>
                <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-purple-900 font-bold shadow-2xs">
                    {periodLabel}
                </span>
                <span className="text-slate-300">→</span>
                <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-purple-900 font-bold shadow-2xs">
                    {viewLabel}
                </span>
            </div>

            {/* 1. Summary Header Card */}
            <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">✨</span>
                <p className="text-xs font-semibold text-purple-950 leading-relaxed">
                    {summaryText}
                </p>
            </div>

            {/* 2. Key Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total Spent
                    </span>
                    <p className="text-base sm:text-lg font-extrabold text-slate-900">
                        ₹{totalSpent.toLocaleString()}
                    </p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Avg / Transaction
                    </span>
                    <p className="text-base sm:text-lg font-extrabold text-slate-900">
                        ₹{averageAmount.toLocaleString()}
                    </p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {highestPeriod ? `Peak (${highestPeriod.label})` : "Count"}
                    </span>
                    <p className="text-base sm:text-lg font-extrabold text-slate-900">
                        {highestPeriod ? `₹${highestPeriod.amount.toLocaleString()}` : transactionCount}
                    </p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {lowestPeriod ? `Low (${lowestPeriod.label})` : "Transactions"}
                    </span>
                    <p className="text-base sm:text-lg font-extrabold text-slate-900">
                        {lowestPeriod ? `₹${lowestPeriod.amount.toLocaleString()}` : `${transactionCount} logs`}
                    </p>
                </div>
            </div>

            {/* 3. Visual Representation Card */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Visual Breakdown
                    </h4>

                    {/* View mode toggle */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setViewMode("CHART")}
                            className={`btn-interactive inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                viewMode === "CHART"
                                    ? "bg-white text-purple-900 shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <BarChart3 className="w-3.5 h-3.5" />
                            Chart
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("TABLE")}
                            className={`btn-interactive inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                viewMode === "TABLE"
                                    ? "bg-white text-purple-900 shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Table2 className="w-3.5 h-3.5" />
                            Table
                        </button>
                    </div>
                </div>

                {/* Mode A: Chart View */}
                {viewMode === "CHART" && (
                    <div>
                        {result.query.aggregation === "CATEGORY_BREAKDOWN" && categoryBreakdown && categoryBreakdown.length > 0 ? (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
                                <div className="w-44 h-44 shrink-0 relative flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryBreakdown}
                                                dataKey="amount"
                                                nameKey="label"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={48}
                                                outerRadius={68}
                                                paddingAngle={3}
                                                stroke="none"
                                            >
                                                {categoryBreakdown.map((entry, index) => (
                                                    <Cell key={entry.category} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(val: unknown) => [`₹${Number(val || 0).toLocaleString()}`, "Spent"]}
                                                contentStyle={{
                                                    backgroundColor: "#0f172a",
                                                    borderRadius: "12px",
                                                    border: "none",
                                                    color: "#ffffff",
                                                    fontSize: "12px",
                                                    padding: "8px 12px",
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="w-full space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {categoryBreakdown.map((item, index) => (
                                        <div key={item.category} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                                                    aria-hidden="true"
                                                />
                                                <span className="text-slate-700 font-medium truncate">
                                                    {item.icon} {item.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-right shrink-0">
                                                <span className="text-slate-400">{formatPercentage(item.percentage)}</span>
                                                <span className="font-bold text-slate-900">₹{item.amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : chartData.length > 0 ? (
                            <div className="w-full h-56 pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#64748b", fontSize: 11 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#64748b", fontSize: 11 }}
                                            tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                                        />
                                        <Tooltip
                                            formatter={(val: unknown) => [`₹${Number(val || 0).toLocaleString()}`, "Spent"]}
                                            contentStyle={{
                                                backgroundColor: "#0f172a",
                                                borderRadius: "12px",
                                                border: "none",
                                                color: "#ffffff",
                                                fontSize: "12px",
                                                padding: "8px 12px",
                                            }}
                                        />
                                        <Bar dataKey="amount" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 py-6 text-center">
                                Single period summary — view transactions in table mode.
                            </p>
                        )}
                    </div>
                )}

                {/* Mode B: Table View */}
                {viewMode === "TABLE" && (
                    <div className="overflow-x-auto max-h-64 divide-y divide-slate-100">
                        <table className="w-full text-left text-xs">
                            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white">
                                <tr>
                                    <th className="py-2 pr-3">Date</th>
                                    <th className="py-2 px-3">Title</th>
                                    <th className="py-2 px-3">Category</th>
                                    <th className="py-2 px-3">Priority</th>
                                    <th className="py-2 pl-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/70">
                                        <td className="py-2.5 pr-3 text-slate-500 whitespace-nowrap">
                                            {new Date(tx.transactionDate).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </td>
                                        <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[120px]">
                                            {tx.title || "Untitled"}
                                        </td>
                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                            <CategoryBadge category={tx.category} />
                                        </td>
                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                            <PriorityBadge priority={tx.priority} />
                                        </td>
                                        <td className="py-2.5 pl-3 font-bold text-slate-900 text-right whitespace-nowrap">
                                            ₹{Number(tx.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QueryResult;

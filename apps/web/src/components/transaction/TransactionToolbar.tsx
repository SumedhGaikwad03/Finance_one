import React from "react";
import { Search, X, Filter, ArrowUpDown, Calendar, SlidersHorizontal } from "lucide-react";
import type { TransactionCategory } from "../../types/dashboard.types";
import { CATEGORY_METADATA } from "../../constants/category.constants";

export type SortOption = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

export interface TransactionToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    selectedPriority: string;
    onPriorityChange: (priority: string) => void;
    selectedSource: string;
    onSourceChange: (source: string) => void;
    dateRangePreset: string;
    onDateRangePresetChange: (preset: string) => void;
    customStartDate?: string;
    onCustomStartDateChange?: (date: string) => void;
    customEndDate?: string;
    onCustomEndDateChange?: (date: string) => void;
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    onClearFilters: () => void;
    filteredCount: number;
    totalCount: number;
    filteredTotalAmount: number;
}

const SOURCE_LABELS: Record<string, string> = {
    MANUAL: "Manual Entry",
    BANK_STATEMENT: "Bank Statement",
    CSV_IMPORT: "CSV Import",
    RECEIPT_OCR: "Receipt OCR",
    SYSTEM: "System Generated",
};

const DATE_PRESET_LABELS: Record<string, string> = {
    all: "All Time",
    this_month: "This Month",
    "30d": "Last 30 Days",
    "90d": "Last 90 Days",
    custom: "Custom Range",
};

export const TransactionToolbar: React.FC<TransactionToolbarProps> = ({
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    selectedPriority,
    onPriorityChange,
    selectedSource,
    onSourceChange,
    dateRangePreset,
    onDateRangePresetChange,
    customStartDate = "",
    onCustomStartDateChange,
    customEndDate = "",
    onCustomEndDateChange,
    sortBy,
    onSortChange,
    onClearFilters,
    filteredCount,
    totalCount,
    filteredTotalAmount,
}) => {
    const hasActiveFilters =
        Boolean(searchQuery.trim()) ||
        Boolean(selectedCategory) ||
        Boolean(selectedPriority) ||
        Boolean(selectedSource) ||
        dateRangePreset !== "all" ||
        Boolean(customStartDate) ||
        Boolean(customEndDate);

    const categories = Object.keys(CATEGORY_METADATA) as TransactionCategory[];

    return (
        <section
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
            aria-label="Transaction Filter Toolbar"
        >
            {/* Top Row: Search & Primary Controls */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search Field */}
                <div className="relative flex-1 min-w-[220px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search by merchant, title, or narration..."
                        aria-label="Search transactions"
                        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchChange("")}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            aria-label="Clear search query"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Filters & Sorters */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Date Range Preset */}
                    <div className="relative flex items-center">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                        <select
                            value={dateRangePreset}
                            onChange={(e) => onDateRangePresetChange(e.target.value)}
                            aria-label="Filter by date range"
                            className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                        >
                            <option value="all">All Dates</option>
                            <option value="this_month">This Month</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="custom">Custom Date Range</option>
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => onCategoryChange(e.target.value)}
                            aria-label="Filter by category"
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {CATEGORY_METADATA[cat]?.label ?? cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Spending Tier / Priority Filter */}
                    <div className="relative">
                        <select
                            value={selectedPriority}
                            onChange={(e) => onPriorityChange(e.target.value)}
                            aria-label="Filter by spending tier"
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                        >
                            <option value="">All Tiers</option>
                            <option value="ESSENTIAL">Essential</option>
                            <option value="GOOD_TO_HAVE">Good to Have</option>
                            <option value="LUXURY">Luxury</option>
                            <option value="UNCLASSIFIED">Unclassified</option>
                        </select>
                    </div>

                    {/* Source Filter */}
                    <div className="relative">
                        <select
                            value={selectedSource}
                            onChange={(e) => onSourceChange(e.target.value)}
                            aria-label="Filter by source"
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                        >
                            <option value="">All Sources</option>
                            <option value="MANUAL">Manual</option>
                            <option value="BANK_STATEMENT">Bank Statement</option>
                            <option value="CSV_IMPORT">CSV Import</option>
                            <option value="RECEIPT_OCR">Receipt OCR</option>
                            <option value="SYSTEM">System</option>
                        </select>
                    </div>

                    {/* Sort Order */}
                    <div className="relative flex items-center">
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                        <select
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value as SortOption)}
                            aria-label="Sort transactions"
                            className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                        >
                            <option value="date_desc">Newest First</option>
                            <option value="date_asc">Oldest First</option>
                            <option value="amount_desc">Highest Amount</option>
                            <option value="amount_asc">Lowest Amount</option>
                        </select>
                    </div>

                    {/* Clear Filters CTA */}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={onClearFilters}
                            className="btn-interactive inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Custom Date Range Selectors (when 'custom' preset is selected) */}
            {dateRangePreset === "custom" && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-slate-700">
                    <span className="font-semibold text-purple-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        Custom Date Range:
                    </span>
                    <div className="flex items-center gap-1.5">
                        <label htmlFor="custom-start-date" className="text-slate-500">From:</label>
                        <input
                            id="custom-start-date"
                            type="date"
                            value={customStartDate}
                            onChange={(e) => onCustomStartDateChange && onCustomStartDateChange(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <label htmlFor="custom-end-date" className="text-slate-500">To:</label>
                        <input
                            id="custom-end-date"
                            type="date"
                            value={customEndDate}
                            onChange={(e) => onCustomEndDateChange && onCustomEndDateChange(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Active Filter Chips */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                        <SlidersHorizontal className="w-3 h-3" />
                        Active Filters:
                    </span>

                    {searchQuery.trim() && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            Search: &ldquo;{searchQuery}&rdquo;
                            <button
                                type="button"
                                onClick={() => onSearchChange("")}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer ml-0.5"
                                aria-label="Remove search filter"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {dateRangePreset !== "all" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            Date: {DATE_PRESET_LABELS[dateRangePreset] || dateRangePreset}
                            <button
                                type="button"
                                onClick={() => {
                                    onDateRangePresetChange("all");
                                    if (onCustomStartDateChange) onCustomStartDateChange("");
                                    if (onCustomEndDateChange) onCustomEndDateChange("");
                                }}
                                className="text-purple-400 hover:text-purple-600 cursor-pointer ml-0.5"
                                aria-label="Remove date filter"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {selectedCategory && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Category: {CATEGORY_METADATA[selectedCategory as TransactionCategory]?.label || selectedCategory}
                            <button
                                type="button"
                                onClick={() => onCategoryChange("")}
                                className="text-blue-400 hover:text-blue-600 cursor-pointer ml-0.5"
                                aria-label="Remove category filter"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {selectedPriority && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Tier: {selectedPriority.replace(/_/g, " ")}
                            <button
                                type="button"
                                onClick={() => onPriorityChange("")}
                                className="text-indigo-400 hover:text-indigo-600 cursor-pointer ml-0.5"
                                aria-label="Remove tier filter"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {selectedSource && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                            Source: {SOURCE_LABELS[selectedSource] || selectedSource}
                            <button
                                type="button"
                                onClick={() => onSourceChange("")}
                                className="text-teal-400 hover:text-teal-600 cursor-pointer ml-0.5"
                                aria-label="Remove source filter"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}

            {/* Summary Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                        Showing <strong className="text-slate-800 font-semibold">{filteredCount}</strong> of {totalCount} records
                    </span>
                </div>

                <div>
                    <span>Total Expense: </span>
                    <strong className="text-slate-900 font-bold">
                        ₹{filteredTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                </div>
            </div>
        </section>
    );
};

export default TransactionToolbar;

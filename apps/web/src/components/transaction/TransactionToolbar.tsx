import { Search, X, Filter, ArrowUpDown } from "lucide-react";
import type { TransactionCategory } from "../../types/dashboard.types";
import { CATEGORY_METADATA } from "../query/CategorySelector";

export type SortOption = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

interface TransactionToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    selectedPriority: string;
    onPriorityChange: (priority: string) => void;
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    onClearFilters: () => void;
    filteredCount: number;
    totalCount: number;
    filteredTotalAmount: number;
}

const TransactionToolbar = ({
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    selectedPriority,
    onPriorityChange,
    sortBy,
    onSortChange,
    onClearFilters,
    filteredCount,
    totalCount,
    filteredTotalAmount,
}: TransactionToolbarProps) => {
    const hasActiveFilters =
        Boolean(searchQuery.trim()) ||
        Boolean(selectedCategory) ||
        Boolean(selectedPriority);

    const categories = Object.keys(CATEGORY_METADATA) as TransactionCategory[];

    return (
        <section
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
            aria-label="Transaction Filter Toolbar"
        >
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Field */}
                <div className="relative flex-1 min-w-[200px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search by title, notes, or amount..."
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

                {/* Filter Selects & Sorting */}
                <div className="flex flex-wrap items-center gap-2">
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

                    {/* Priority Filter */}
                    <div className="relative">
                        <select
                            value={selectedPriority}
                            onChange={(e) => onPriorityChange(e.target.value)}
                            aria-label="Filter by priority"
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                        >
                            <option value="">All Priorities</option>
                            <option value="ESSENTIAL">Essential</option>
                            <option value="GOOD_TO_HAVE">Good to Have</option>
                            <option value="LUXURY">Luxury</option>
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

            {/* Summary Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                        Showing <strong className="text-slate-800 font-semibold">{filteredCount}</strong> of {totalCount} records
                    </span>
                </div>

                <div>
                    <span>Total: </span>
                    <strong className="text-slate-900 font-bold">
                        ₹{filteredTotalAmount.toLocaleString()}
                    </strong>
                </div>
            </div>
        </section>
    );
};

export default TransactionToolbar;

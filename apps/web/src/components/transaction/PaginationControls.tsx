import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface PaginationControlsProps {
    page: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    onPageChange: (newPage: number) => void;
    onLimitChange: (newLimit: number) => void;
    disabled?: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const PaginationControls: React.FC<PaginationControlsProps> = ({
    page,
    totalPages,
    totalCount,
    limit,
    onPageChange,
    onLimitChange,
    disabled = false,
}) => {
    if (totalCount === 0) {
        return null;
    }

    const startItem = Math.min((page - 1) * limit + 1, totalCount);
    const endItem = Math.min(page * limit, totalCount);

    // Compute compact window of pages to display (e.g. 1 ... 4 5 6 ... 10)
    const getVisiblePages = (): (number | "ellipsis")[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | "ellipsis")[] = [1];

        if (page > 3) {
            pages.push("ellipsis");
        }

        const windowStart = Math.max(2, page - 1);
        const windowEnd = Math.min(totalPages - 1, page + 1);

        for (let i = windowStart; i <= windowEnd; i++) {
            pages.push(i);
        }

        if (page < totalPages - 2) {
            pages.push("ellipsis");
        }

        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    };

    const visiblePages = getVisiblePages();

    return (
        <nav
            aria-label="Transactions Pagination"
            className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs text-xs text-slate-600"
        >
            {/* Left: Summary & Page Size Selector */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-slate-500 font-medium whitespace-nowrap">
                    Showing <strong className="text-slate-800 font-semibold">{startItem}</strong>–
                    <strong className="text-slate-800 font-semibold">{endItem}</strong> of{" "}
                    <strong className="text-slate-800 font-semibold">{totalCount}</strong>
                </span>

                <div className="flex items-center gap-1.5">
                    <label htmlFor="pagination-page-size" className="text-slate-400 font-medium">
                        Per page:
                    </label>
                    <select
                        id="pagination-page-size"
                        value={limit}
                        onChange={(e) => {
                            onLimitChange(Number(e.target.value));
                            onPageChange(1);
                        }}
                        disabled={disabled}
                        className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors cursor-pointer disabled:opacity-50"
                        aria-label="Items per page"
                    >
                        {PAGE_SIZE_OPTIONS.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Right: Page Navigation Buttons */}
            <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
                {/* First Page */}
                <button
                    type="button"
                    onClick={() => onPageChange(1)}
                    disabled={disabled || page <= 1}
                    aria-label="Go to first page"
                    className="btn-interactive p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous Page */}
                <button
                    type="button"
                    onClick={() => onPageChange(page - 1)}
                    disabled={disabled || page <= 1}
                    aria-label="Go to previous page"
                    className="btn-interactive p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Number Pills */}
                <div className="flex items-center gap-1 mx-1">
                    {visiblePages.map((p, idx) => {
                        if (p === "ellipsis") {
                            return (
                                <span
                                    key={`ellipsis-${idx}`}
                                    className="px-1 text-slate-400 select-none"
                                    aria-hidden="true"
                                >
                                    …
                                </span>
                            );
                        }

                        const isCurrent = p === page;
                        return (
                            <button
                                key={`page-${p}`}
                                type="button"
                                onClick={() => onPageChange(p)}
                                disabled={disabled}
                                aria-label={`Page ${p}`}
                                aria-current={isCurrent ? "page" : undefined}
                                className={`min-w-[28px] h-7 px-2 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                                    isCurrent
                                        ? "bg-purple-600 text-white shadow-xs"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                } disabled:opacity-40 cursor-pointer`}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>

                {/* Next Page */}
                <button
                    type="button"
                    onClick={() => onPageChange(page + 1)}
                    disabled={disabled || page >= totalPages}
                    aria-label="Go to next page"
                    className="btn-interactive p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                    type="button"
                    onClick={() => onPageChange(totalPages)}
                    disabled={disabled || page >= totalPages}
                    aria-label="Go to last page"
                    className="btn-interactive p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </nav>
    );
};

export default PaginationControls;

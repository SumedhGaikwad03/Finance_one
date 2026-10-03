import type { TransactionCategory, TransactionPriority } from "../../types/dashboard.types";
import { CATEGORY_METADATA } from "../query/CategorySelector";

interface CategoryBadgeProps {
    category: TransactionCategory;
    className?: string;
}

export const CategoryBadge = ({ category, className = "" }: CategoryBadgeProps) => {
    const meta = CATEGORY_METADATA[category] || { label: category, icon: "🏷️" };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100/80 text-slate-700 border border-slate-200/60 ${className}`}
        >
            <span className="text-xs" aria-hidden="true">
                {meta.icon}
            </span>
            <span className="truncate">{meta.label}</span>
        </span>
    );
};

interface PriorityBadgeProps {
    priority: TransactionPriority;
    className?: string;
}

export const PriorityBadge = ({ priority, className = "" }: PriorityBadgeProps) => {
    switch (priority) {
        case "ESSENTIAL":
            return (
                <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
                >
                    Essential
                </span>
            );
        case "GOOD_TO_HAVE":
            return (
                <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}
                >
                    Good to Have
                </span>
            );
        case "LUXURY":
            return (
                <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${className}`}
                >
                    Luxury
                </span>
            );
        default:
            return (
                <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 ${className}`}
                >
                    {priority}
                </span>
            );
    }
};

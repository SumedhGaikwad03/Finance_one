import type { TransactionCategory, TransactionPriority } from "../../types/dashboard.types";
import { CATEGORY_METADATA } from "./CategorySelector";
import type { DatePresetKey } from "../../utils/datePresets";
import type { AmountPresetKey } from "./AmountSelector";

interface QueryChipsProps {
    categories: TransactionCategory[];
    priorities: TransactionPriority[];
    datePreset: DatePresetKey;
    dateLabel?: string;
    amountPreset: AmountPresetKey;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    onRemoveCategory: (cat: TransactionCategory) => void;
    onRemovePriority: (pri: TransactionPriority) => void;
    onResetDate: () => void;
    onResetAmount: () => void;
    onResetSearch: () => void;
    onClearAll: () => void;
}

const QueryChips = ({
    categories,
    priorities,
    datePreset,
    dateLabel,
    amountPreset,
    minAmount,
    maxAmount,
    search,
    onRemoveCategory,
    onRemovePriority,
    onResetDate,
    onResetAmount,
    onResetSearch,
    onClearAll,
}: QueryChipsProps) => {
    const hasActiveFilters =
        categories.length > 0 ||
        priorities.length > 0 ||
        datePreset !== "all" ||
        amountPreset !== "any" ||
        Boolean(search);

    if (!hasActiveFilters) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
                Active Filters:
            </span>

            {categories.map((cat) => (
                <span
                    key={cat}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-full text-xs font-medium"
                >
                    <span>{CATEGORY_METADATA[cat]?.icon}</span>
                    <span>{CATEGORY_METADATA[cat]?.label ?? cat}</span>
                    <button
                        type="button"
                        onClick={() => onRemoveCategory(cat)}
                        className="hover:text-purple-950 font-bold ml-0.5 cursor-pointer"
                        aria-label={`Remove ${cat} filter`}
                    >
                        ×
                    </button>
                </span>
            ))}

            {priorities.map((pri) => (
                <span
                    key={pri}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-full text-xs font-medium"
                >
                    <span>{pri === "ESSENTIAL" ? "Essential" : pri === "GOOD_TO_HAVE" ? "Good to Have" : "Luxury"}</span>
                    <button
                        type="button"
                        onClick={() => onRemovePriority(pri)}
                        className="hover:text-black font-bold ml-0.5 cursor-pointer"
                        aria-label={`Remove ${pri} priority filter`}
                    >
                        ×
                    </button>
                </span>
            ))}

            {datePreset !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-medium">
                    <span>📅 {dateLabel || datePreset}</span>
                    <button
                        type="button"
                        onClick={onResetDate}
                        className="hover:text-blue-950 font-bold ml-0.5 cursor-pointer"
                        aria-label="Remove date filter"
                    >
                        ×
                    </button>
                </span>
            )}

            {amountPreset !== "any" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-medium">
                    <span>
                        💰{" "}
                        {amountPreset === "under-500"
                            ? "< ₹500"
                            : amountPreset === "500-2000"
                            ? "₹500 - ₹2,000"
                            : amountPreset === "over-2000"
                            ? "> ₹2,000"
                            : minAmount !== undefined && maxAmount !== undefined
                            ? `₹${minAmount} - ₹${maxAmount}`
                            : minAmount !== undefined
                            ? `> ₹${minAmount}`
                            : maxAmount !== undefined
                            ? `< ₹${maxAmount}`
                            : "Custom Amount"}
                    </span>
                    <button
                        type="button"
                        onClick={onResetAmount}
                        className="hover:text-emerald-950 font-bold ml-0.5 cursor-pointer"
                        aria-label="Remove amount filter"
                    >
                        ×
                    </button>
                </span>
            )}

            {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-medium">
                    <span>🔍 &ldquo;{search}&rdquo;</span>
                    <button
                        type="button"
                        onClick={onResetSearch}
                        className="hover:text-amber-950 font-bold ml-0.5 cursor-pointer"
                        aria-label="Remove search filter"
                    >
                        ×
                    </button>
                </span>
            )}

            <button
                type="button"
                onClick={onClearAll}
                className="text-xs font-medium text-slate-500 hover:text-red-600 ml-1.5 underline cursor-pointer"
            >
                Clear all
            </button>
        </div>
    );
};

export default QueryChips;

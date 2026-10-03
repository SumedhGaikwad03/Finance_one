import type { SortField, SortDirection } from "../../types/dashboard.types";

export type SortOptionKey = "newest" | "oldest" | "highest-amount" | "lowest-amount";

interface SortSelectorProps {
    sortBy: SortField;
    sortDirection: SortDirection;
    onChangeSort: (sortBy: SortField, sortDirection: SortDirection) => void;
}

const SORT_OPTIONS: {
    key: SortOptionKey;
    label: string;
    field: SortField;
    direction: SortDirection;
}[] = [
    { key: "newest", label: "Newest first", field: "transactionDate", direction: "desc" },
    { key: "oldest", label: "Oldest first", field: "transactionDate", direction: "asc" },
    { key: "highest-amount", label: "Highest amount", field: "amount", direction: "desc" },
    { key: "lowest-amount", label: "Lowest amount", field: "amount", direction: "asc" },
];

const SortSelector = ({ sortBy, sortDirection, onChangeSort }: SortSelectorProps) => {
    const currentKey =
        SORT_OPTIONS.find((opt) => opt.field === sortBy && opt.direction === sortDirection)?.key ?? "newest";

    return (
        <div className="space-y-1.5">
            <label htmlFor="query-sort-select" className="block text-xs font-semibold text-slate-700">
                Sort Results By
            </label>
            <select
                id="query-sort-select"
                value={currentKey}
                onChange={(e) => {
                    const selected = SORT_OPTIONS.find((opt) => opt.key === e.target.value);
                    if (selected) {
                        onChangeSort(selected.field, selected.direction);
                    }
                }}
                className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all cursor-pointer"
            >
                {SORT_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default SortSelector;

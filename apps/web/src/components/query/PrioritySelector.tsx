import type { TransactionPriority } from "../../types/dashboard.types";

interface PrioritySelectorProps {
    selectedPriorities: TransactionPriority[];
    onTogglePriority: (priority: TransactionPriority) => void;
    onClearPriorities: () => void;
}

const PRIORITY_METADATA: Record<
    TransactionPriority,
    { label: string; tag: string; description: string }
> = {
    ESSENTIAL: {
        label: "Essential",
        tag: "Core Needs",
        description: "Rent, bills, basic groceries & healthcare",
    },
    GOOD_TO_HAVE: {
        label: "Good to Have",
        tag: "Comfort & Lifestyle",
        description: "Dining out, shopping, hobbies & transport upgrades",
    },
    LUXURY: {
        label: "Luxury",
        tag: "Discretionary",
        description: "Fine dining, vacations, high-end purchases",
    },
};

const PrioritySelector = ({
    selectedPriorities,
    onTogglePriority,
    onClearPriorities,
}: PrioritySelectorProps) => {
    const isAllSelected = selectedPriorities.length === 0;

    return (
        <fieldset className="space-y-3">
            <div className="flex items-center justify-between">
                <legend className="text-sm font-semibold text-slate-800">
                    Step 3: What spending classification?
                </legend>
                {!isAllSelected && (
                    <button
                        type="button"
                        onClick={onClearPriorities}
                        className="text-xs font-medium text-purple-600 hover:text-purple-700 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                        Any Priority (Reset)
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(Object.keys(PRIORITY_METADATA) as TransactionPriority[]).map((priority) => {
                    const isSelected = selectedPriorities.includes(priority);
                    const meta = PRIORITY_METADATA[priority];

                    return (
                        <button
                            key={priority}
                            type="button"
                            onClick={() => onTogglePriority(priority)}
                            aria-pressed={isSelected}
                            className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-800"
                            }`}
                        >
                            <div className="flex items-center justify-between w-full mb-1">
                                <span className="text-xs font-bold">
                                    {meta.label}
                                </span>
                                <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                        isSelected
                                            ? "bg-slate-800 text-slate-200 border border-slate-700"
                                            : "bg-slate-100 text-slate-600 border border-slate-200"
                                    }`}
                                >
                                    {meta.tag}
                                </span>
                            </div>
                            <span
                                className={`text-[11px] mt-0.5 line-clamp-2 ${
                                    isSelected ? "text-slate-300" : "text-slate-500"
                                }`}
                            >
                                {meta.description}
                            </span>
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
};

export default PrioritySelector;

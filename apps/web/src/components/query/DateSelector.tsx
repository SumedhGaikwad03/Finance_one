import { useState } from "react";
import type { DatePresetKey } from "../../utils/datePresets";

interface DateSelectorProps {
    selectedPreset: DatePresetKey;
    customStartDate?: string;
    customEndDate?: string;
    onChangePreset: (preset: DatePresetKey, start?: string, end?: string) => void;
}

const DATE_PRESETS: { key: DatePresetKey; label: string; description: string }[] = [
    { key: "all", label: "All Time", description: "Entire transaction history" },
    { key: "this-week", label: "This Week", description: "Current week" },
    { key: "this-month", label: "This Month", description: "Current calendar month" },
    { key: "last-month", label: "Last Month", description: "Previous calendar month" },
    { key: "custom", label: "Custom Range", description: "Specific date window" },
];

const DateSelector = ({
    selectedPreset,
    customStartDate,
    customEndDate,
    onChangePreset,
}: DateSelectorProps) => {
    const [startInput, setStartInput] = useState(customStartDate ?? "");
    const [endInput, setEndInput] = useState(customEndDate ?? "");

    return (

        <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-800">
                Step 2: When did these transactions happen?
            </legend>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {DATE_PRESETS.map((preset) => {
                    const isSelected = selectedPreset === preset.key;

                    return (
                        <button
                            key={preset.key}
                            type="button"
                            onClick={() => {
                                if (preset.key === "custom") {
                                    onChangePreset("custom", startInput || undefined, endInput || undefined);
                                } else {
                                    onChangePreset(preset.key);
                                }
                            }}
                            aria-pressed={isSelected}
                            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                    ? "bg-purple-50 border-purple-500 shadow-sm ring-1 ring-purple-500/20"
                                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                        >
                            <span
                                className={`text-xs font-semibold ${
                                    isSelected ? "text-purple-900" : "text-slate-800"
                                }`}
                            >
                                {preset.label}
                            </span>
                            <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {preset.description}
                            </span>
                        </button>
                    );
                })}
            </div>

            {selectedPreset === "custom" && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div>
                        <label htmlFor="custom-start-date" className="block text-xs font-medium text-slate-700 mb-1">
                            Start Date
                        </label>
                        <input
                            id="custom-start-date"
                            type="date"
                            value={startInput}
                            onChange={(e) => {
                                setStartInput(e.target.value);
                                onChangePreset("custom", e.target.value || undefined, endInput || undefined);
                            }}
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="custom-end-date" className="block text-xs font-medium text-slate-700 mb-1">
                            End Date
                        </label>
                        <input
                            id="custom-end-date"
                            type="date"
                            value={endInput}
                            onChange={(e) => {
                                setEndInput(e.target.value);
                                onChangePreset("custom", startInput || undefined, e.target.value || undefined);
                            }}
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>
            )}
        </fieldset>
    );
};

export default DateSelector;

import { useState } from "react";

export type AmountPresetKey = "any" | "under-500" | "500-2000" | "over-2000" | "custom";

interface AmountSelectorProps {
    selectedPreset: AmountPresetKey;
    minAmount?: number;
    maxAmount?: number;
    onChangeAmount: (preset: AmountPresetKey, min?: number, max?: number) => void;
}

const AMOUNT_PRESETS: {
    key: AmountPresetKey;
    label: string;
    description: string;
    min?: number;
    max?: number;
}[] = [
    { key: "any", label: "Any Amount", description: "All transaction values" },
    { key: "under-500", label: "Under ₹500", description: "Quick & small expenses", max: 500 },
    { key: "500-2000", label: "₹500 – ₹2,000", description: "Medium-sized bills", min: 500, max: 2000 },
    { key: "over-2000", label: "Over ₹2,000", description: "Major purchases & investments", min: 2000 },
    { key: "custom", label: "Custom Range", description: "Specify exact limits" },
];

const AmountSelector = ({
    selectedPreset,
    minAmount,
    maxAmount,
    onChangeAmount,
}: AmountSelectorProps) => {
    const [minInput, setMinInput] = useState<string>(minAmount !== undefined ? minAmount.toString() : "");
    const [maxInput, setMaxInput] = useState<string>(maxAmount !== undefined ? maxAmount.toString() : "");

    const handlePresetSelect = (preset: (typeof AMOUNT_PRESETS)[number]) => {
        if (preset.key === "custom") {
            const min = minInput ? Number(minInput) : undefined;
            const max = maxInput ? Number(maxInput) : undefined;
            onChangeAmount("custom", min, max);
        } else {
            onChangeAmount(preset.key, preset.min, preset.max);
        }
    };

    return (
        <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-800">
                Step 4: How much was spent?
            </legend>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {AMOUNT_PRESETS.map((preset) => {
                    const isSelected = selectedPreset === preset.key;

                    return (
                        <button
                            key={preset.key}
                            type="button"
                            onClick={() => handlePresetSelect(preset)}
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
                        <label htmlFor="custom-min-amount" className="block text-xs font-medium text-slate-700 mb-1">
                            Minimum Amount (₹)
                        </label>
                        <input
                            id="custom-min-amount"
                            type="number"
                            min="0"
                            placeholder="e.g. 100"
                            value={minInput}
                            onChange={(e) => {
                                setMinInput(e.target.value);
                                const min = e.target.value ? Number(e.target.value) : undefined;
                                const max = maxInput ? Number(maxInput) : undefined;
                                onChangeAmount("custom", min, max);
                            }}
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="custom-max-amount" className="block text-xs font-medium text-slate-700 mb-1">
                            Maximum Amount (₹)
                        </label>
                        <input
                            id="custom-max-amount"
                            type="number"
                            min="0"
                            placeholder="e.g. 5000"
                            value={maxInput}
                            onChange={(e) => {
                                setMaxInput(e.target.value);
                                const min = minInput ? Number(minInput) : undefined;
                                const max = e.target.value ? Number(e.target.value) : undefined;
                                onChangeAmount("custom", min, max);
                            }}
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>
            )}
        </fieldset>
    );
};

export default AmountSelector;

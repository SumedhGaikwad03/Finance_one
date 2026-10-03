import type { TransactionCategory } from "../../types/dashboard.types";

interface CategorySelectorProps {
    selectedCategories: TransactionCategory[];
    onToggleCategory: (category: TransactionCategory) => void;
    onClearCategories: () => void;
}

export const CATEGORY_METADATA: Record<
    TransactionCategory,
    { label: string; icon: string; description: string }
> = {
    FOOD: { label: "Food & Dining", icon: "🍔", description: "Groceries, cafes, dine-out" },
    SHOPPING: { label: "Shopping", icon: "🛍️", description: "Retail, clothes, gadgets" },
    FUEL: { label: "Fuel & Transport", icon: "⛽", description: "Gas, petrol, public transit" },
    BILLS: { label: "Bills & Utilities", icon: "💡", description: "Electricity, water, rent" },
    ENTERTAINMENT: { label: "Entertainment", icon: "🎬", description: "Movies, games, outings" },
    HEALTH: { label: "Health & Care", icon: "🩺", description: "Medicine, doctor, gym" },
    TRAVEL: { label: "Travel & Vacations", icon: "✈️", description: "Flights, hotels, trips" },
    EDUCATION: { label: "Education", icon: "📚", description: "Courses, books, tuition" },
    SUBSCRIPTION: { label: "Subscriptions", icon: "📱", description: "Netflix, Spotify, SaaS" },
    GIFT: { label: "Gifts & Donations", icon: "🎁", description: "Presents, charities" },
    OTHER: { label: "Other / Misc", icon: "📦", description: "Miscellaneous expenses" },
};

const CategorySelector = ({
    selectedCategories,
    onToggleCategory,
    onClearCategories,
}: CategorySelectorProps) => {
    const isAllSelected = selectedCategories.length === 0;

    return (
        <fieldset className="space-y-3">
            <div className="flex items-center justify-between">
                <legend className="text-sm font-semibold text-slate-800">
                    Step 1: Which categories are you exploring?
                </legend>
                {!isAllSelected && (
                    <button
                        type="button"
                        onClick={onClearCategories}
                        className="text-xs font-medium text-purple-600 hover:text-purple-700 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                        Select All (Reset)
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {(Object.keys(CATEGORY_METADATA) as TransactionCategory[]).map((category) => {
                    const isSelected = selectedCategories.includes(category);
                    const meta = CATEGORY_METADATA[category];

                    return (
                        <button
                            key={category}
                            type="button"
                            onClick={() => onToggleCategory(category)}
                            aria-pressed={isSelected}
                            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                    ? "bg-purple-50 border-purple-500 shadow-sm ring-1 ring-purple-500/20"
                                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                        >
                            <span className="text-xl mb-1" aria-hidden="true">
                                {meta.icon}
                            </span>
                            <span
                                className={`text-xs font-semibold ${
                                    isSelected ? "text-purple-900" : "text-slate-800"
                                }`}
                            >
                                {meta.label}
                            </span>
                            <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {meta.description}
                            </span>
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
};

export default CategorySelector;

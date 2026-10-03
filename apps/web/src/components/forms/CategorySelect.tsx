import { useState, useRef, useEffect, useCallback, useId } from "react";
import { ChevronDown, Check, Tag } from "lucide-react";
import type { TransactionCategory } from "../../types/dashboard.types";

export interface CategoryOption {
    value: TransactionCategory;
    label: string;
    icon: string;
    description: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
    { value: "FOOD", label: "Food & Dining", icon: "🍔", description: "Groceries, cafes, dine-out" },
    { value: "FUEL", label: "Fuel & Transport", icon: "⛽", description: "Gas, petrol, public transit" },
    { value: "SHOPPING", label: "Shopping", icon: "🛍️", description: "Retail, clothes, gadgets" },
    { value: "BILLS", label: "Bills & Utilities", icon: "💡", description: "Electricity, water, rent" },
    { value: "ENTERTAINMENT", label: "Entertainment", icon: "🎬", description: "Movies, games, outings" },
    { value: "HEALTH", label: "Health & Care", icon: "🩺", description: "Medicine, doctor, gym" },
    { value: "TRAVEL", label: "Travel & Vacations", icon: "✈️", description: "Flights, hotels, trips" },
    { value: "EDUCATION", label: "Education", icon: "📚", description: "Courses, books, tuition" },
    { value: "SUBSCRIPTION", label: "Subscriptions", icon: "📱", description: "Netflix, Spotify, SaaS" },
    { value: "GIFT", label: "Gifts & Donations", icon: "🎁", description: "Presents, charities" },
    { value: "OTHER", label: "Other / Misc", icon: "📦", description: "Miscellaneous expenses" },
];

interface CategorySelectProps {
    id?: string;
    value?: TransactionCategory;
    onChange: (value: TransactionCategory) => void;
    onBlur?: () => void;
    error?: string;
    disabled?: boolean;
    name?: string;
}

export const CategorySelect = ({
    id = "category",
    value = "FOOD",
    onChange,
    onBlur,
    error,
    disabled = false,
}: CategorySelectProps) => {
    const listboxId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(() => {
        const idx = CATEGORY_OPTIONS.findIndex((c) => c.value === value);
        return idx >= 0 ? idx : 0;
    });

    const containerRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const listRef = useRef<HTMLUListElement | null>(null);

    const selectedOption =
        CATEGORY_OPTIONS.find((c) => c.value === value) || CATEGORY_OPTIONS[0];

    // Compute intelligent upward/downward positioning based on viewport space
    const updateDropdownPosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 260; // Estimated max height

        // If space below is constrained and space above is larger, open upward
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
            setOpenUpward(true);
        } else {
            setOpenUpward(false);
        }
    }, []);

    // Toggle dropdown open/close
    const handleToggle = () => {
        if (disabled) return;
        if (!isOpen) {
            updateDropdownPosition();
            const currentIdx = CATEGORY_OPTIONS.findIndex((c) => c.value === value);
            setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
            setIsOpen(true);
        } else {
            setIsOpen(false);
            if (onBlur) onBlur();
        }
    };

    const handleSelect = (categoryValue: TransactionCategory) => {
        onChange(categoryValue);
        setIsOpen(false);
        if (onBlur) onBlur();
        triggerRef.current?.focus();
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                if (isOpen) {
                    setIsOpen(false);
                    if (onBlur) onBlur();
                }
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
            window.addEventListener("resize", updateDropdownPosition);
            window.addEventListener("scroll", updateDropdownPosition, true);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
            window.removeEventListener("resize", updateDropdownPosition);
            window.removeEventListener("scroll", updateDropdownPosition, true);
        };
    }, [isOpen, onBlur, updateDropdownPosition]);

    // Ensure highlighted option is scrolled into view when navigating with keyboard
    useEffect(() => {
        if (isOpen && listRef.current) {
            const highlightedEl = listRef.current.children[
                highlightedIndex
            ] as HTMLElement | undefined;
            if (highlightedEl) {
                highlightedEl.scrollIntoView({
                    block: "nearest",
                    behavior: "smooth",
                });
            }
        }
    }, [isOpen, highlightedIndex]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case "ArrowDown": {
                e.preventDefault();
                if (!isOpen) {
                    updateDropdownPosition();
                    setIsOpen(true);
                } else {
                    setHighlightedIndex((prev) =>
                        prev < CATEGORY_OPTIONS.length - 1 ? prev + 1 : 0
                    );
                }
                break;
            }
            case "ArrowUp": {
                e.preventDefault();
                if (!isOpen) {
                    updateDropdownPosition();
                    setIsOpen(true);
                } else {
                    setHighlightedIndex((prev) =>
                        prev > 0 ? prev - 1 : CATEGORY_OPTIONS.length - 1
                    );
                }
                break;
            }
            case "Enter":
            case " ": {
                e.preventDefault();
                if (isOpen) {
                    const option = CATEGORY_OPTIONS[highlightedIndex];
                    if (option) {
                        handleSelect(option.value);
                    }
                } else {
                    updateDropdownPosition();
                    setIsOpen(true);
                }
                break;
            }
            case "Escape": {
                if (isOpen) {
                    e.preventDefault();
                    setIsOpen(false);
                    triggerRef.current?.focus();
                    if (onBlur) onBlur();
                }
                break;
            }
            case "Tab": {
                if (isOpen) {
                    setIsOpen(false);
                    if (onBlur) onBlur();
                }
                break;
            }
            default: {
                // Quick jump by first letter
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    const char = e.key.toLowerCase();
                    const matchIdx = CATEGORY_OPTIONS.findIndex((c) =>
                        c.label.toLowerCase().startsWith(char)
                    );
                    if (matchIdx >= 0) {
                        setHighlightedIndex(matchIdx);
                        if (!isOpen) {
                            updateDropdownPosition();
                            setIsOpen(true);
                        }
                    }
                }
                break;
            }
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger Button */}
            <button
                ref={triggerRef}
                id={id}
                type="button"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                className={`w-full flex items-center justify-between pl-3 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 transition-all cursor-pointer text-left ${
                    isOpen
                        ? "bg-white border-purple-500 ring-2 ring-purple-500/20"
                        : error
                        ? "border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        : "border-slate-200 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="flex-shrink-0 text-base" aria-hidden="true">
                        {selectedOption.icon}
                    </span>
                    <div className="truncate flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">
                            {selectedOption.label}
                        </span>
                    </div>
                </div>

                <ChevronDown
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-purple-600" : ""
                    }`}
                    aria-hidden="true"
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={`absolute left-0 right-0 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
                        openUpward
                            ? "bottom-full mb-1.5 origin-bottom"
                            : "top-full mt-1.5 origin-top"
                    }`}
                >
                    <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <Tag className="w-3 h-3 text-purple-600" />
                        <span>Select Category</span>
                    </div>

                    <ul
                        ref={listRef}
                        id={listboxId}
                        role="listbox"
                        tabIndex={-1}
                        aria-activedescendant={`category-option-${CATEGORY_OPTIONS[highlightedIndex]?.value}`}
                        className="max-h-56 sm:max-h-60 overflow-y-auto overscroll-contain py-1 divide-y divide-slate-50 focus:outline-none"
                    >
                        {CATEGORY_OPTIONS.map((option, index) => {
                            const isSelected = option.value === value;
                            const isHighlighted = index === highlightedIndex;

                            return (
                                <li
                                    key={option.value}
                                    id={`category-option-${option.value}`}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleSelect(option.value)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`min-h-[44px] flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors ${
                                        isSelected
                                            ? "bg-purple-50/80 text-purple-900 font-semibold"
                                            : isHighlighted
                                            ? "bg-slate-100/70 text-slate-900"
                                            : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                        <span
                                            className="text-lg flex-shrink-0"
                                            aria-hidden="true"
                                        >
                                            {option.icon}
                                        </span>
                                        <div className="min-w-0 text-left">
                                            <p
                                                className={`text-xs sm:text-sm truncate ${
                                                    isSelected
                                                        ? "font-bold text-purple-950"
                                                        : "font-medium text-slate-800"
                                                }`}
                                            >
                                                {option.label}
                                            </p>
                                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                                            <Check className="w-3 h-3 stroke-[3]" />
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CategorySelect;

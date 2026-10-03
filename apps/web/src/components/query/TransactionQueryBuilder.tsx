import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
    Transaction,
    TransactionCategory,
    TransactionPriority,
    TransactionQueryParams,
    SortField,
    SortDirection,
} from "../../types/dashboard.types";
import * as transactionService from "../../services/transaction.service";
import CategorySelector from "./CategorySelector";
import DateSelector from "./DateSelector";
import PrioritySelector from "./PrioritySelector";
import AmountSelector, { type AmountPresetKey } from "./AmountSelector";
import SearchSelector from "./SearchSelector";
import SortSelector from "./SortSelector";
import QueryChips from "./QueryChips";
import QueryPreview from "./QueryPreview";
import QueryResults from "./QueryResults";
import { resolveDatePreset, type DatePresetKey } from "../../utils/datePresets";

interface TransactionQueryBuilderProps {
    onEditTransaction: (tx: Transaction) => void;
    onDeleteTransaction: (id: number) => void;
    isDeleting?: boolean;
}

const TransactionQueryBuilder = ({
    onEditTransaction,
    onDeleteTransaction,
    isDeleting,
}: TransactionQueryBuilderProps) => {
    // -------------------------------------------------------------
    // Query Builder State
    // -------------------------------------------------------------
    const [categories, setCategories] = useState<TransactionCategory[]>([]);
    const [priorities, setPriorities] = useState<TransactionPriority[]>([]);
    const [datePreset, setDatePreset] = useState<DatePresetKey>("all");
    const [customStart, setCustomStart] = useState<string | undefined>(undefined);
    const [customEnd, setCustomEnd] = useState<string | undefined>(undefined);
    const [amountPreset, setAmountPreset] = useState<AmountPresetKey>("any");
    const [minAmount, setMinAmount] = useState<number | undefined>(undefined);
    const [maxAmount, setMaxAmount] = useState<number | undefined>(undefined);
    const [search, setSearch] = useState<string>("");
    const [sortBy, setSortBy] = useState<SortField>("transactionDate");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    // Collapsible / Progressive controls
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    // -------------------------------------------------------------
    // Date & Amount Labels Calculation
    // -------------------------------------------------------------
    const dateRange = useMemo(
        () => resolveDatePreset(datePreset, customStart, customEnd),
        [datePreset, customStart, customEnd]
    );

    const amountLabel = useMemo(() => {
        if (amountPreset === "under-500") return "Under ₹500";
        if (amountPreset === "500-2000") return "₹500 to ₹2,000";
        if (amountPreset === "over-2000") return "Over ₹2,000";
        if (amountPreset === "custom") {
            if (minAmount !== undefined && maxAmount !== undefined) return `₹${minAmount} to ₹${maxAmount}`;
            if (minAmount !== undefined) return `Over ₹${minAmount}`;
            if (maxAmount !== undefined) return `Under ₹${maxAmount}`;
        }
        return "Any Amount";
    }, [amountPreset, minAmount, maxAmount]);

    const sortLabel = useMemo(() => {
        if (sortBy === "transactionDate") {
            return sortDirection === "desc" ? "Newest First" : "Oldest First";
        }
        if (sortBy === "amount") {
            return sortDirection === "desc" ? "Highest Amount" : "Lowest Amount";
        }
        return "Created Date";
    }, [sortBy, sortDirection]);

    // -------------------------------------------------------------
    // Canonical TransactionQueryParams
    // -------------------------------------------------------------
    const queryParams: TransactionQueryParams = useMemo(() => {
        return {
            ...(categories.length > 0 && { categories }),
            ...(priorities.length > 0 && { priorities }),
            ...(dateRange.startDate && { startDate: dateRange.startDate }),
            ...(dateRange.endDate && { endDate: dateRange.endDate }),
            ...(minAmount !== undefined && { minAmount }),
            ...(maxAmount !== undefined && { maxAmount }),
            ...(search.trim() && { search: search.trim() }),
            sortBy,
            sortDirection,
            limit: 50,
        };
    }, [categories, priorities, dateRange, minAmount, maxAmount, search, sortBy, sortDirection]);

    // -------------------------------------------------------------
    // React Query Dispatch
    // -------------------------------------------------------------
    const {
        data: transactions = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery<Transaction[], Error>({
        queryKey: ["transactions", "query", queryParams],
        queryFn: () => transactionService.queryTransactions(queryParams),
    });

    // -------------------------------------------------------------
    // State Mutation Handlers
    // -------------------------------------------------------------
    const handleToggleCategory = (cat: TransactionCategory) => {
        setCategories((prev) =>
            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
        );
    };

    const handleClearCategories = () => setCategories([]);

    const handleTogglePriority = (pri: TransactionPriority) => {
        setPriorities((prev) =>
            prev.includes(pri) ? prev.filter((p) => p !== pri) : [...prev, pri]
        );
    };

    const handleClearPriorities = () => setPriorities([]);

    const handleChangeDatePreset = (preset: DatePresetKey, start?: string, end?: string) => {
        setDatePreset(preset);
        setCustomStart(start);
        setCustomEnd(end);
    };

    const handleResetDate = () => {
        setDatePreset("all");
        setCustomStart(undefined);
        setCustomEnd(undefined);
    };

    const handleChangeAmount = (preset: AmountPresetKey, min?: number, max?: number) => {
        setAmountPreset(preset);
        setMinAmount(min);
        setMaxAmount(max);
    };

    const handleResetAmount = () => {
        setAmountPreset("any");
        setMinAmount(undefined);
        setMaxAmount(undefined);
    };

    const handleResetSearch = () => setSearch("");

    const handleClearAll = () => {
        setCategories([]);
        setPriorities([]);
        handleResetDate();
        handleResetAmount();
        handleResetSearch();
        setSortBy("transactionDate");
        setSortDirection("desc");
    };

    return (
        <section className="space-y-6">
            {/* Visual Builder Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-7 space-y-6">
                <header className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xl" aria-hidden="true">
                            🧭
                        </span>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                            Smart Query Builder
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Progressively construct intelligent queries across your financial ledger.
                    </p>
                </header>

                {/* Step 1: Categories */}
                <CategorySelector
                    selectedCategories={categories}
                    onToggleCategory={handleToggleCategory}
                    onClearCategories={handleClearCategories}
                />

                <hr className="border-slate-100" />

                {/* Step 2: Time Range */}
                <DateSelector
                    selectedPreset={datePreset}
                    customStartDate={customStart}
                    customEndDate={customEnd}
                    onChangePreset={handleChangeDatePreset}
                />

                <hr className="border-slate-100" />

                {/* Step 3: Priority */}
                <PrioritySelector
                    selectedPriorities={priorities}
                    onTogglePriority={handleTogglePriority}
                    onClearPriorities={handleClearPriorities}
                />

                <hr className="border-slate-100" />

                {/* Step 4: Amount */}
                <AmountSelector
                    selectedPreset={amountPreset}
                    minAmount={minAmount}
                    maxAmount={maxAmount}
                    onChangeAmount={handleChangeAmount}
                />

                {/* Step 5: Advanced Search & Sorting (Collapsible / inline) */}
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={() => setIsAdvancedOpen((prev) => !prev)}
                        className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 cursor-pointer"
                        aria-expanded={isAdvancedOpen}
                    >
                        <span>{isAdvancedOpen ? "− Hide" : "+ Show"} Keyword Search & Sorting Options</span>
                    </button>

                    {isAdvancedOpen && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/70">
                            <SearchSelector searchTerm={search} onSearchChange={setSearch} />
                            <SortSelector
                                sortBy={sortBy}
                                sortDirection={sortDirection}
                                onChangeSort={(newSortBy, newSortDir) => {
                                    setSortBy(newSortBy);
                                    setSortDirection(newSortDir);
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Active Filter Chips */}
                <QueryChips
                    categories={categories}
                    priorities={priorities}
                    datePreset={datePreset}
                    dateLabel={dateRange.label}
                    amountPreset={amountPreset}
                    minAmount={minAmount}
                    maxAmount={maxAmount}
                    search={search}
                    onRemoveCategory={handleToggleCategory}
                    onRemovePriority={handleTogglePriority}
                    onResetDate={handleResetDate}
                    onResetAmount={handleResetAmount}
                    onResetSearch={handleResetSearch}
                    onClearAll={handleClearAll}
                />

                {/* Human-Readable Query Preview */}
                <QueryPreview
                    categories={categories}
                    priorities={priorities}
                    dateLabel={dateRange.label}
                    amountLabel={amountLabel}
                    search={search}
                    sortByLabel={sortLabel}
                />
            </div>

            {/* Results Section */}
            <QueryResults
                transactions={transactions}
                isLoading={isLoading}
                isError={isError}
                error={error}
                onRetry={() => refetch()}
                onResetQuery={handleClearAll}
                onEditTransaction={onEditTransaction}
                onDeleteTransaction={onDeleteTransaction}
                isDeleting={isDeleting}
                summaryDescription={`Showing ${transactions.length} transactions for ${categories.length > 0 ? categories.join(", ") : "All Categories"}`}
            />
        </section>
    );
};

export default TransactionQueryBuilder;

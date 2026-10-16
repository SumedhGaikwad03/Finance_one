import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { AlertCircle, RefreshCw } from "lucide-react";

import * as transactionService from "../../services/transaction.service";

import TransactionsHeader from "../../components/transaction/TransactionsHeader";
import TransactionToolbar, { type SortOption } from "../../components/transaction/TransactionToolbar";
import TransactionLedger from "../../components/transaction/TransactionLedger";
import TransactionModal from "../../components/transaction/TransactionModal";
import TransactionDetailModal from "../../components/transaction/TransactionDetailModal";
import DeleteTransactionDialog from "../../components/transaction/DeleteTransactionDialog";
import TransactionsSkeleton from "../../components/transaction/TransactionsSkeleton";
import CreateTransactionForm from "../../components/forms/CreateTransactionForm";
import { QueryExplorerPanel } from "../../components/ai/FinanceAIPanel";
import StatementImportModal from "../../components/import/StatementImportModal";

import type {
    Transaction,
    TransactionCategory,
    TransactionPriority,
    TransactionSource,
    SortField,
    SortDirection,
} from "../../types/dashboard.types";
import type { CreateTransactionFormData } from "../../utils/transaction.schema";

const TransactionsPage = () => {
    const queryClient = useQueryClient();

    // Modal & Dialog states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedDetailTransaction, setSelectedDetailTransaction] = useState<Transaction | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

    // Optional secondary Smart Query Explorer toggle
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);

    // Filter, Search, and Pagination states
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedPriority, setSelectedPriority] = useState("");
    const [selectedSource, setSelectedSource] = useState("");
    const [dateRangePreset, setDateRangePreset] = useState("all");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("date_desc");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    // Debounce search input by 300ms
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset to page 1 on new search
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset page to 1 whenever filters change
    const handleCategoryChange = (cat: string) => {
        setSelectedCategory(cat);
        setPage(1);
    };

    const handlePriorityChange = (pri: string) => {
        setSelectedPriority(pri);
        setPage(1);
    };

    const handleSourceChange = (src: string) => {
        setSelectedSource(src);
        setPage(1);
    };

    const handleDatePresetChange = (preset: string) => {
        setDateRangePreset(preset);
        setPage(1);
    };

    const handleCustomStartDateChange = (date: string) => {
        setCustomStartDate(date);
        setPage(1);
    };

    const handleCustomEndDateChange = (date: string) => {
        setCustomEndDate(date);
        setPage(1);
    };

    const handleSortChange = (sort: SortOption) => {
        setSortBy(sort);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearchQuery("");
        setDebouncedSearch("");
        setSelectedCategory("");
        setSelectedPriority("");
        setSelectedSource("");
        setDateRangePreset("all");
        setCustomStartDate("");
        setCustomEndDate("");
        setPage(1);
    };

    // Calculate normalized date boundaries from preset
    const { startDate, endDate } = useMemo(() => {
        if (dateRangePreset === "this_month") {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            return { startDate: `${year}-${month}-01`, endDate: undefined };
        }
        if (dateRangePreset === "30d") {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            return { startDate: d.toISOString().slice(0, 10), endDate: undefined };
        }
        if (dateRangePreset === "90d") {
            const d = new Date();
            d.setDate(d.getDate() - 90);
            return { startDate: d.toISOString().slice(0, 10), endDate: undefined };
        }
        if (dateRangePreset === "custom") {
            return {
                startDate: customStartDate || undefined,
                endDate: customEndDate || undefined,
            };
        }
        return { startDate: undefined, endDate: undefined };
    }, [dateRangePreset, customStartDate, customEndDate]);

    // Map SortOption to API fields
    const { sortByField, sortDir } = useMemo<{ sortByField: SortField; sortDir: SortDirection }>(() => {
        switch (sortBy) {
            case "date_asc":
                return { sortByField: "transactionDate", sortDir: "asc" };
            case "amount_desc":
                return { sortByField: "amount", sortDir: "desc" };
            case "amount_asc":
                return { sortByField: "amount", sortDir: "asc" };
            case "date_desc":
            default:
                return { sortByField: "transactionDate", sortDir: "desc" };
        }
    }, [sortBy]);

    const hasActiveFilters = Boolean(
        searchQuery.trim() ||
        selectedCategory ||
        selectedPriority ||
        selectedSource ||
        dateRangePreset !== "all" ||
        customStartDate ||
        customEndDate
    );

    // ============================================================
    // FETCH TRANSACTIONS QUERY (PAGINATED & FILTERED SERVER-SIDE)
    // ============================================================

    const queryKey = [
        "transactions",
        {
            page,
            limit,
            search: debouncedSearch,
            category: selectedCategory,
            priority: selectedPriority,
            source: selectedSource,
            startDate,
            endDate,
            sortByField,
            sortDir,
        },
    ];

    const {
        data: paginatedResponse,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey,
        queryFn: () =>
            transactionService.queryTransactionsPaginated({
                category: selectedCategory ? (selectedCategory as TransactionCategory) : undefined,
                priority: selectedPriority ? (selectedPriority as TransactionPriority) : undefined,
                source: selectedSource ? (selectedSource as TransactionSource) : undefined,
                search: debouncedSearch.trim() || undefined,
                startDate,
                endDate,
                sortBy: sortByField,
                sortDirection: sortDir,
                page,
                limit,
            }),
    });

    const transactions = useMemo(() => paginatedResponse?.data ?? [], [paginatedResponse?.data]);
    const pagination = paginatedResponse?.pagination ?? {
        total: 0,
        totalAmount: 0,
        page: 1,
        totalPages: 1,
        limit,
        offset: 0,
        hasMore: false,
    };

    // Calculate total spend across all matching records (from server pagination.totalAmount),
    // falling back to currently visible records sum if not available
    const filteredTotalAmount = useMemo(() => {
        if (pagination.totalAmount !== undefined) {
            return Number(pagination.totalAmount) || 0;
        }
        return transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    }, [pagination.totalAmount, transactions]);

    // ============================================================
    // MUTATIONS
    // ============================================================

    const createTransactionMutation = useMutation({
        mutationFn: transactionService.createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" });
            setIsCreateModalOpen(false);
            toast.success("Transaction recorded successfully.");
        },
        onError: (err) => {
            console.error("Failed to create transaction:", err);
            toast.error("Failed to record transaction.");
        },
    });

    const updateTransactionMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: CreateTransactionFormData;
        }) => transactionService.updateTransaction(id, data),
        onSuccess: (updatedTx) => {
            queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" });
            setEditingTransaction(null);
            // Refresh detail modal if open for this transaction
            if (selectedDetailTransaction?.id === updatedTx.id) {
                setSelectedDetailTransaction(updatedTx);
            }
            toast.success("Transaction updated successfully.");
        },
        onError: (err) => {
            console.error("Failed to update transaction:", err);
            toast.error("Failed to update transaction.");
        },
    });

    const deleteTransactionMutation = useMutation({
        mutationFn: transactionService.deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" });
            setDeletingTransaction(null);
            if (selectedDetailTransaction) {
                setSelectedDetailTransaction(null);
            }
            toast.success("Transaction deleted successfully.");
        },
        onError: (err) => {
            console.error("Failed to delete transaction:", err);
            toast.error("Failed to delete transaction.");
        },
    });

    // ============================================================
    // ACTION HANDLERS
    // ============================================================

    const handleSubmitTransaction = (data: CreateTransactionFormData) => {
        if (editingTransaction) {
            updateTransactionMutation.mutate({
                id: editingTransaction.id,
                data,
            });
        } else {
            createTransactionMutation.mutate(data);
        }
    };

    const handleSelectTransaction = (transaction: Transaction) => {
        setSelectedDetailTransaction(transaction);
    };

    const handleEdit = (transaction: Transaction) => {
        setIsCreateModalOpen(false);
        setEditingTransaction(transaction);
    };

    const handleDeleteClick = (transaction: Transaction) => {
        setDeletingTransaction(transaction);
    };

    const handleConfirmDelete = (id: number) => {
        deleteTransactionMutation.mutate(id);
    };

    // ============================================================
    // LOADING & ERROR STATES
    // ============================================================

    if (isLoading) {
        return <TransactionsSkeleton />;
    }

    if (error) {
        return (
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center space-y-4">
                <div className="inline-flex p-3 rounded-full bg-rose-50 text-rose-600">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">
                    Failed to load transactions
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    We encountered an issue fetching your transaction history. Please verify your connection and try again.
                </p>
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="btn-interactive inline-flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try Again
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            {/* 1. Page Header */}
            <TransactionsHeader
                onAddTransaction={() => {
                    setEditingTransaction(null);
                    setIsCreateModalOpen(true);
                }}
                onImportStatement={() => setIsImportModalOpen(true)}
                onToggleExplorer={() => setIsExplorerOpen(true)}
                isExplorerOpen={isExplorerOpen}
            />

            {/* 2. Filter & Search Toolbar */}
            <TransactionToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                selectedPriority={selectedPriority}
                onPriorityChange={handlePriorityChange}
                selectedSource={selectedSource}
                onSourceChange={handleSourceChange}
                dateRangePreset={dateRangePreset}
                onDateRangePresetChange={handleDatePresetChange}
                customStartDate={customStartDate}
                onCustomStartDateChange={handleCustomStartDateChange}
                customEndDate={customEndDate}
                onCustomEndDateChange={handleCustomEndDateChange}
                sortBy={sortBy}
                onSortChange={handleSortChange}
                onClearFilters={handleClearFilters}
                filteredCount={pagination.total}
                totalCount={pagination.total}
                filteredTotalAmount={filteredTotalAmount}
            />

            {/* 3. Transaction Ledger (Table / Mobile Cards + Pagination) */}
            <TransactionLedger
                transactions={transactions}
                totalCount={pagination.total}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
                onAddTransaction={() => {
                    setEditingTransaction(null);
                    setIsCreateModalOpen(true);
                }}
                onSelect={handleSelectTransaction}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                isDeleting={deleteTransactionMutation.isPending}
                page={pagination.page}
                totalPages={pagination.totalPages}
                limit={pagination.limit}
                onPageChange={(newPage) => setPage(newPage)}
                onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                }}
            />

            {/* 4. Transaction Detail Modal */}
            <TransactionDetailModal
                isOpen={Boolean(selectedDetailTransaction)}
                transaction={selectedDetailTransaction}
                onClose={() => setSelectedDetailTransaction(null)}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                isDeleting={deleteTransactionMutation.isPending}
            />

            {/* 5. Unified Query Explorer Drawer */}
            <QueryExplorerPanel
                isOpen={isExplorerOpen}
                onClose={() => setIsExplorerOpen(false)}
            />

            {/* 6. Create Transaction Modal */}
            <TransactionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Add Transaction"
                description="Enter transaction details to log a new expense or payment."
            >
                <CreateTransactionForm
                    onSubmit={handleSubmitTransaction}
                    onCancel={() => setIsCreateModalOpen(false)}
                    isSubmitting={createTransactionMutation.isPending}
                />
            </TransactionModal>

            {/* 7. Edit Transaction Modal */}
            <TransactionModal
                isOpen={Boolean(editingTransaction)}
                onClose={() => setEditingTransaction(null)}
                title="Edit Transaction"
                description="Update the details or category for this recorded transaction."
            >
                {editingTransaction && (
                    <CreateTransactionForm
                        transaction={editingTransaction}
                        onSubmit={handleSubmitTransaction}
                        onCancel={() => setEditingTransaction(null)}
                        isSubmitting={updateTransactionMutation.isPending}
                    />
                )}
            </TransactionModal>

            {/* 8. Delete Confirmation Dialog */}
            <DeleteTransactionDialog
                isOpen={Boolean(deletingTransaction)}
                transaction={deletingTransaction}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeletingTransaction(null)}
                isDeleting={deleteTransactionMutation.isPending}
            />

            {/* 9. Bank Statement CSV / XLSX Import Modal */}
            <StatementImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
            />
        </main>
    );
};

export default TransactionsPage;
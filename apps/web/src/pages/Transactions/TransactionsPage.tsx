import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { AlertCircle, RefreshCw } from "lucide-react";

import * as transactionService from "../../services/transaction.service";

import TransactionsHeader from "../../components/transaction/TransactionsHeader";
import TransactionToolbar, { type SortOption } from "../../components/transaction/TransactionToolbar";
import TransactionLedger from "../../components/transaction/TransactionLedger";
import TransactionModal from "../../components/transaction/TransactionModal";
import DeleteTransactionDialog from "../../components/transaction/DeleteTransactionDialog";
import TransactionsSkeleton from "../../components/transaction/TransactionsSkeleton";
import CreateTransactionForm from "../../components/forms/CreateTransactionForm";
import { QueryExplorerPanel } from "../../components/ai/FinanceAIPanel";

import type { Transaction } from "../../types/dashboard.types";
import type { CreateTransactionFormData } from "../../utils/transaction.schema";

const TransactionsPage = () => {
    const queryClient = useQueryClient();

    // Modal & Dialog states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

    // Optional secondary Smart Query Explorer toggle
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);

    // Filter and Sort states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedPriority, setSelectedPriority] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("date_desc");

    // ============================================================
    // FETCH TRANSACTIONS QUERY
    // ============================================================

    const {
        data: transactions = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["transactions"],
        queryFn: transactionService.getMyTransactions,
    });

    // ============================================================
    // MUTATIONS
    // ============================================================

    const createTransactionMutation = useMutation({
        mutationFn: transactionService.createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            setEditingTransaction(null);
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
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            setDeletingTransaction(null);
            toast.success("Transaction deleted successfully.");
        },
        onError: (err) => {
            console.error("Failed to delete transaction:", err);
            toast.error("Failed to delete transaction.");
        },
    });

    // ============================================================
    // FILTERING & SORTING LOGIC
    // ============================================================

    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];

        return transactions
            .filter((tx) => {
                // Category match
                if (selectedCategory && tx.category !== selectedCategory) {
                    return false;
                }

                // Priority match
                if (selectedPriority && tx.priority !== selectedPriority) {
                    return false;
                }

                // Search query match (title, notes, or amount)
                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase().trim();
                    const titleMatch = (tx.title || "").toLowerCase().includes(q);
                    const notesMatch = (tx.notes || "").toLowerCase().includes(q);
                    const amountMatch = String(tx.amount).includes(q);
                    const categoryMatch = tx.category.toLowerCase().includes(q);

                    if (!titleMatch && !notesMatch && !amountMatch && !categoryMatch) {
                        return false;
                    }
                }

                return true;
            })
            .sort((a, b) => {
                if (sortBy === "date_desc") {
                    return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
                }
                if (sortBy === "date_asc") {
                    return new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
                }
                if (sortBy === "amount_desc") {
                    return Number(b.amount) - Number(a.amount);
                }
                if (sortBy === "amount_asc") {
                    return Number(a.amount) - Number(b.amount);
                }
                return 0;
            });
    }, [transactions, searchQuery, selectedCategory, selectedPriority, sortBy]);

    const filteredTotalAmount = useMemo(() => {
        return filteredTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    }, [filteredTransactions]);

    const handleClearFilters = () => {
        setSearchQuery("");
        setSelectedCategory("");
        setSelectedPriority("");
    };

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
                onToggleExplorer={() => setIsExplorerOpen(true)}
                isExplorerOpen={isExplorerOpen}
            />

            {/* 2. Filter & Search Toolbar */}
            {transactions.length > 0 && (
                <TransactionToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    selectedPriority={selectedPriority}
                    onPriorityChange={setSelectedPriority}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    onClearFilters={handleClearFilters}
                    filteredCount={filteredTransactions.length}
                    totalCount={transactions.length}
                    filteredTotalAmount={filteredTotalAmount}
                />
            )}

            {/* 3. Transaction Ledger (Desktop Table + Mobile Cards) */}
            <TransactionLedger
                transactions={filteredTransactions}
                totalCount={transactions.length}
                hasActiveFilters={Boolean(searchQuery || selectedCategory || selectedPriority)}
                onClearFilters={handleClearFilters}
                onAddTransaction={() => {
                    setEditingTransaction(null);
                    setIsCreateModalOpen(true);
                }}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                isDeleting={deleteTransactionMutation.isPending}
            />

            {/* 4. Unified Query Explorer Drawer */}
            <QueryExplorerPanel
                isOpen={isExplorerOpen}
                onClose={() => setIsExplorerOpen(false)}
            />

            {/* 5. Create Transaction Modal */}
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

            {/* 6. Edit Transaction Modal */}
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

            {/* 7. Delete Confirmation Dialog */}
            <DeleteTransactionDialog
                isOpen={Boolean(deletingTransaction)}
                transaction={deletingTransaction}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeletingTransaction(null)}
                isDeleting={deleteTransactionMutation.isPending}
            />
        </main>
    );
};

export default TransactionsPage;
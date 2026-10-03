import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, PiggyBank, RefreshCw, AlertCircle } from "lucide-react";

import * as budgetService from "../../services/budget.service";
import * as dashboardService from "../../services/dashboard.service";

import BudgetsHeader from "../../components/budgets/BudgetsHeader";
import ActiveBudgetCard from "../../components/budgets/ActiveBudgetCard";
import BudgetCard from "../../components/budgets/budgetCard";
import BudgetModal from "../../components/budgets/BudgetModal";
import BudgetsSkeleton from "../../components/budgets/BudgetsSkeleton";
import CreateBudgetForm from "../../components/forms/CreateBudgetForm";
import EditBudgetForm from "../../components/forms/EditBudgetForm";

import type { Budget, BudgetCreationRequest } from "../../types/budget.types";
import type { CreateBudgetFormData } from "../../utils/budget.schema";
import { isBudgetActive } from "../../utils/budgetDateHelpers";

const BudgetsPage = () => {
    const queryClient = useQueryClient();

    // Modal state management
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

    // ============================================================
    // QUERIES
    // ============================================================

    // Fetch user's budget list
    const {
        data: budgets = [],
        isLoading: isLoadingBudgets,
        error: budgetsError,
        refetch: refetchBudgets,
    } = useQuery({
        queryKey: ["budgets"],
        queryFn: budgetService.getMyBudgets,
    });

    // Fetch dashboard data for live spending/usage context against active budget
    const { data: dashboardData } = useQuery({
        queryKey: ["dashboard"],
        queryFn: dashboardService.getDashboardData,
    });

    // Determine the current active budget
    const activeBudget = useMemo(() => {
        if (!budgets || budgets.length === 0) return null;
        // Find budget that covers the current calendar date
        const current = budgets.find((b) =>
            isBudgetActive(b.startDate, b.periodType)
        );
        return current || null;
    }, [budgets]);

    // ============================================================
    // MUTATIONS
    // ============================================================

    const createBudgetMutation = useMutation({
        mutationFn: (data: BudgetCreationRequest) =>
            budgetService.createBudget(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            setIsCreateModalOpen(false);
            toast.success("Budget created successfully.");
        },
        onError: (error) => {
            console.error("Failed to create budget:", error);
            toast.error("Failed to create budget. Please check overlapping dates.");
        },
    });

    const updateBudgetMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: Partial<BudgetCreationRequest>;
        }) => budgetService.updateBudget(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            setEditingBudget(null);
            toast.success("Budget updated successfully.");
        },
        onError: (error) => {
            console.error("Failed to update budget:", error);
            toast.error("Failed to update budget.");
        },
    });

    const deleteBudgetMutation = useMutation({
        mutationFn: budgetService.deleteBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            toast.success("Budget deleted successfully.");
        },
        onError: (error) => {
            console.error("Failed to delete budget:", error);
            toast.error("Failed to delete budget.");
        },
    });

    const lockBudgetMutation = useMutation({
        mutationFn: budgetService.lockBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            toast.success("Budget locked successfully.");
        },
        onError: (error) => {
            console.error("Failed to lock budget:", error);
            toast.error("Failed to lock budget.");
        },
    });

    // ============================================================
    // HANDLERS
    // ============================================================

    const handleCreateBudget = (data: CreateBudgetFormData) => {
        createBudgetMutation.mutate(data);
    };

    const handleUpdateBudget = (data: CreateBudgetFormData) => {
        if (!editingBudget) return;
        updateBudgetMutation.mutate({
            id: editingBudget.id,
            data,
        });
    };

    const handleEdit = (budget: Budget) => {
        setEditingBudget(budget);
    };

    const handleDelete = (id: number) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this budget? This action cannot be undone."
        );
        if (confirmed) {
            deleteBudgetMutation.mutate(id);
        }
    };

    const handleLock = (id: number) => {
        const confirmed = window.confirm(
            "Are you sure you want to lock this budget? Once locked, limits cannot be edited."
        );
        if (confirmed) {
            lockBudgetMutation.mutate(id);
        }
    };

    // ============================================================
    // LOADING & ERROR STATES
    // ============================================================

    if (isLoadingBudgets) {
        return <BudgetsSkeleton />;
    }

    if (budgetsError) {
        return (
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center space-y-4">
                <div className="inline-flex p-3 rounded-full bg-rose-50 text-rose-600">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">
                    Failed to load budgets
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    We encountered an issue fetching your budget data. Please verify your connection and try again.
                </p>
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={() => refetchBudgets()}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try Again
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {/* 1. Header */}
            <BudgetsHeader onAddBudget={() => setIsCreateModalOpen(true)} />

            {/* 2. Active Budget Hero Card */}
            <ActiveBudgetCard
                activeBudget={activeBudget}
                totalSpent={dashboardData?.totalSpent}
                remainingBudget={dashboardData?.remainingBudget}
                budgetUsage={dashboardData?.budgetUsage}
                onEdit={handleEdit}
                onLock={handleLock}
                onCreateClick={() => setIsCreateModalOpen(true)}
            />

            {/* 3. All Budgets Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                            All Budgets
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            {budgets.length}
                        </span>
                    </div>

                    {budgets.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="text-xs font-semibold text-purple-700 hover:text-purple-800 transition-colors cursor-pointer"
                        >
                            + Add another
                        </button>
                    )}
                </div>

                {budgets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
                            <PiggyBank className="w-8 h-8" />
                        </div>
                        <div className="space-y-1 max-w-sm">
                            <h3 className="text-base font-bold text-slate-900">
                                No budgets established yet
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500">
                                Set up your first budget limit to gain real-time visibility over your cash flow and discretionary spending.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-purple-200 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Create First Budget
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {budgets.map((budget) => (
                            <BudgetCard
                                key={budget.id}
                                budget={budget}
                                onEdit={handleEdit}
                                onLock={handleLock}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* 4. Create Budget Modal */}
            <BudgetModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Budget"
                description="Set a spending target for a specific timeframe to stay in control."
            >
                <CreateBudgetForm
                    onSubmit={handleCreateBudget}
                    onCancel={() => setIsCreateModalOpen(false)}
                    isSubmitting={createBudgetMutation.isPending}
                />
            </BudgetModal>

            {/* 5. Edit Budget Modal */}
            <BudgetModal
                isOpen={!!editingBudget}
                onClose={() => setEditingBudget(null)}
                title="Edit Budget Limit"
                description="Update the financial allocation or parameters for this budget."
            >
                {editingBudget && (
                    <EditBudgetForm
                        budget={editingBudget}
                        onSubmit={handleUpdateBudget}
                        onCancel={() => setEditingBudget(null)}
                        isSubmitting={updateBudgetMutation.isPending}
                    />
                )}
            </BudgetModal>
        </main>
    );
};

export default BudgetsPage;
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import BudgetHeroCard from "../../components/dashboard/BudgetHeroCard";
import KPIRow from "../../components/dashboard/KPIRow";
import CategoryDonutChart from "../../components/dashboard/CategoryDonutChart";
import PriorityBreakdown from "../../components/dashboard/PriorityBreakdown";
import RecentTransactions from "../../components/dashboard/RecentTransactions";
import DashboardSkeleton from "../../components/dashboard/DashboardSkeleton";
import { QueryExplorerPanel } from "../../components/ai/FinanceAIPanel";

import * as dashboardService from "../../services/dashboard.service";

const DashboardPage = () => {
    const navigate = useNavigate();
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["dashboard"],
        queryFn: dashboardService.getDashboardData,
    });

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (error || !data) {
        return (
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center space-y-4">
                <div className="inline-flex p-3 rounded-full bg-rose-50 text-rose-600">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">
                    Failed to load dashboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    We encountered an issue fetching your financial metrics. Please check your connection and try again.
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
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {/* 1. Header */}
            <DashboardHeader onOpenExplorer={() => setIsExplorerOpen(true)} />

            {/* 2. Primary 70/30 Spending & Budget Overview */}
            <section
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
                aria-label="Primary Financial Overview"
            >
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                    <BudgetHeroCard
                        budget={data.budget}
                        totalSpent={data.totalSpent}
                        remainingBudget={data.remainingBudget}
                        budgetUsage={data.budgetUsage}
                        onAddTransaction={() => navigate("/transactions")}
                    />
                </div>

                <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
                    <CategoryDonutChart
                        categoryTotals={data.categoryTotals}
                        totalSpent={data.totalSpent}
                    />
                </div>
            </section>

            {/* 3. Compact Key Performance Indicators */}
            <KPIRow
                transactionCount={data.transactionCount}
                totalSpent={data.totalSpent}
                categoryTotals={data.categoryTotals}
            />

            {/* 4. Secondary Analysis & Recent Activity (2-Column Desktop / Stacked Mobile) */}
            <section
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
                aria-label="Secondary Financial Metrics and Activity"
            >
                <PriorityBreakdown
                    priorityTotals={data.priorityTotals}
                    totalSpent={data.totalSpent}
                />

                <RecentTransactions
                    transactions={data.recentTransactions}
                    onViewAll={() => navigate("/transactions")}
                />
            </section>

            {/* 5. Finance One Query Explorer Drawer */}
            <QueryExplorerPanel
                isOpen={isExplorerOpen}
                onClose={() => setIsExplorerOpen(false)}
            />
        </main>
    );
};

export default DashboardPage;
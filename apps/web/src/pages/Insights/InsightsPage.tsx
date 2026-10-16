import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";

import { MonthNavigator } from "../../components/insights/MonthNavigator";
import { MoMComparisonCard } from "../../components/insights/MoMComparisonCard";
import { CategoryInsightsSection } from "../../components/insights/CategoryInsightsSection";
import { SpendingTierCard } from "../../components/insights/SpendingTierCard";
import { TopTransactionsList } from "../../components/insights/TopTransactionsList";
import { SavingsOpportunitiesList } from "../../components/insights/SavingsOpportunitiesList";
import { DataProvenanceCard } from "../../components/insights/DataProvenanceCard";
import { InsightsEmptyState } from "../../components/insights/InsightsEmptyState";
import { InsightsSkeleton } from "../../components/insights/InsightsSkeleton";

import * as insightsService from "../../services/insights.service";

const getCurrentMonthString = (): string => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
};

export const InsightsPage: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString);

    const {
        data: insights,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["insights", selectedMonth],
        queryFn: () => insightsService.getMonthlyInsights(selectedMonth),
    });

    if (isLoading) {
        return <InsightsSkeleton />;
    }

    if (error || !insights) {
        return (
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center space-y-4">
                <div className="inline-flex p-3 rounded-full bg-rose-50 text-rose-600">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">
                    Failed to load monthly insights
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    We encountered an error calculating your monthly spending patterns. Please check your connection and try again.
                </p>
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors"
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
            {/* 1. Month Navigation Header */}
            <MonthNavigator
                selectedMonth={selectedMonth}
                onSelectMonth={setSelectedMonth}
                monthLabel={insights.period.monthLabel}
                isCurrentMonth={insights.period.isCurrentMonth}
            />

            {/* 2. Main Content: Empty State vs Full Insights */}
            {!insights.hasData ? (
                <InsightsEmptyState monthLabel={insights.period.monthLabel} />
            ) : (
                <>
                    {/* Month-Over-Month Comparison & Spend Velocity */}
                    <MoMComparisonCard insights={insights} />

                    {/* Largest Categories & Month-over-Month Category Shifts */}
                    <CategoryInsightsSection
                        topCategories={insights.categoryInsights.topCategories}
                        categoryDeltas={insights.categoryInsights.categoryDeltas}
                        explanation={insights.categoryInsights.explanation}
                    />

                    {/* Essential vs Discretionary Breakdown (Strictly Isolating UNCLASSIFIED) */}
                    <SpendingTierCard
                        tierBreakdown={insights.tierBreakdown}
                    />

                    {/* Largest Single Purchases */}
                    <TopTransactionsList
                        transactions={insights.largestTransactions}
                    />

                    {/* Deterministic Savings Opportunities (Fact vs Suggestion) */}
                    <SavingsOpportunitiesList
                        opportunities={insights.savingsOpportunities}
                    />
                </>
            )}

            {/* 3. Transparent Data Provenance & Methodology Footer */}
            <DataProvenanceCard insights={insights} />
        </main>
    );
};

export default InsightsPage;

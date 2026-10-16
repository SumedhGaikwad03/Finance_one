import React from "react";
import { FolderOpen, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface InsightsEmptyStateProps {
    monthLabel: string;
}

export const InsightsEmptyState: React.FC<InsightsEmptyStateProps> = ({ monthLabel }) => {
    const navigate = useNavigate();

    return (
        <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-indigo-50 text-indigo-600">
                <FolderOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    No expense data for {monthLabel}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    There are no recorded expense transactions during this calendar month. Once you log
                    expenses or import your bank statement, deterministic trends, category shifts, and savings
                    opportunities will appear here.
                </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={() => navigate("/transactions")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add Transaction
                </button>
            </div>
        </div>
    );
};

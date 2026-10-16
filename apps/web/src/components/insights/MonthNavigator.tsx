import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface MonthNavigatorProps {
    selectedMonth: string; // YYYY-MM
    onSelectMonth: (month: string) => void;
    monthLabel: string;
    isCurrentMonth: boolean;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
    selectedMonth,
    onSelectMonth,
    monthLabel,
    isCurrentMonth,
}) => {
    const handlePrevMonth = () => {
        const [yearStr, monthStr] = selectedMonth.split("-");
        let year = parseInt(yearStr, 10);
        let month = parseInt(monthStr, 10) - 1; // 1-based to 0-based
        if (month === 0) {
            year -= 1;
            month = 12;
        }
        onSelectMonth(`${year}-${String(month).padStart(2, "0")}`);
    };

    const handleNextMonth = () => {
        const [yearStr, monthStr] = selectedMonth.split("-");
        let year = parseInt(yearStr, 10);
        let month = parseInt(monthStr, 10) + 1;
        if (month > 12) {
            year += 1;
            month = 1;
        }
        onSelectMonth(`${year}-${String(month).padStart(2, "0")}`);
    };

    const handleGoToCurrentMonth = () => {
        const now = new Date();
        const curMonthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
        onSelectMonth(curMonthStr);
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
                    <Calendar className="w-5 h-5" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                            {monthLabel}
                        </h2>
                        {isCurrentMonth && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700">
                                Current Month
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500">
                        Monthly spending patterns and deterministic insights
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="relative">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => {
                            if (e.target.value) {
                                onSelectMonth(e.target.value);
                            }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        aria-label="Select month"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Next month"
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {!isCurrentMonth && (
                    <button
                        type="button"
                        onClick={handleGoToCurrentMonth}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer ml-1"
                    >
                        Today
                    </button>
                )}
            </div>
        </div>
    );
};

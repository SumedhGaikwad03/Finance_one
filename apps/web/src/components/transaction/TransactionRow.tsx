import React from "react";
import { Edit2, Trash2, Building2, FileText } from "lucide-react";
import type { Transaction } from "../../types/dashboard.types";
import { CategoryBadge, PriorityBadge } from "./TransactionBadge";

interface TransactionRowProps {
    transaction: Transaction;
    onSelect?: (transaction: Transaction) => void;
    onEdit: (transaction: Transaction) => void;
    onDelete: (transaction: Transaction) => void;
    isDeleting?: boolean;
}

const getSourceIcon = (source?: string) => {
    switch (source) {
        case "BANK_STATEMENT":
            return (
                <span title="Bank Statement">
                    <Building2 className="w-3 h-3 text-blue-500" />
                </span>
            );
        case "CSV_IMPORT":
            return (
                <span title="CSV Import">
                    <FileText className="w-3 h-3 text-teal-500" />
                </span>
            );
        case "MANUAL":
        default:
            return null;
    }
};

export const TransactionRow = ({
    transaction,
    onSelect,
    onEdit,
    onDelete,
    isDeleting = false,
}: TransactionRowProps) => {
    const formattedDate = new Date(transaction.transactionDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    const formattedTime = new Date(transaction.transactionDate).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });

    const amountNumber = Number(transaction.amount);
    const sourceIcon = getSourceIcon(transaction.source);

    const handleRowClick = () => {
        if (onSelect) {
            onSelect(transaction);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onSelect(transaction);
        }
    };

    return (
        <tr
            onClick={handleRowClick}
            onKeyDown={handleKeyDown}
            tabIndex={onSelect ? 0 : undefined}
            role={onSelect ? "button" : undefined}
            aria-label={`View details for ${transaction.title || "transaction"}`}
            className="hover:bg-purple-50/30 transition-colors border-b border-slate-100 last:border-b-0 group cursor-pointer focus:outline-none focus:bg-purple-50/50"
        >
            {/* Date */}
            <td className="py-3.5 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                <div className="font-semibold text-slate-700">{formattedDate}</div>
                <div className="text-[10px] text-slate-400 font-normal">{formattedTime}</div>
            </td>

            {/* Transaction Title, Notes & Source */}
            <td className="py-3.5 px-4 min-w-[180px]">
                <div className="flex items-center gap-1.5">
                    {sourceIcon}
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {transaction.title || "Untitled Transaction"}
                    </span>
                </div>
                {transaction.notes && (
                    <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                        {transaction.notes}
                    </p>
                )}
            </td>

            {/* Category Badge */}
            <td className="py-3.5 px-4 whitespace-nowrap">
                <CategoryBadge category={transaction.category} />
            </td>

            {/* Priority Badge */}
            <td className="py-3.5 px-4 whitespace-nowrap">
                <PriorityBadge priority={transaction.priority} />
            </td>

            {/* Amount */}
            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                    ₹{amountNumber.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </td>

            {/* Actions */}
            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(transaction);
                        }}
                        disabled={isDeleting}
                        aria-label={`Edit ${transaction.title || "transaction"}`}
                        className="btn-interactive p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(transaction);
                        }}
                        disabled={isDeleting}
                        aria-label={`Delete ${transaction.title || "transaction"}`}
                        className="btn-interactive p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default TransactionRow;

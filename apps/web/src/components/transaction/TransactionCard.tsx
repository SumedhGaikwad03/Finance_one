import React from "react";
import { Edit2, Trash2, Calendar, Building2, FileText } from "lucide-react";
import type { Transaction } from "../../types/dashboard.types";
import { CategoryBadge, PriorityBadge } from "./TransactionBadge";

interface TransactionCardProps {
    transaction: Transaction;
    onSelect?: (transaction: Transaction) => void;
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: number) => void;
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

export const TransactionCard = ({
    transaction,
    onSelect,
    onEdit,
    onDelete,
    isDeleting = false,
}: TransactionCardProps) => {
    const formattedDate = new Date(transaction.transactionDate).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });

    const amountNumber = Number(transaction.amount);
    const sourceIcon = getSourceIcon(transaction.source);

    const handleCardClick = () => {
        if (onSelect) {
            onSelect(transaction);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onSelect(transaction);
        }
    };

    return (
        <article
            onClick={handleCardClick}
            onKeyDown={handleKeyDown}
            tabIndex={onSelect ? 0 : undefined}
            role={onSelect ? "button" : undefined}
            aria-label={`View details for ${transaction.title || "transaction"}`}
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 cursor-pointer hover:border-purple-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
        >
            {/* Top Row: Title & Amount */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        {sourceIcon}
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                            {transaction.title || "Untitled Transaction"}
                        </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium pt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{formattedDate}</span>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <span className="text-base font-extrabold text-slate-900 tracking-tight">
                        ₹{amountNumber.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={transaction.category} />
                <PriorityBadge priority={transaction.priority} />
            </div>

            {/* Optional Notes */}
            {transaction.notes && (
                <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 line-clamp-2">
                    {transaction.notes}
                </p>
            )}

            {/* Actions Toolbar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-purple-600">
                    Tap to view details &rarr;
                </span>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(transaction);
                        }}
                        disabled={isDeleting}
                        aria-label={`Edit ${transaction.title || "transaction"}`}
                        className="btn-interactive inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(transaction.id);
                        }}
                        disabled={isDeleting}
                        aria-label={`Delete ${transaction.title || "transaction"}`}
                        className="btn-interactive inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        </article>
    );
};

export default TransactionCard;
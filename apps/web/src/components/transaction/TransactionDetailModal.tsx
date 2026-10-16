import React, { useEffect, useRef } from "react";
import {
    X,
    Calendar,
    Tag,
    FileText,
    CreditCard,
    Edit2,
    Trash2,
    CheckCircle2,
    Hash,
    Building2,
} from "lucide-react";
import type { Transaction } from "../../types/dashboard.types";
import { CategoryBadge, PriorityBadge } from "./TransactionBadge";

export interface TransactionDetailModalProps {
    isOpen: boolean;
    transaction: Transaction | null;
    onClose: () => void;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (transaction: Transaction) => void;
    isDeleting?: boolean;
}

const getSourceLabel = (source?: string) => {
    switch (source) {
        case "BANK_STATEMENT":
            return { label: "Bank Statement", icon: Building2, color: "text-blue-700 bg-blue-50 border-blue-200" };
        case "CSV_IMPORT":
            return { label: "CSV File Import", icon: FileText, color: "text-teal-700 bg-teal-50 border-teal-200" };
        case "RECEIPT_OCR":
            return { label: "Receipt Scan", icon: CreditCard, color: "text-amber-700 bg-amber-50 border-amber-200" };
        case "SYSTEM":
            return { label: "System Generated", icon: CheckCircle2, color: "text-slate-700 bg-slate-50 border-slate-200" };
        case "MANUAL":
        default:
            return { label: "Manual Entry", icon: CreditCard, color: "text-purple-700 bg-purple-50 border-purple-200" };
    }
};

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
    isOpen,
    transaction,
    onClose,
    onEdit,
    onDelete,
    isDeleting = false,
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Keyboard support: Close on Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !transaction) {
        return null;
    }

    const sourceInfo = getSourceLabel(transaction.source);
    const SourceIcon = sourceInfo.icon;

    const formattedDate = new Date(transaction.transactionDate).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const formattedTime = new Date(transaction.transactionDate).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
    });

    const amountNumber = Number(transaction.amount);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-detail-title"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={dialogRef}
                className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 id="transaction-detail-title" className="text-sm font-bold text-slate-900">
                                Transaction Details
                            </h2>
                            <p className="text-[11px] text-slate-400">ID: #{transaction.id}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        aria-label="Close transaction details"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                    {/* Amount Banner */}
                    <div className="text-center py-4 px-6 bg-radial from-purple-50/50 to-slate-50/50 rounded-2xl border border-purple-100/60">
                        <span className="text-[11px] font-bold tracking-wider text-purple-600 uppercase">
                            Expense Amount
                        </span>
                        <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
                            ₹{amountNumber.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="mt-2 text-xs font-semibold text-slate-700 truncate max-w-sm mx-auto">
                            {transaction.title || "Untitled Transaction"}
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        {/* Category */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-[11px] font-medium text-slate-400">Category</span>
                            <div>
                                <CategoryBadge category={transaction.category} />
                            </div>
                        </div>

                        {/* Priority / Spending Tier */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-[11px] font-medium text-slate-400">Spending Tier</span>
                            <div>
                                <PriorityBadge priority={transaction.priority} />
                            </div>
                        </div>

                        {/* Transaction Date */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                <Calendar className="w-3 h-3" />
                                <span>Date & Time</span>
                            </div>
                            <div className="font-semibold text-slate-800">{formattedDate}</div>
                            <div className="text-[10px] text-slate-400">{formattedTime}</div>
                        </div>

                        {/* Source */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                <SourceIcon className="w-3 h-3" />
                                <span>Source</span>
                            </div>
                            <div>
                                <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${sourceInfo.color}`}
                                >
                                    <SourceIcon className="w-3 h-3" />
                                    {sourceInfo.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Statement / External ID Reference */}
                    {transaction.externalId && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-500 font-medium">External Reference:</span>
                            </div>
                            <span className="font-mono text-[11px] text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {transaction.externalId}
                            </span>
                        </div>
                    )}

                    {/* Notes Section */}
                    {transaction.notes && (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <FileText className="w-3.5 h-3.5" />
                                <span>Notes & Narration</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {transaction.notes}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {transaction.tags && transaction.tags.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <Tag className="w-3.5 h-3.5" />
                                <span>Tags</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {transaction.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer / Actions */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <div>
                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onDelete(transaction);
                                }}
                                disabled={isDeleting}
                                className="btn-interactive inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onEdit(transaction);
                                }}
                                className="btn-interactive inline-flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-interactive px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailModal;

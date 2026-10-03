import { Edit2, Trash2, Calendar } from "lucide-react";
import type { Transaction } from "../../types/dashboard.types";
import { CategoryBadge, PriorityBadge } from "./TransactionBadge";

interface TransactionCardProps {
    transaction: Transaction;
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: number) => void;
    isDeleting?: boolean;
}

const TransactionCard = ({
    transaction,
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

    return (
        <article className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            {/* Top Row: Title & Amount */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                        {transaction.title || "Untitled Transaction"}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium pt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{formattedDate}</span>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <span className="text-base font-extrabold text-slate-900 tracking-tight">
                        ₹{amountNumber.toLocaleString()}
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
                <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    {transaction.notes}
                </p>
            )}

            {/* Actions Toolbar */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                    type="button"
                    onClick={() => onEdit(transaction)}
                    disabled={isDeleting}
                    className="btn-interactive inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                </button>

                <button
                    type="button"
                    onClick={() => onDelete(transaction.id)}
                    disabled={isDeleting}
                    className="btn-interactive inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                </button>
            </div>
        </article>
    );
};

export default TransactionCard;
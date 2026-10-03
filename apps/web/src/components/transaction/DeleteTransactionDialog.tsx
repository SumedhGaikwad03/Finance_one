import { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import type { Transaction } from "../../types/dashboard.types";

interface DeleteTransactionDialogProps {
    isOpen: boolean;
    transaction: Transaction | null;
    onConfirm: (id: number) => void;
    onCancel: () => void;
    isDeleting?: boolean;
}

const DeleteTransactionDialog = ({
    isOpen,
    transaction,
    onConfirm,
    onCancel,
    isDeleting = false,
}: DeleteTransactionDialogProps) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !isDeleting) {
                onCancel();
            }
        };

        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onCancel, isDeleting]);

    if (!isOpen || !transaction) return null;

    const title = transaction.title || "Untitled Transaction";
    const amount = Number(transaction.amount).toLocaleString();

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
        >
            <div
                className="fixed inset-0"
                onClick={() => !isDeleting && onCancel()}
                aria-hidden="true"
            />

            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-6 z-10 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h2
                                id="delete-dialog-title"
                                className="text-base font-bold text-slate-900 tracking-tight"
                            >
                                Delete Transaction?
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        aria-label="Close dialog"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Target item preview */}
                <div
                    id="delete-dialog-desc"
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs"
                >
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 truncate">
                            {title}
                        </span>
                        <span className="font-extrabold text-slate-900">
                            ₹{amount}
                        </span>
                    </div>
                    <p className="text-slate-500">
                        Category: {transaction.category} · Priority: {transaction.priority}
                    </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="btn-interactive px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={() => onConfirm(transaction.id)}
                        disabled={isDeleting}
                        className="btn-interactive inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isDeleting ? "Deleting..." : "Delete Transaction"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteTransactionDialog;

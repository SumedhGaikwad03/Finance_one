import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
}

const TransactionModal = ({
    isOpen,
    onClose,
    title,
    description,
    children,
}: TransactionModalProps) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
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
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-xl border border-slate-200 z-10 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
                    <div className="space-y-0.5">
                        <h2
                            id="transaction-modal-title"
                            className="text-lg font-bold text-slate-900 tracking-tight"
                        >
                            {title}
                        </h2>
                        {description && (
                            <p className="text-xs text-slate-500 font-medium">
                                {description}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        aria-label="Close dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default TransactionModal;

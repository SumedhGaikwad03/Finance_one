import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as transactionService from "../../services/transaction.service";
import { clientParseQuickTransaction } from "../../utils/quickTransactionParser";
import "./QuickAddTransaction.css";

interface QuickAddTransactionProps {
    onSuccess?: () => void;
    onExpandFullForm?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
    FOOD: "🍔",
    FUEL: "⛽",
    SHOPPING: "🛍️",
    BILLS: "📄",
    ENTERTAINMENT: "🎬",
    HEALTH: "💊",
    TRAVEL: "🚕",
    EDUCATION: "📚",
    SUBSCRIPTION: "📺",
    GIFT: "🎁",
    OTHER: "💳"
};

const SUGGESTIONS = [
    "450 lunch",
    "₹350 uber",
    "120 coffee",
    "649 netflix",
    "1500 groceries",
    "spent 800 dinner"
];

export const QuickAddTransaction: React.FC<QuickAddTransactionProps> = ({
    onSuccess,
    onExpandFullForm
}) => {
    const queryClient = useQueryClient();
    const [quickText, setQuickText] = useState("");

    const parsed = useMemo(() => {
        return clientParseQuickTransaction(quickText);
    }, [quickText]);

    const quickAddMutation = useMutation({
        mutationFn: transactionService.createQuickTransaction,
        onSuccess: (newTx) => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            toast.success(`Added ₹${newTx.amount} for ${newTx.title || newTx.category}!`);
            setQuickText("");
            if (onSuccess) onSuccess();
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || "Failed to create transaction";
            toast.error(msg);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = quickText.trim();
        if (!trimmed) {
            toast.error("Please enter a transaction (e.g. '450 lunch')");
            return;
        }

        if (!parsed.amount || parsed.amount <= 0) {
            toast.error("Please include an amount (e.g. '450 lunch' or '₹120 coffee')");
            return;
        }

        quickAddMutation.mutate({
            text: trimmed
        });
    };

    const handleSuggestionClick = (suggestion: string) => {
        setQuickText(suggestion);
    };

    const hasAmount = parsed.amount !== null && parsed.amount > 0;

    return (
        <section className="quick-add-card" aria-label="Fast Transaction Entry">
            <div className="quick-add-header">
                <div className="quick-add-title-group">
                    <span className="quick-add-badge">⚡ Quick Add</span>
                    <h3>Fast Transaction</h3>
                </div>
                {onExpandFullForm && (
                    <button
                        type="button"
                        onClick={onExpandFullForm}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#2563eb",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            fontWeight: 600
                        }}
                    >
                        Detailed Form ↗
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="quick-add-form">
                <div className="quick-add-input-wrapper">
                    <input
                        type="text"
                        className="quick-add-input"
                        placeholder="Type something like '450 lunch' or '₹350 uber'..."
                        value={quickText}
                        onChange={(e) => setQuickText(e.target.value)}
                        disabled={quickAddMutation.isPending}
                        autoComplete="off"
                    />
                    <button
                        type="submit"
                        className="quick-add-submit-btn"
                        disabled={quickAddMutation.isPending || !quickText.trim() || !hasAmount}
                    >
                        {quickAddMutation.isPending ? "Adding..." : "⚡ Add"}
                    </button>
                </div>

                {quickText.trim() && (
                    <div className="quick-add-preview">
                        <span className="preview-label">Interpreted:</span>
                        {hasAmount ? (
                            <span className="preview-chip amount">
                                ₹{parsed.amount}
                            </span>
                        ) : (
                            <span className="preview-chip" style={{ color: "#ef4444" }}>
                                ⚠️ Missing amount
                            </span>
                        )}

                        <span className="preview-chip category">
                            {CATEGORY_ICONS[parsed.category] || "💳"} {parsed.category}
                        </span>

                        <span className="preview-chip title">
                            🏷️ {parsed.title}
                        </span>

                        <span className="preview-chip priority">
                            {parsed.priority}
                        </span>
                    </div>
                )}

                <div className="quick-add-suggestions">
                    <span className="suggestion-label">Try:</span>
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            className="suggestion-pill"
                            onClick={() => handleSuggestionClick(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </form>
        </section>
    );
};

export default QuickAddTransaction;

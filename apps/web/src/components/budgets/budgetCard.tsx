import type { Budget } from "../../types/budget.types";

interface BudgetCardProps {
    budget: Budget;
    onEdit: (budget: Budget) => void;
    onDelete: (id: number) => void;
    onLock: (id: number) => void;
}

const BudgetCard = ({
    budget,
    onDelete,
    onEdit,
    onLock,
}: BudgetCardProps) => {

    return (
        <article>

            <h3>
                ₹{budget.amount}
            </h3>

            <p>
                Period: {budget.periodType}
            </p>

            <p>
                Start Date:{" "}
                {new Date(
                    budget.startDate
                ).toLocaleDateString()}
            </p>

            <p>
                Lock Status:{" "}
                {budget.isLocked
                    ? "Locked"
                    : "Unlocked"}
            </p>

            <div>

                {!budget.isLocked && (
                    <>
                        <button
                            type="button"
                            onClick={() => onEdit(budget)}
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={() => onLock(budget.id)}
                        >
                            Lock
                        </button>
                    </>
                )}

                <button
                    type="button"
                    onClick={() => onDelete(budget.id)}
                >
                    Delete
                </button>

                <button
                    type="button"
                >
                    View
                </button>

            </div>

        </article>
    );
};

export default BudgetCard;
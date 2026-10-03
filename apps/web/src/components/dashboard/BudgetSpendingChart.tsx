import { formatPercentage, clampPercentage } from "../../utils/formatters";
import "./Dashboard.css";

interface BudgetSpendingChartProps {
    // Total amount available in the active budget.
    budget: string;

    // Total amount spent from the active budget.
    spent: string;

    // Percentage of the budget that has been used.
    usage: string | number;
}

// Displays how much of the current budget has been spent.
const BudgetSpendingChart = ({
    budget,
    spent,
    usage,
}: BudgetSpendingChartProps) => {
    const budgetAmount = Number(budget);
    const spentAmount = Number(spent);

    // If there is no active budget, there is nothing
    // meaningful to represent with a spending donut.
    if (budgetAmount <= 0) {
        return (
            <div className="budget-spending-chart">
                <div className="budget-spending-chart-header">
                    <h2>Budget Spending</h2>
                    <p>No active budget</p>
                </div>
            </div>
        );
    }

    // Convert the spending percentage into a clamped value
    // that can be used safely by CSS conic-gradient.
    const rawRatio = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
    const spentPercentage = clampPercentage(rawRatio, 0, 100);

    return (
        <div className="budget-spending-chart">
            <div className="budget-spending-chart-header">
                <h2>Budget Spending</h2>
                <p>Spending against your current budget.</p>
            </div>

            <div className="budget-spending-chart-content">
                <div
                    className="budget-spending-donut"
                    style={{
                        background: `conic-gradient(
                            #0f766e ${spentPercentage}%,
                            #e9d5ff ${spentPercentage}% 100%
                        )`,
                    }}
                >
                    <div className="budget-spending-donut-center">
                        <strong>
                            {formatPercentage(usage)}
                        </strong>
                        <span>Used</span>
                    </div>
                </div>

                <div className="budget-spending-details">
                    <div>
                        <span className="budget-spending-label">
                            Total Budget
                        </span>
                        <span className="budget-spending-value">
                            ₹{budgetAmount.toLocaleString()}
                        </span>
                    </div>
                    <div>
                        <span className="budget-spending-label">
                            Total Spent
                        </span>
                        <span className="budget-spending-value">
                            ₹{spentAmount.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetSpendingChart;
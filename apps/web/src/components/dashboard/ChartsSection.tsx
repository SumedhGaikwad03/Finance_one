import CategoryChart from "./CategoryCharts";
import PriorityChart from "./PriorityChart";
import BudgetSpendingChart from "./BudgetSpendingChart";

import "./Dashboard.css";


// Props required for displaying all dashboard charts.
type ChartsSectionProps = {

    categoryTotals: Record<string, string>;

    priorityTotals: Record<string, string>;

    budget: string;

    spent: string;

    usage: string;

};


// Responsible only for arranging the dashboard charts.
const ChartsSection = ({

    categoryTotals, // receives category spending data from the parent

    priorityTotals, // receives priority spending data from the parent

    budget, // receives the total active budget

    spent, // receives the total amount spent

    usage, // receives the percentage of budget used

}: ChartsSectionProps) => {


    return (

        <section className="dashboard-charts">


            {/* Displays spending grouped by transaction category. */}

            <CategoryChart

                categoryTotals={
                    categoryTotals
                }

            />


            {/* Displays spending grouped by transaction priority. */}

            <PriorityChart

                priorityTotals={
                    priorityTotals
                }

            />


            {/* Displays how much of the current budget
                has already been spent. */}

            <BudgetSpendingChart

                budget={
                    budget
                }

                spent={
                    spent
                }

                usage={
                    usage
                }

            />


        </section>

    );

};


export default ChartsSection;
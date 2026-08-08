import CategoryChart from "./CategoryCharts";
import PriorityChart from "./PriorityChart";

// Props required for displaying both charts.
type ChartsSectionProps = {

    categoryTotals: Record<string, string>;

    priorityTotals: Record<string, string>;

};

// Responsible only for arranging both charts.
const ChartsSection = ({

    categoryTotals,

    priorityTotals,

}: ChartsSectionProps) => {

    return (

        <section>

            <CategoryChart

                categoryTotals={categoryTotals}

            />

            <PriorityChart

                priorityTotals={priorityTotals}

            />

        </section>

    );

};

export default ChartsSection;
import CategoryChart from "./CategoryCharts";
import PriorityChart from "./PriorityChart";

// Props required for displaying both charts.
type ChartsSectionProps = {

    categoryTotals: Record<string, string>;

    priorityTotals: Record<string, string>;

};

// Responsible only for arranging both charts.
const ChartsSection = ({

    categoryTotals, // receives the info from thr parent 

    priorityTotals,

}: ChartsSectionProps) => { // expexts a jsx object in this structure to return 

    return (

        <section>

            <CategoryChart // again a sub child 

                categoryTotals={categoryTotals}

            />

            <PriorityChart

                priorityTotals={priorityTotals}

            />

        </section>

    );

};

export default ChartsSection;
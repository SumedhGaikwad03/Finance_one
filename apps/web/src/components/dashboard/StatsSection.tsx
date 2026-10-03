import StatCard from "./StatCard";
import "./Dashboard.css";


// Props required for the stats section.


type StatsSectionProps = {

    budget: string;

    spent: string;

    remaining: string;

    usage: string;

};


// Displays the main financial statistics on the dashboard.
const StatsSection = ({

    budget, // all of these props are received from the parent via the call to this function
    spent,
    remaining,
    usage,

}: StatsSectionProps) => { // the o/p of this function is an jsx element in this structure

    return (

        <section className="dashboard-stats">

            <StatCard // here again this is child of stats section
                title="Total Budget"
                value={budget}
            />

            <StatCard
                title="Total Spent"
                value={spent}
            />

            <StatCard
                title="Remaining Budget"
                value={remaining}
            />

            <StatCard
                title="Budget Usage"
                value={usage}
            />

        </section>

    );

};


export default StatsSection;
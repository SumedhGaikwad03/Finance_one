import "./Dashboard.css";

type StatCardProps = {

    title: string;

    value: string;

};


// Displays a single financial statistic on the dashboard.
const StatCard = ({

    title,

    value,

}: StatCardProps) => { // takes these two properties from StatsSection as title and value

    return (

        <article className="stat-card">

            <h3>

                {title}

            </h3>

            <p>

                {value}

            </p>

        </article>

    );

};


export default StatCard;
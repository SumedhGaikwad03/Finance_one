import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

import "./Dashboard.css";

const PRIORITY_COLORS = [
    "#0f766e", // teal
    "#7c3aed", // purple
    "#0891b2", // cyan
];

type PriorityChartProps = {

    // Object received from the dashboard API.
    // Example:
    // {
    //     ESSENTIAL: "8449",
    //     LUXURY: "7280"
    // }

    priorityTotals: Record<string, string>;

};


// Displays the spending breakdown by priority.
const PriorityChart = ({

    priorityTotals,

}: PriorityChartProps) => {

    // Recharts expects an array of objects rather than
    // the object structure returned by our backend.
    const chartData = Object.entries(priorityTotals).map(

        ([priority, amount]) => ({

            name: priority,

            value: Number(amount),

        })

    );


    return (

        <article className="dashboard-chart-card">

            <h2>

                Priority Breakdown

            </h2>

            <div className="dashboard-chart">

                <ResponsiveContainer
                    width="100%"
                    height={280}
                >

                    <PieChart>

                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                        >

                         {chartData.map((entry, index) => (

    <Cell
        key={`cell-${entry.name}-${index}`}
        fill={
            PRIORITY_COLORS[
                index % PRIORITY_COLORS.length
            ]
        }
    />

))}

                        </Pie>

                        <Tooltip
                            formatter={(value) =>
                                `₹${value}`
                            }
                        />

                        <Legend />

                    </PieChart>

                </ResponsiveContainer>

            </div>

        </article>

    );

};


export default PriorityChart;
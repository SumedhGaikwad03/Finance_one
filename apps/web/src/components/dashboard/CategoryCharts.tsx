import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

import "./Dashboard.css";


const CATEGORY_COLORS = [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#dc2626",
    "#9333ea",
    "#0891b2",
    "#ea580c",
    "#4f46e5",
    "#db2777",
    "#65a30d",
    "#64748b",
];


type CategoryChartProps = {

    // Object received from the dashboard API.
    // Example:
    // {
    //     FOOD: "4480",
    //     TRAVEL: "6500"
    // }

    categoryTotals: Record<string, string>;

};


// Displays the spending breakdown by category.
const CategoryChart = ({

    categoryTotals,

}: CategoryChartProps) => {

    // Recharts expects an array of objects rather than
    // the object structure returned by our backend.
    const chartData = Object.entries(categoryTotals).map(

        ([category, amount]) => ({

            name: category,

            value: Number(amount),

        })

    );


    return (

        <article className="dashboard-chart-card">

            <h2>

                Category Breakdown

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
                            outerRadius={90}
                        >

                           {chartData.map((entry, index) => (

    <Cell
        key={`cell-${entry.name}-${index}`}
        fill={
            CATEGORY_COLORS[
                index % CATEGORY_COLORS.length
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


export default CategoryChart;
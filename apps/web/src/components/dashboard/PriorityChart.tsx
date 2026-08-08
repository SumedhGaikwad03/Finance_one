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

    return (

        <div>

            <h2>

                Priority Breakdown

            </h2>

            {/* Temporary display.
                Later this will become a Doughnut Chart. */}

            {Object.entries(priorityTotals).map( // this line converts the given object to an array 

                ([priority, amount]) => ( // this is the structure of that array 

                    <p key={priority}>

                        {priority} : ₹{amount}

                    </p>

                )

            )}

        </div>

    );

};

export default PriorityChart;
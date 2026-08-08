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
// this is essentialy oir function that is called by our dashboard 
    categoryTotals,

}: CategoryChartProps) => {

    return (

        <div>

            <h2>

                Category Breakdown

            </h2>

            {/* Temporary display.
                Later this will become a Pie Chart. */}

            {Object.entries(categoryTotals).map(

                ([category, amount]) => (

                    <p key={category}>

                        {category} : ₹{amount}

                    </p>

                )

            )}

        </div>

    );

};

export default CategoryChart;
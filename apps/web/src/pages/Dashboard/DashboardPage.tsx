import { useQuery } from "@tanstack/react-query";

import { useNavigate } from "react-router-dom";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatsSection from "../../components/dashboard/StatsSection";
import ChartsSection from "../../components/dashboard/ChartsSection";
import RecentTransactions from "../../components/dashboard/RecentTransactions";

import * as dashboardService from "../../services/dashboard.service";

const DashboardPage = () => {

    const navigate = useNavigate();

    const {

        data, // this the data that is revied via the api call to the backend 

        isLoading, // derived form the tan stack query same goes for erroe 

        error,

    } = useQuery({

        queryKey: ["dashboard"],

        queryFn: dashboardService.getDashboardData, // tan staack query to fetch entire dashboard in a hit  , this runs first then we get data and all
        // that is defined above 

    });

    if (isLoading) {

        return <h1>Loading Dashboard...</h1>;

    }

    if (error || !data) {

        return <h1>Failed to load dashboard.</h1>;

    }

    return (

        <main>

            <DashboardHeader

                username="Sumedh"

            />
 
            <StatsSection
// this is basic layout of data 
                budget={
                    data.budget
                        ? `₹${data.budget.amount}`
                        : "Nil"
                }

                spent={`₹${data.totalSpent}`}

                remaining={
                    data.remainingBudget !== null
                        ? `₹${data.remainingBudget}`
                        : "Nil"
                }

                usage={
                    data.budgetUsage !== null
                        ? `${data.budgetUsage}%`
                        : "Nil"
                }

            />

            <button
                type="button"
                onClick={() => navigate("/transactions")} // navigates to new page in data 
            >
                Add Transaction
            </button>

            <ChartsSection

                categoryTotals={data.categoryTotals}

                priorityTotals={data.priorityTotals}

            />

            <RecentTransactions

                transactions={data.recentTransactions}

            />

        </main>

    );

};

export default DashboardPage;
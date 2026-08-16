import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import * as budgetService from "../../services/budget.service";

import CreateBudgetForm from "../../components/forms/CreateBudgetForm";

import type {
    CreateBudgetFormData,
} from "../../utils/budget.schema";



const BudgetsPage = () => {

    const {
        data: budgets,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["budgets"],
        queryFn: budgetService.getMyBudgets,
    });


    
const queryClient = useQueryClient(); 



const createBudgetMutation = useMutation({

    mutationFn: budgetService.createBudget,

    onSuccess: () => {

        queryClient.invalidateQueries({
            queryKey: ["budgets"],
        });

    },

    onError: (error) => {

        console.error(
            "Failed to create budget:",
            error
        );

    },

});

    const handleCreateBudget = (
        data: CreateBudgetFormData
    ) => {

        createBudgetMutation.mutate(data);

    };


    if (isLoading) {
        return <h1>Loading Budgets...</h1>;
    }


    if (error) {
        return <h1>Failed to load budgets.</h1>;
    }


    return (
        <main>

            <h1>My Budgets</h1>


            <CreateBudgetForm
                onSubmit={handleCreateBudget}
            />


            <section>

                <h2>Existing Budgets</h2>

                {budgets?.length === 0 ? (

                    <p>No budgets found.</p>

                ) : (

                    budgets?.map((budget) => (

                        <div key={budget.id}>

                            <h3>
                                ₹{budget.amount}
                            </h3>

                            <p>
                                Period: {budget.periodType}
                            </p>

                            <p>
                                Start Date:{" "}
                                {new Date(
                                    budget.startDate
                                ).toLocaleDateString()}
                            </p>

                            <p>
    Lock Status:{" "}
    {budget.isLocked
        ? "Locked"
        : "Unlocked"}
</p>

                        </div>

                    ))

                )}

            </section>

        </main>
    );
};

export default BudgetsPage;
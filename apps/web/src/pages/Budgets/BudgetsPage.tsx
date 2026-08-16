import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import * as budgetService from "../../services/budget.service";

import CreateBudgetForm from "../../components/forms/CreateBudgetForm";

import * as BudgetInterface from "../../types/budget.types";

import type {
    CreateBudgetFormData,
} from "../../utils/budget.schema";

import BudgetCard from "../../components/budgets/budgetCard";

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

    const handleDelete = (id: number) => {

    const confirmed = window.confirm(
        "Are you sure you want to delete this budget?"
    );

    if (!confirmed) {
        return;
    }

    deleteBudgetMutation.mutate(id);
};


   const updateBudgetMutation = useMutation({

    mutationFn: ({
        id,
        data,
    }: {
        id: number;
        data: Partial<BudgetInterface.BudgetCreationRequest>;
    }) =>
        budgetService.updateBudget(id, data),

    onSuccess: () => {

        queryClient.invalidateQueries({
            queryKey: ["budgets"],
        });

    },

    onError: (error) => {

        console.error(
            "Failed to update budget:",
            error
        );

    },

});

const deleteBudgetMutation = useMutation({

    mutationFn: budgetService.deleteBudget,

    onSuccess: () => {

        queryClient.invalidateQueries({
            queryKey: ["budgets"],
        });

    },

    onError: (error) => {

        console.error(
            "Failed to delete budget:",
            error
        );

    },

});




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

    <BudgetCard
    key={budget.id}
    budget={budget}
    onEdit={(budget) => {
        console.log("Edit:", budget);
    }}
    onLock={(id) => {
        console.log("Lock:", id);
    }}
    onDelete={handleDelete}
/>
                    ))

                )}

            </section>

        </main>
    );
};

export default BudgetsPage;
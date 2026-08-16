import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import { useState } from "react";
import * as budgetService from "../../services/budget.service";

import CreateBudgetForm from "../../components/forms/CreateBudgetForm";

import * as BudgetInterface from "../../types/budget.types";

import type {
    CreateBudgetFormData,
} from "../../utils/budget.schema";

import BudgetCard from "../../components/budgets/budgetCard";

import EditBudgetForm from "../../components/forms/EditBudgetForm";
// i think right now the logic is hair balling inside this file but ill make it modular once i get it all sorted and reversed enggerned 
const BudgetsPage = () => {

    const [editingBudget, setEditingBudget] =
    useState<BudgetInterface.Budget | null>(null); // tracks which budget the user is currently editing we need this as react needs to know what 
    // the form is tracking currently 

    const {
        data: budgets,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["budgets"], // cheks cache mem
        queryFn: budgetService.getMyBudgets,// then the call for the actual function goes on 
    });
// automatically fetched user budgets 

    
const queryClient = useQueryClient(); 


// contains the logic for mutate oprations on server for various things 
const createBudgetMutation = useMutation({

    mutationFn: budgetService.createBudget,

    onSuccess: () => {

        queryClient.invalidateQueries({
            queryKey: ["budgets"], // tells the browser that the current data is old and forces it to pull data from the server 
        });

    },

    onError: (error) => {

        console.error(
            "Failed to create budget:",
            error
        );

    },

});


// these functions handeled the mutations for budget creation for budget 
    const handleCreateBudget = (
        data: CreateBudgetFormData
    ) => {

        createBudgetMutation.mutate(data);

    };

    const handleUpdateBudget = (
    data: CreateBudgetFormData
) => {

    if (!editingBudget) {
        return;
    }

    updateBudgetMutation.mutate({
        id: editingBudget.id,
        data,
    });

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

const handleEdit = (budget: BudgetInterface.Budget) => {

    setEditingBudget(budget);

};

const handelLock = (id:number ) => {

    const confirmed = window.confirm(
        "are you sure you want to lock this budget , u will not be able to undo this "
    );

    if(!confirmed){
        return ;
    }

    lockBudgetMutations.mutate(id);
}

const lockBudgetMutations = useMutation ({

    mutationFn : budgetService.lockBudget , 

    onSuccess : ()  => {

        queryClient.invalidateQueries({
            queryKey : ["budgets"],
        });


    }, 

    onError :(error) => {

        console.error("failed to lock the budget :" ,
            error
        );
    }


});


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


           {editingBudget ? (

    <EditBudgetForm
        budget={editingBudget}
        onSubmit={handleUpdateBudget}
        onCancel={() => {
            setEditingBudget(null);
        }}
    />

) : (

    <CreateBudgetForm
        onSubmit={handleCreateBudget}
    />

)}


            <section>

                <h2>Existing Budgets</h2>

                {budgets?.length === 0 ? (

                    <p>No budgets found.</p>

                ) : (

                    budgets?.map((budget) => (

    <BudgetCard
    key={budget.id}
    budget={budget}
    onEdit={handleEdit}
    onLock={handelLock} 
    
    onDelete={handleDelete}
/>
                    ))

                )}

            </section>

        </main>
    );
};

export default BudgetsPage;
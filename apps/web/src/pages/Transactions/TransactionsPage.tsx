import {
    useMutation,
    useQuery,
    useQueryClient, // gives data to the central react query cache manager
} from "@tanstack/react-query";

import * as transactionService from "../../services/transaction.service";
import { useState } from "react";

import CreateTransactionForm from "../../components/forms/CreateTransactionForm";
import type { Transaction } from "../../types/dashboard.types";

import type { CreateTransactionFormData } from "../../utils/transaction.schema";

import TransactionCard from "../../components/transaction/TransactionCard";


const TransactionsPage = () => {

    const queryClient = useQueryClient();


    const [editingTransaction, setEditingTransaction] =
        useState<Transaction | null>(null);


    const {
        data: transactions,
        isLoading,
        error,
        // by using react query we get abstraction at a very high level as we get data,isloadingand is error and auto caching
        // without react query we need states and fetch
    } = useQuery({ // use query automatically handels fetching ,caching ans suncronization form api
        queryKey: ["transactions"], // uses this key to cache the results and if any other componets call this key then the same data
        //will be retruned
        queryFn: transactionService.getMyTransactions, // this is in built asyncronous function that does the api calls and returns data and loads
        // the page back up when we receive data
    });


    const createTransactionMutation = useMutation({
        // this function mutation is used to modify data on the server , technically use mutate creates a setup plan but the .mutate acts as a
        // trigger to start execution that is defined here in this snippet
        // the reason we use muataion to change the data on server is the reason as we use react query abstraction this abstraction helps us 4
        // easy data propagationa and less to worry about defining the redundan structure

        mutationFn:
            transactionService.createTransaction, // give a call to the server with all the data  and chage the data in the sever we have , its technically  an async action
            // this i kinda the api call

        onSuccess: () => {// this is a life cycle call back  to be execute if the function executes sucess fully and then code is executed

            queryClient.invalidateQueries({
                queryKey: ["transactions"], // this checkes the caching happening in our app as with the label as key for trnasactions
            });

            // on succes it tells our react query to refresh the transaction so it shows new trnasactions
        },

        onError: (error) => {

            console.error(
                "Failed to create transaction:",
                error
            );

        },

    });


    // now the function for deleted transaction

    const deleteTransactionMutation = useMutation({

        mutationFn: transactionService.deleteTransaction,

        onSuccess: () => {

            queryClient.invalidateQueries({
                queryKey: ["transactions"],
            });

        },

        onError: (error) => {

            console.error(
                "Failed to delete transaction:",
                error
            );

        },

    });

    // this is for updating mutation 

    const updateTransactionMutation = useMutation({

    mutationFn: ({
        id,
        data,
    }: {
        id: number;
        data: CreateTransactionFormData;
    }) =>
        transactionService.updateTransaction(id, data),

    onSuccess: () => {

        queryClient.invalidateQueries({
            queryKey: ["transactions"],
        });

        setEditingTransaction(null);

    },

    onError: (error) => {

        console.error(
            "Failed to update transaction:",
            error
        );

    },

});


    // this is the function that handles which transaction the user wants to edit

    const handleEdit = (transaction: Transaction) => {

        setEditingTransaction(transaction);

    };


    const handleDeleteTransaction = (id: number) => {

        const confirmed = window.confirm(
            "Are you sure you want to delete this transaction?"
        );

        if (!confirmed) {
            return;
        }

        deleteTransactionMutation.mutate(id);

    };


    const handleSubmitTransaction = (
    data: CreateTransactionFormData
) => {

    if (editingTransaction) {

        updateTransactionMutation.mutate({
            id: editingTransaction.id,
            data,
        });

        return;
    }

    createTransactionMutation.mutate(data);

};


    if (isLoading) {
        return <h1>Loading Transactions...</h1>;
    }


    if (error) {
        return <h1>Failed to load transactions.</h1>;
    }


    return (
        <main>

            <h1>Transactions</h1>

            {editingTransaction ? (

   <CreateTransactionForm
    transaction={editingTransaction}
    onSubmit={handleSubmitTransaction}
    onCancel={() => {
        setEditingTransaction(null);
    }}
/>

) : (

    <CreateTransactionForm
        onSubmit={handleSubmitTransaction}
    />

)}
            {/* while our forms submit this this function gets triggirerd as then the data is submitted to the backend  as we complete the from creation  which was rendered*/}

            {createTransactionMutation.isPending && (
                <p>Creating transaction...</p>
            )}

            {createTransactionMutation.isError && (
                <p>
                    Failed to create transaction.
                </p>
            )}


            <section>

                <h2>My Transactions</h2>

                {transactions?.length === 0 ? (

                    <p>No transactions found.</p>

                ) : (

                    transactions?.map((transaction) => (

                        <TransactionCard
                            key={transaction.id} // key helps with react internal list traking
                            transaction={transaction}
                            onEdit={handleEdit}
                            onDelete={handleDeleteTransaction}
                        />

                    ))

                )}

            </section>

        </main>
    );
};

export default TransactionsPage;
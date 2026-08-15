import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import * as transactionService from "../../services/transaction.service";

import CreateTransactionForm from "../../components/forms/CreateTransactionForm";

import type { CreateTransactionFormData } from "../../utils/transaction.schema";

const TransactionsPage = () => {

    const queryClient = useQueryClient();

    const {
        data: transactions,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["transactions"],
        queryFn: transactionService.getMyTransactions,
    });


    const createTransactionMutation = useMutation({

        mutationFn:
            transactionService.createTransaction,

        onSuccess: () => {

            queryClient.invalidateQueries({
                queryKey: ["transactions"],
            });

        },

        onError: (error) => {

            console.error(
                "Failed to create transaction:",
                error
            );

        },

    });


    const handleCreateTransaction = (
        data: CreateTransactionFormData
    ) => {

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

            <CreateTransactionForm
                onSubmit={handleCreateTransaction}
            />

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

                        <div key={transaction.id}>

                            <h3>
                                {transaction.title ??
                                    "Untitled Transaction"}
                            </h3>

                            <p>
                                ₹{transaction.amount}
                            </p>

                            <p>
                                {transaction.category}
                            </p>

                            <p>
                                {transaction.priority}
                            </p>

                            <p>
                                {transaction.transactionDate}
                            </p>

                        </div>

                    ))

                )}

            </section>

        </main>
    );
};

export default TransactionsPage;
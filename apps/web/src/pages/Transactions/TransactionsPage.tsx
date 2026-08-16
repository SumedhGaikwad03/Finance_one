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
        // by using react query we get abstraction at a very high level as we get data,isloadingand is error and auto caching 
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


    const handleCreateTransaction = (
        data: CreateTransactionFormData
    ) => {

        createTransactionMutation.mutate(data); // calls the mutate function for the query as this triggers the mutate function that is further 
        // defined in the code ahead for execution 


    };
    // this is the function that catch 


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
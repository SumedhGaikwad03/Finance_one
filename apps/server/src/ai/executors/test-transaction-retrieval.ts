import { TransactionRetrievalExecutor } from "./transaction-retrieval.executor";

const executor = new TransactionRetrievalExecutor();

const test = async () => {

    const result = await executor.execute(
        {
            id: "transaction-retrieval",
            name: "Transaction Retrieval",
            description: "Retrieves factual information from the user's financial data.",
            examples: [],
            requirements: ["transactions"],
        },
        {
            question: "How much did I spend on groceries?",
        },
        1
    );

    console.log("Executor result:", result);
};

test();
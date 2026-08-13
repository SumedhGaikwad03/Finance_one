import { TransactionQueryService } from "./transaction-query.service";

const service = new TransactionQueryService();

const test = async () => {

    const query = {
        operation: "LIST" as const,
        category: "FOOD" as const,
    };

    const result = await service.execute(query);

    console.log("Query:", query);
    console.log("Results:", result);
};

test();
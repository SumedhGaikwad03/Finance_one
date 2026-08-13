import { AppError } from "../../error/AppError";
import * as transactionRepository from "../../repositories/transaction.repository";
import { TransactionQuery } from "../types/transaction-query.types";

export class TransactionQueryService {

    async execute(
        query: TransactionQuery,
        userId: number
    ) {

        switch (query.operation) {

            case "LIST":

                   return transactionRepository.findTransactionsByFilters({
                    userId,
                    category: query.category,
                    startDate: query.startDate,
                    endDate: query.endDate,
                });

            default:
                throw new AppError(
                    `Unsupported transaction operation: ${query.operation}`,400
                );
        }
    }
}
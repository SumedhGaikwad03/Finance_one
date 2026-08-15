// this is a service that the frontend requests 

import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

//import type { Transaction } from "../types/dashboard.types";

import * as transactionTypes from "../types/dashboard.types"

export const getMyTransactions = async (): Promise<transactionTypes.Transaction[]> => {

    const response = await api.get<transactionTypes.Transaction[]>(
        ENDPOINTS.TRANSACTIONS.MY
    );

    return response.data;
};

export const createTransaction = async (

    data : transactionTypes.CreateTransactionRequest ): Promise<transactionTypes.Transaction[]> => {

        const response = await api.post<transactionTypes.Transaction[]>(
            ENDPOINTS.TRANSACTIONS.ROOT,
            data
        );

        return response.data;


    }


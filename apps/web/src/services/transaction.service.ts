// this is a service that the frontend requests 

import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

//import type { Transaction } from "../types/dashboard.types";

import * as transactionTypes from "../types/dashboard.types";

// this is basically the transacion service for frontend 



export const getMyTransactions = async (): Promise<transactionTypes.Transaction[]> => { // this is basic async function that promises to 
    // return and array of trnasactions 

    const response = await api.get<transactionTypes.Transaction[]>(
        ENDPOINTS.TRANSACTIONS.MY // this access our endpoints file that req the express ie backend then that flow executes 
    );

    return response.data;
};

// same things going on here just we pass data as a input to the system 
export const createTransaction = async (

    data : transactionTypes.CreateTransactionRequest ): Promise<transactionTypes.Transaction[]> => {

        const response = await api.post<transactionTypes.Transaction[]>(
            ENDPOINTS.TRANSACTIONS.ROOT,
            data
        );

        return response.data;


    }


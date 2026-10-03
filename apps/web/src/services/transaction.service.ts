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

export const queryTransactions = async (
    params?: transactionTypes.TransactionQueryParams
): Promise<transactionTypes.Transaction[]> => {
    const searchParams = new URLSearchParams();

    if (params) {
        if (params.categories && params.categories.length > 0) {
            searchParams.set("categories", params.categories.join(","));
        } else if (params.category) {
            const cats = Array.isArray(params.category) ? params.category.join(",") : params.category;
            searchParams.set("category", cats);
        }

        if (params.priorities && params.priorities.length > 0) {
            searchParams.set("priorities", params.priorities.join(","));
        } else if (params.priority) {
            const pris = Array.isArray(params.priority) ? params.priority.join(",") : params.priority;
            searchParams.set("priority", pris);
        }

        if (params.startDate) searchParams.set("startDate", params.startDate);
        if (params.endDate) searchParams.set("endDate", params.endDate);
        if (params.minAmount !== undefined) searchParams.set("minAmount", params.minAmount.toString());
        if (params.maxAmount !== undefined) searchParams.set("maxAmount", params.maxAmount.toString());
        if (params.search) searchParams.set("search", params.search);
        if (params.limit !== undefined) searchParams.set("limit", params.limit.toString());
        if (params.offset !== undefined) searchParams.set("offset", params.offset.toString());
        if (params.sortBy) searchParams.set("sortBy", params.sortBy);
        if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
    }

    const queryString = searchParams.toString();
    const endpoint = queryString
        ? `${ENDPOINTS.TRANSACTIONS.ROOT}?${queryString}`
        : ENDPOINTS.TRANSACTIONS.ROOT;

    const response = await api.get<transactionTypes.Transaction[]>(endpoint);
    return response.data;
};



// same things going on here just we pass data as a input to the system
export const createTransaction = async (

    data: transactionTypes.CreateTransactionRequest
): Promise<transactionTypes.Transaction> => {

    const response = await api.post<transactionTypes.Transaction>(
        ENDPOINTS.TRANSACTIONS.ROOT,
        data
    );

    return response.data;

};

export const parseQuickTransaction = async (
    text: string
): Promise<transactionTypes.ParsedTransactionResponse> => {
    const response = await api.post<transactionTypes.ParsedTransactionResponse>(
        ENDPOINTS.TRANSACTIONS.PARSE,
        { text }
    );
    return response.data;
};

export const createQuickTransaction = async (
    data: transactionTypes.QuickTransactionRequest
): Promise<transactionTypes.Transaction> => {
    const response = await api.post<transactionTypes.Transaction>(
        ENDPOINTS.TRANSACTIONS.QUICK,
        data
    );
    return response.data;
};



// this is the function to update a transaction

export const updateTransaction = async (
    id: number,
    data: Partial<transactionTypes.CreateTransactionRequest>
): Promise<transactionTypes.Transaction> => {

    const response = await api.patch<transactionTypes.Transaction>(
        `${ENDPOINTS.TRANSACTIONS.ROOT}/${id}`,
        data
    );

    return response.data;
};


// this is a function to delete the transaction

export const deleteTransaction = async (
    id: number
): Promise<void> => {

    await api.delete(
        `${ENDPOINTS.TRANSACTIONS.ROOT}/${id}`
    );

};
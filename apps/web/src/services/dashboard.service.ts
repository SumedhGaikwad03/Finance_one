import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

import type {
    DashboardResponse,
} from "../types/dashboard.types";

export const getDashboardData = async (): Promise<DashboardResponse> => {

    const response =
        await api.get<DashboardResponse>( // we are telling the server that the responese returns this shape

            ENDPOINTS.DASHBOARD // calls the backend to fetch dashboard data 
        );

    return response.data;

};
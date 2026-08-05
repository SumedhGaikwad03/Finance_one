import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const getDashboardData = async () => {

    const response = await api.get(
        ENDPOINTS.DASHBOARD
    );

    return response.data;

};
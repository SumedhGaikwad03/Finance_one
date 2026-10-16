import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import type { MonthlyInsightsResponse } from "../types/insights.types";

export const getMonthlyInsights = async (
    month?: string
): Promise<MonthlyInsightsResponse> => {
    const response = await api.get<MonthlyInsightsResponse>(ENDPOINTS.INSIGHTS.MONTHLY, {
        params: month ? { month } : undefined,
    });
    return response.data;
};

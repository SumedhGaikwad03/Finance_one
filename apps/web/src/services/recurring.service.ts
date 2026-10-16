import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import type {
    RecurringPattern,
    RecurringPatternsResponse,
    RecurringQueryOptions,
} from "../types/recurring.types";

export const getRecurringPatterns = async (
    options: RecurringQueryOptions = {}
): Promise<RecurringPatternsResponse> => {
    const params: Record<string, string | number | boolean> = {};

    if (options.status) params.status = options.status;
    if (options.type) params.type = options.type;
    if (options.frequency) params.frequency = options.frequency;
    if (options.minConfidence !== undefined) params.minConfidence = options.minConfidence;
    if (options.includeDismissed !== undefined) params.includeDismissed = options.includeDismissed;
    if (options.lookbackMonths !== undefined) params.lookbackMonths = options.lookbackMonths;

    const response = await api.get<RecurringPatternsResponse>(ENDPOINTS.RECURRING.ROOT, {
        params,
    });
    return response.data;
};

export const getRecurringPatternById = async (id: string): Promise<RecurringPattern> => {
    const response = await api.get<RecurringPattern>(ENDPOINTS.RECURRING.DETAIL(id));
    return response.data;
};

export const confirmRecurringPattern = async (
    id: string,
    notes?: string
): Promise<RecurringPattern> => {
    const response = await api.post<RecurringPattern>(ENDPOINTS.RECURRING.CONFIRM(id), {
        notes,
    });
    return response.data;
};

export const dismissRecurringPattern = async (id: string): Promise<RecurringPattern> => {
    const response = await api.post<RecurringPattern>(ENDPOINTS.RECURRING.DISMISS(id));
    return response.data;
};

export const resetRecurringPattern = async (id: string): Promise<RecurringPattern> => {
    const response = await api.post<RecurringPattern>(ENDPOINTS.RECURRING.RESET(id));
    return response.data;
};

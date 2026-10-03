import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import type {
    UpdateProfileRequest,
    UpdateProfileResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
} from "../types/user.types";

export const updateProfile = async (
    data: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
    const response = await api.patch<UpdateProfileResponse>(
        ENDPOINTS.USERS.ME,
        data
    );
    return response.data;
};

export const changePassword = async (
    data: ChangePasswordRequest
): Promise<ChangePasswordResponse> => {
    const response = await api.patch<ChangePasswordResponse>(
        ENDPOINTS.USERS.PASSWORD,
        data
    );
    return response.data;
};

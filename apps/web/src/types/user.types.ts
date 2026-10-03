import type { User } from "./auth.types";

export interface UpdateProfileRequest {
    name: string;
}

export interface UpdateProfileResponse {
    user: User;
    message: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface ChangePasswordResponse {
    success: boolean;
    message: string;
}

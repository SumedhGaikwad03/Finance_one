import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    User,
} from "../types/auth.types";

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
};

export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>(ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
};

export const Register = register;

export const getProfile = async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>(ENDPOINTS.AUTH.PROFILE);
    return response.data;
};

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

export const isAuthenticated = () => {
    return !!localStorage.getItem("token");
};
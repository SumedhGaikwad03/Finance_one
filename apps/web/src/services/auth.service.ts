import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export interface LoginRequest {

    email: string;

    password: string;

}

export interface LoginResponse {

    token: string;

}

export const login = async (
    data: LoginRequest
): Promise<LoginResponse> => {

    const response = await api.post<LoginResponse>(

        ENDPOINTS.AUTH.LOGIN,
  // these endpoits are mapped in the api tab of the system 
        data

    );

    return response.data;

};

export const logout = () => {

    localStorage.removeItem("token");

};

export const isAuthenticated = () => {

    return !!localStorage.getItem("token");

};// helper fn to check owenership of the token 
import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import * as authInterface from "../../src/types/auth.types.ts"



export const login = async (
    data: authInterface.LoginRequest
): Promise<authInterface.LoginResponse> => {

    const response = await api.post<authInterface.LoginResponse>(

        ENDPOINTS.AUTH.LOGIN,
  // these endpoits are mapped in the api tab of the system 
        data

    );

    return response.data;

};

export const Register = async ( 
    data : authInterface.RegisterRequest
): Promise<authInterface.RegisterResponse> => {

    const response = await api.post<authInterface.RegisterResponse>(
          ENDPOINTS.AUTH.REGISTER,
          data);
// this is the  endpoint we send data and route here 
          return response.data;


}

export const logout = () => {

    localStorage.removeItem("token");

};

export const isAuthenticated = () => {

    return !!localStorage.getItem("token");

};// helper fn to check owenership of the token 
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from "../types/auth.types";
import * as authService from "../services/auth.service";

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<LoginResponse>;
    register: (data: RegisterRequest) => Promise<RegisterResponse>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            try {
                return JSON.parse(savedUser);
            } catch {
                return null;
            }
        }
        return null;
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const logout = useCallback(() => {
        authService.logout();
        setToken(null);
        setUser(null);
    }, []);

    const updateUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    }, []);

    const refreshUser = useCallback(async () => {
        const currentToken = localStorage.getItem("token");
        if (!currentToken) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const profile = await authService.getProfile();
            if (profile?.user) {
                setUser(profile.user);
                localStorage.setItem("user", JSON.stringify(profile.user));
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            // If token is invalid, log out
            logout();
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        if (token) {
            refreshUser();
        } else {
            setIsLoading(false);
        }
    }, [token, refreshUser]);

    const login = async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await authService.login(data);
        if (response.token) {
            localStorage.setItem("token", response.token);
            setToken(response.token);
        }
        if (response.user) {
            localStorage.setItem("user", JSON.stringify(response.user));
            setUser(response.user);
        }
        return response;
    };

    const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
        const response = await authService.register(data);
        return response;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token,
                isLoading,
                login,
                register,
                logout,
                refreshUser,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

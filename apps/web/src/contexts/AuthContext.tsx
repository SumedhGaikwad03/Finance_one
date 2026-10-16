import React, { useEffect, useState, useCallback } from "react";
import type { User, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from "../types/auth.types";
import * as authService from "../services/auth.service";
import { AuthContext } from "./auth.context";

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
    const [isLoading, setIsLoading] = useState<boolean>(() => !!localStorage.getItem("token"));

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
        if (!token) {
            return;
        }

        let isMounted = true;
        authService
            .getProfile()
            .then((profile) => {
                if (isMounted && profile?.user) {
                    setUser(profile.user);
                    localStorage.setItem("user", JSON.stringify(profile.user));
                }
            })
            .catch((error) => {
                console.error("Failed to fetch user profile on init:", error);
                if (isMounted) {
                    logout();
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [token, logout]);

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

export default AuthProvider;

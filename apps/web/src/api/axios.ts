import axios from "axios";

// Determine API Base URL safely across development and production
const getBaseUrl = (): string => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // In production builds without explicit VITE_API_URL, default to relative API root
    if (import.meta.env.PROD) {
        return "";
    }
    return "http://localhost:3000";
};

const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            
            const currentPath = window.location.pathname;
            const isPublicPage = currentPath === "/" || currentPath === "/login" || currentPath === "/register";
            
            if (!isPublicPage) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
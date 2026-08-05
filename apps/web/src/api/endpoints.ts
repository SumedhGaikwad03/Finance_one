export const ENDPOINTS = {

    AUTH: {
        LOGIN: "/auth/login",
        REGISTER: "/auth/register",
        PROFILE: "/auth/me",
    },

    DASHBOARD: "/dashboard",

    TRANSACTIONS: "/transactions",

    BUDGETS: {
        ROOT: "/budgets",
        ACTIVE: "/budgets/active",
    },

} as const;
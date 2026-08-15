export const ENDPOINTS = {

    AUTH: {
        LOGIN: "/auth/login",
        REGISTER: "/auth/register",
        PROFILE: "/auth/me",
    },

    DASHBOARD: "/dashboard",

    TRANSACTIONS: {
        ROOT: "/transactions",
        MY: "/transactions/getMyTransactions",
    },

    BUDGETS: {
        ROOT: "/budgets",
        ACTIVE: "/budgets/active",
    },

} as const;
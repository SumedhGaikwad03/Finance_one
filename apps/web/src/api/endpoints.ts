export const ENDPOINTS = {
// stores all api path in one location so it helps modulate the api logic and keeping the routes flexible 

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

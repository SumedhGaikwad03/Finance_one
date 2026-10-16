export const ENDPOINTS = {
// stores all api path in one location so it helps modulate the api logic and keeping the routes flexible 

    AUTH: {
        LOGIN: "/auth/login",
        REGISTER: "/auth/register",
        PROFILE: "/auth/me",
    },

    USERS: {
        ME: "/users/me",
        PASSWORD: "/users/me/password",
    },

    DASHBOARD: "/dashboard",

    TRANSACTIONS: {
        ROOT: "/transactions",
        MY: "/transactions/getMyTransactions",
        PARSE: "/transactions/parse",
        QUICK: "/transactions/quick",
    },

    BUDGETS: {
        ROOT: "/budgets",
        ACTIVE: "/budgets/active",
        ALERTS: "/budgets/alerts",
        DISMISS_ALERT: (id: string) => `/budgets/alerts/${id}/dismiss`,
    },

    IMPORT: {
        UPLOAD: "/transactions/import/upload",
        SWITCH_WORKSHEET: "/transactions/import/change-worksheet",
        PREVIEW: "/transactions/import/preview",
        CONFIRM: "/transactions/import/confirm",
    },

} as const; 

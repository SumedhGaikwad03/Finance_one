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
    },

    IMPORT: {
        UPLOAD: "/transactions/import/upload",
        SWITCH_WORKSHEET: "/transactions/import/change-worksheet",
        PREVIEW: "/transactions/import/preview",
        CONFIRM: "/transactions/import/confirm",
    },

    RECURRING: {
        ROOT: "/recurring",
        DETAIL: (id: string) => `/recurring/${id}`,
        CONFIRM: (id: string) => `/recurring/${id}/confirm`,
        DISMISS: (id: string) => `/recurring/${id}/dismiss`,
        RESET: (id: string) => `/recurring/${id}/reset`,
    },

} as const; 

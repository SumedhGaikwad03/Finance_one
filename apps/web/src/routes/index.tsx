import { createBrowserRouter } from "react-router-dom";

import LoginPage from "../pages/Login/LoginPage";
import RegisterPage from "../pages/Register/RegisterPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import TransactionsPage from "../pages/Transactions/TransactionsPage";
import BudgetsPage from "../pages/Budgets/BudgetsPage";
import NotFoundPage from "../pages/NotFound/NotFoundPage";

export const router = createBrowserRouter([

    {
        path: "/",
        element: <LoginPage />,
    },

    {
        path: "/login",
        element: <LoginPage />,
    },

    {
        path: "/register",
        element: <RegisterPage />,
    },

    {
        path: "/dashboard",
        element: <DashboardPage />,
    },

    {
        path: "/transactions",
        element: <TransactionsPage />,
    },

    {
        path: "/budgets",
        element: <BudgetsPage />,
    },

    {
        path: "*",
        element: <NotFoundPage />,
    },

]);
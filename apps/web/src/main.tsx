import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import { router } from "./routes";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./contexts/AuthContext";

import "./index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <RouterProvider router={router} />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                    }}
                />
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>
);
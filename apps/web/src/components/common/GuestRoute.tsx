import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

type GuestRouteProps = {
    children: React.ReactNode;
};

const GuestRoute = ({ children }: GuestRouteProps) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{ padding: "40px", textAlign: "center" }}>
                <p>Loading session...</p>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default GuestRoute;

import { Navigate } from "react-router-dom";

type ProtectedRouteProps = {

    children: React.ReactNode; // this simply says give me a page ti protect , thrn this childern var is passed along 

};

const ProtectedRoute = ({
    children,
}: ProtectedRouteProps) => {

    const token = localStorage.getItem("token");

    if (!token) {

        return <Navigate to="/login" replace />; // if token not found we return to login page 

    }

    return children; // if token found we show our page as intended 

};

export default ProtectedRoute;
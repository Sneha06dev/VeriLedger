// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../utils/auth";

const ProtectedRoute = ({ children }) => {
    const token = getToken();
    const location = useLocation();

    if (!token) {
        // Show native browser alert
        alert("⚠️ You must login to access this feature!");
        // Redirect to login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
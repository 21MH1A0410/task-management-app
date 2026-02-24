// Waiting for `loading` prevents a false redirect to /login during the initial
// silent re-auth check that runs on every hard refresh.
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[100dvh] bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        // Preserve the attempted route so login can redirect back after successful auth
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

// Prevents authenticated users from accessing /login or /register via browser history
export const GuestRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[100dvh] bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/tasks" replace />;
    }

    return children;
};

export default ProtectedRoute;

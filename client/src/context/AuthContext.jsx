import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Only stores runtime UI state. We no longer write to localStorage.
    // The source of truth for auth is the backend session cookie.
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, ask the backend if we're authenticated.
    // The browser silently attaches the HttpOnly cookie if it exists.
    useEffect(() => {
        api.get('/users/me')
            .then(res => {
                setUser(res.data);
            })
            .catch((err) => {
                // 401 means no valid cookie, which is normal for logged-out users.
                // Leave user as null.
                if (err.response && err.response.status === 401) {
                    setUser(null);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password, rememberMe = false) => {
        const res = await api.post('/users/login', { email, password, rememberMe });
        // The backend sets the HttpOnly cookie. We just need to store the user profile in state.
        setUser(res.data);
        return res;
    };

    const register = async (name, email, password) => {
        const res = await api.post('/users', { name, email, password });
        setUser(res.data);
        return res;
    };

    const logout = async () => {
        try {
            // Tell backend to clear the HttpOnly cookie
            await api.post('/users/logout');
        } catch (err) {
            console.error('Logout failed:', err);
        } finally {
            setUser(null);
            window.location.href = '/login';
        }
    };

    const updateUser = (data) => {
        // Stamping a fresh _picTs forces every avatar <img> src to get a new ?t= query string,
        // cache-busting the browser without a manual reload
        const enriched = data.hasProfilePic ? { ...data, _picTs: Date.now() } : data;
        setUser({ ...user, ...enriched });
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    // withCredentials ensures the browser automatically sends the HttpOnly cookie
    // cross-origin to the backend on every request.
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        // Deleting Content-Type lets the browser set the correct multipart boundary for FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        // No more manual Bearer token injection here. The browser handles the HttpOnly cookie.
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        // Unwrap the backend envelope { success, data, meta } so callers receive data directly
        return response.data;
    },
    (error) => {
        // Handle cases where the backend is completely unreachable (down, CORS error, network offline)
        if (!error.response) {
            const customError = new Error('The server is temporarily unreachable. Please check your connection or try again later.');
            customError.isNetworkError = true;
            return Promise.reject(customError);
        }

        const status = error.response?.status;
        const errorData = error.response?.data?.error || {};

        // Handle 502/503/504 errors specifically when Render's proxy or backend is down/starting up
        if (status === 502 || status === 503 || status === 504) {
            const customError = new Error('The backend service is temporarily down or waking up. Please try again in a moment.');
            customError.status = status;
            return Promise.reject(customError);
        }

        const message = errorData.message || (error.code === 'ERR_NETWORK' ? 'Network error: Please check your connection' : error.message) || "An unexpected error occurred";
        const details = errorData.details || [];

        if (status === 401) {
            // Guard against redirect loops: don't redirect if already on /login or if this IS the login request
            const isAuthReq = error.config?.url?.includes('/users/login') || error.config?.url?.includes('/users/register') || error.config?.url?.includes('/users/me');
            if (!window.location.pathname.includes('/login') && !isAuthReq) {
                window.location.href = '/login?expired=true';
            }
        }

        if (status === 429) {
            const isAuthReq = error.config?.url?.includes('/users/login') || error.config?.url?.includes('/users/register');
            const rateLimitMessage = isAuthReq
                ? 'Too many attempts. Please wait 15 minutes and try again.'
                : 'Too many requests. Please slow down and try again.';

            const customError = new Error(rateLimitMessage);
            customError.details = details;
            customError.response = error.response;
            customError.isRateLimit = true;
            return Promise.reject(customError);
        }

        const customError = new Error(status === 500 ? 'Internal Server Error. Please try again later.' : message);
        customError.details = details;
        customError.response = error.response;
        customError.status = status;
        customError.code = error.code;
        return Promise.reject(customError);
    }
);

export default api;

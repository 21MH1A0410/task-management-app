/**
 * Safely extracts data from a response already unwrapped by the api.js interceptor.
 * Throws if the response signals failure, returns defaultValue if response is falsy.
 */
export const extractApiData = (response, defaultValue = null) => {
    if (!response) return defaultValue;

    if (response.success === false) {
        throw new Error(response.error?.message || 'API request failed');
    }

    return response.data ?? defaultValue;
};

/** Validates an unwrapped API response shape, throwing on failure. */
export const validateApiResponse = (response) => {
    if (!response) {
        throw new Error('No response received from API');
    }

    if (response.success === false) {
        const message = response.error?.message || 'API request failed';
        throw new Error(message);
    }

    return true;
};

/**
 * Extracts a user-facing message from an API error in priority order:
 * rate-limit message → first Zod detail → error.message → defaultMessage.
 */
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
    if (error.isRateLimit) {
        return error.message;
    }

    if (error.details && Array.isArray(error.details) && error.details.length > 0) {
        return error.details[0]?.message || defaultMessage;
    }

    return error.message || defaultMessage;
};

/**
 * Maps structured server error details to a flat { field: message } object for form error display.
 * Strips the Zod "body." prefix from field paths (e.g. "body.title" → "title").
 * Falls back to a "global" key for unstructured error messages.
 */
export const mapServerErrors = (error) => {
    const fieldErrors = {};

    if (error.details && Array.isArray(error.details)) {
        error.details.forEach(detail => {
            const field = detail.field ? detail.field.replace('body.', '') : 'global';
            fieldErrors[field] = detail.message;
        });
    } else if (error.message) {
        fieldErrors.global = error.message;
    }

    return fieldErrors;
};

export const getApiUrl = () => {
    const url = import.meta.env.VITE_API_URL;

    if (!url) {
        if (import.meta.env.DEV) {
            console.warn('VITE_API_URL not set, using default: /api');
        }
        return '/api';
    }

    return url;
};

export const log = (...args) => {
    if (import.meta.env.DEV) {
        console.log(...args);
    }
};

export const logError = (...args) => {
    if (import.meta.env.DEV) {
        console.error(...args);
    }
};

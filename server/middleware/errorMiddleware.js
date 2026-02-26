const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let details = [];

    // CastError means an invalid MongoDB ObjectId was passed as a route param
    if (err.name === 'CastError') {
        statusCode = 400;
        err.message = 'Resource not found';
        details = [{
            field: err.path,
            message: `Invalid ${err.path}: ${err.value}`
        }];
    }

    if (err.name === 'ValidationError') {
        statusCode = 400;
        err.message = 'Validation failed';
        details = Object.values(err.errors).map(val => ({
            field: val.path,
            message: val.message
        }));
    }

    // Zod validation errors
    if (err.name === 'ZodError') {
        statusCode = 400;
        const errors = err.errors || err.issues || [];
        err.message = errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        details = errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));
    }

    // E11000 duplicate key — surface the specific field that conflicted
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyPattern)[0];
        err.message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        details = [{ field, message: err.message }];
    }

    logger.error({
        requestId: req.id,
        err,
        user: req.user,
        req,
        statusCode,
        details
    }, `Error: ${err.message}`);

    const isInternalError = statusCode >= 500;
    const isProduction = process.env.NODE_ENV === 'production';

    // Return generic message and strip details for 500 errors to prevent leaking insights to the client
    const safeMessage = (isProduction && isInternalError)
        ? 'Internal Server Error'
        : (err.message || 'An unexpected error occurred');

    const safeDetails = (isProduction && isInternalError) ? [] : details;

    res.status(statusCode).json({
        success: false,
        error: {
            message: safeMessage,
            details: safeDetails,
            ...(!isProduction && { stack: err.stack })
        }
    });
};

module.exports = {
    errorHandler
};

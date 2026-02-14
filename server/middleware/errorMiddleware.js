// /server/middleware/errorMiddleware.js

const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    if (err.name === 'CastError') {
        statusCode = 400;
        err.message = 'Resource not found';
    }

    if (err.name === 'ValidationError') {
        statusCode = 400;
        err.message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    res.status(statusCode);

    // Unified error response format (matches success envelope)
    res.json({
        success: false,
        error: {
            message: err.message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    });
};

module.exports = {
    errorHandler
};

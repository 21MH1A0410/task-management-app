const logger = require('../utils/logger');

/**
 * Monkey-patches res.json and res.send to log the full request/response cycle,
 * including duration. The 'finish' handler covers streamed or edge-case responses
 * that bypass both patched methods.
 */
const httpLogger = (req, res, next) => {
    const startTime = Date.now();

    const originalJson = res.json;
    res.json = function (body) {
        const duration = Date.now() - startTime;
        res.responseTime = `${duration}ms`;
        logger.http(req, res, duration);
        return originalJson.call(this, body);
    };

    const originalSend = res.send;
    res.send = function (body) {
        if (!res.responseTime) {
            const duration = Date.now() - startTime;
            res.responseTime = `${duration}ms`;
            logger.http(req, res, duration);
        }
        return originalSend.call(this, body);
    };

    res.on('finish', () => {
        if (!res.responseTime) {
            const duration = Date.now() - startTime;
            res.responseTime = `${duration}ms`;
            logger.http(req, res, duration);
        }
    });

    next();
};

module.exports = httpLogger;

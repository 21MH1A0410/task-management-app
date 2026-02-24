const pino = require('pino');

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

const SENSITIVE_KEYS = [
    'password',
    'token',
    'authorization',
    'cookie',
    'secret',
    'apiKey',
    'accessToken',
    'refreshToken',
    'jwt',
    'sessionId'
];

/** Recursively redacts any object key whose name contains a sensitive keyword. */
const redactSensitiveData = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    const redacted = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in redacted) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
            redacted[key] = '[REDACTED]';
        } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
            redacted[key] = redactSensitiveData(redacted[key]);
        }
    }

    return redacted;
};

const serializers = {
    req: (req) => {
        if (!req) return req;

        return {
            id: req.id,
            method: req.method,
            url: req.url,
            headers: redactSensitiveData({
                'user-agent': req.headers?.['user-agent'],
                'content-type': req.headers?.['content-type']
            }),
            remoteAddress: req.ip || req.connection?.remoteAddress,
            // Body is only logged in development — avoid leaking large payloads or PII in production
            ...(isDev && req.body && { body: redactSensitiveData(req.body) })
        };
    },

    res: (res) => {
        if (!res) return res;
        return {
            statusCode: res.statusCode,
            responseTime: res.responseTime
        };
    },

    err: (err) => {
        if (!err) return err;
        return {
            type: err.name,
            message: err.message,
            // Full stack in dev/staging; omit in production to avoid leaking internals
            stack: !isProd ? err.stack : undefined,
            ...(err.code && { code: err.code }),
            ...(err.statusCode && { statusCode: err.statusCode })
        };
    },

    user: (user) => {
        if (!user) return user;
        return {
            id: user._id || user.id,
            email: user.email,
            name: user.name
        };
    }
};

const baseConfig = {
    level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
    serializers,
    enabled: !isTest,
    base: {
        pid: process.pid,
        hostname: process.env.HOST || 'localhost',
        env: process.env.NODE_ENV
    }
};

const devTransport = {
    target: 'pino-pretty',
    options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname,env',
        customColors: 'error:red,warn:yellow,info:cyan,debug:gray',
        singleLine: false
    }
};

// Production outputs raw JSON for ingestion by log aggregators (Datadog, CloudWatch, etc.)
const prodConfig = {
    ...baseConfig,
    formatters: {
        level: (label) => ({ level: label }),
        bindings: (bindings) => ({
            pid: bindings.pid,
            hostname: bindings.hostname
        })
    }
};

const logger = isDev
    ? pino({ ...baseConfig, transport: devTransport })
    : pino(prodConfig);

/**
 * Logs the full HTTP request/response cycle at the appropriate level:
 * error for 5xx, warn for 4xx, info for everything else.
 */
logger.http = (req, res, duration) => {
    const logData = {
        req,
        res: { statusCode: res.statusCode, responseTime: `${duration}ms` },
        duration
    };

    if (res.statusCode >= 500) {
        logger.error(logData, `${req.method} ${req.url}`);
    } else if (res.statusCode >= 400) {
        logger.warn(logData, `${req.method} ${req.url}`);
    } else {
        logger.info(logData, `${req.method} ${req.url}`);
    }
};

/** Logs auth events (login, registration, token validation) for security auditing. */
logger.auth = (event, userId, success, metadata = {}) => {
    logger.info({
        event,
        userId,
        success,
        ...redactSensitiveData(metadata)
    }, `Auth: ${event}`);
};

/** Logs DB operations at debug level — only emits in development to avoid log noise. */
logger.db = (operation, collection, duration, metadata = {}) => {
    if (isDev) {
        logger.debug({
            operation,
            collection,
            duration: `${duration}ms`,
            ...metadata
        }, `DB: ${operation} ${collection}`);
    }
};

module.exports = logger;

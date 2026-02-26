require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const requestId = require('./middleware/requestId');
const httpLogger = require('./middleware/httpLogger');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// trust proxy only in production — enabling it in dev would let any client spoof X-Forwarded-For
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Removes the X-Powered-By header to prevent version fingerprinting
app.disable('x-powered-by');

app.use(requestId);
app.use(httpLogger);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// Parses the Cookie header into req.cookies — must come before any middleware that reads cookies
app.use(cookieParser());

app.use(helmet({
    frameguard: { action: 'deny' }
}));

app.use(cors({
    origin: process.env.ALLOW_ORIGINS
        ? process.env.ALLOW_ORIGINS.split(',')
        : ['https://task-management-app-2kk.pages.dev', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: {
                message: 'Too many requests from this IP, please try again later'
            }
        });
    }
});
app.use('/api', limiter);

app.use(mongoSanitize());
app.use(hpp());

// Skip compression for payloads under 1KB — the CPU cost isn't worth it
app.use(compression({ threshold: 1024 }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    }[dbState] || 'unknown';

    const isHealthy = dbState === 1;
    const memoryUsage = process.memoryUsage();

    // setImmediate measures a rough event-loop delay — a high value signals a blocked loop
    const start = Date.now();
    setImmediate(() => {
        const delay = Date.now() - start;

        res.status(isHealthy ? 200 : 503).json({
            success: isHealthy,
            data: {
                status: isHealthy ? 'ok' : 'degraded',
                uptime: process.uptime(),
                timestamp: Date.now(),
                version: process.env.npm_package_version || '1.0.0',
                pid: process.pid,
                nodeVersion: process.version,
                eventLoopDelay: `${delay}ms`,
                memory: {
                    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
                },
                database: {
                    status: dbStatus,
                    connected: isHealthy
                }
            }
        });
    });
});

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.get('/', (req, res) => {
    res.send('Task Management API is running securely 🚀');
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.originalUrl} not found`
        }
    });
});

// Intercept malformed JSON before it reaches the generic error handler
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid JSON payload'
            }
        });
    }
    next(err);
});

app.use(errorHandler);

// Fail fast on misconfiguration rather than running with weak or missing secrets
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    logger.error('JWT_SECRET must be at least 32 characters');
    process.exit(1);
}
if (!process.env.MONGO_URI) {
    logger.error('MONGO_URI is required');
    process.exit(1);
}

let server;

process.on('SIGINT', async () => {
    logger.info('SIGINT received. Shutting down gracefully.');
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
    }
    if (server) {
        server.close(() => {
            logger.info('Server closed.');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

// Cloud platforms send SIGTERM before killing the process — drain in-flight requests before exiting
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully.');
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
    }
    if (server) {
        // Force-kill after 10s if connections don't drain naturally
        const shutdownTimeout = setTimeout(() => {
            logger.error('Forced shutdown after timeout - some connections may not have closed gracefully');
            process.exit(1);
        }, 10000);

        server.close(() => {
            clearTimeout(shutdownTimeout);
            logger.info('Server closed.');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

const startServer = async () => {
    try {
        await connectDB();
        server = app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
            logger.info(`http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error({ err: error }, 'Failed to connect to database');
        process.exit(1);
    }
};

// Skip server startup during test runs so Jest can import the app without side effects
if (process.env.NODE_ENV !== 'test') {
    startServer();
}

module.exports = app;
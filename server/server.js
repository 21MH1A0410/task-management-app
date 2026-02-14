// /server/server.js
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
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for deployment behind reverse proxies (Render, Railway, Nginx, Cloudflare)
app.set('trust proxy', 1);

// Remove Express fingerprint for security
app.disable('x-powered-by');

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(helmet({
    frameguard: { action: 'deny' }
}));

// Production blocks all origins unless explicitly allowed via env
app.use(cors({
    origin: process.env.ALLOW_ORIGINS
        ? process.env.ALLOW_ORIGINS.split(',')
        : (process.env.NODE_ENV === 'production' ? false : '*'),
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

// Skip compression for responses smaller than 1KB
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

    res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        data: {
            status: isHealthy ? 'ok' : 'degraded',
            uptime: process.uptime(),
            timestamp: Date.now(),
            database: {
                status: dbStatus,
                connected: isHealthy
            }
        }
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

// Handle malformed JSON gracefully
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

// Prevent startup with weak secrets
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters');
    process.exit(1);
}
if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required');
    process.exit(1);
}

let server;

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down gracefully.');
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
    if (server) {
        server.close(() => {
            console.log('Server closed.');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

// Graceful shutdown on SIGTERM (cloud platforms like Render, Railway, Kubernetes)
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully.');
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
    if (server) {
        server.close(() => {
            console.log('Server closed.');
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
            console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT} `);
            console.log(`http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to database', error);
        process.exit(1);
    }
};
if (process.env.NODE_ENV !== 'test') {
    startServer();
}

module.exports = app;
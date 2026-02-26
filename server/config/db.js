const mongoose = require('mongoose');
const dns = require('dns');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const MAX_DELAY_MS = 30000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

mongoose.set('strictQuery', true);

if (process.env.NODE_ENV === 'production') {
    mongoose.set('autoIndex', false);
}

const connectDB = async () => {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            // Explicitly setting DNS servers prevents resolution failures on some Docker/dev environments
            if (process.env.NODE_ENV !== 'production') {
                dns.setServers(['1.1.1.1', '8.8.8.8']);
            }

            const conn = await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: parseInt(process.env.DB_TIMEOUT_MS) || 30000,
                maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
                minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
            });
            logger.info(`MongoDB connected: ${conn.connection.host}`);
            return;
        } catch (err) {
            logger.error({ err }, 'MongoDB connection failed');
            retries++;
            if (retries < MAX_RETRIES) {
                // Exponential backoff capped at MAX_DELAY_MS: 2s, 4s, 8s, 16s, 30s
                const delay = Math.min(1000 * (2 ** retries), MAX_DELAY_MS);
                logger.info(`Retrying DB connection (${retries}/${MAX_RETRIES}) in ${delay / 1000}s...`);
                await sleep(delay);
            } else {
                logger.error('Max DB retries reached. Exiting...');
                process.exit(1);
            }
        }
    }
};

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
});
mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
});
mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB error');
});

module.exports = connectDB;

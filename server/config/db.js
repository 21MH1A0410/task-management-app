// /server/config/db.js
const mongoose = require('mongoose');
const dns = require('dns');

const MAX_RETRIES = 5;
const MAX_DELAY_MS = 30000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Run once at module load, not per retry
mongoose.set('strictQuery', true);

const connectDB = async () => {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            // Override DNS in dev to avoid local resolution issues
            if (process.env.NODE_ENV !== 'production') {
                dns.setServers(['1.1.1.1', '8.8.8.8']);
            }

            const conn = await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: parseInt(process.env.DB_TIMEOUT_MS) || 30000,
                maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
                minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
            });
            console.log(`MongoDB connected: ${conn.connection.host}`);
            return;
        } catch (err) {
            console.error('MongoDB connection failed:', err.message);
            retries++;
            if (retries < MAX_RETRIES) {
                // Exponential backoff capped at MAX_DELAY_MS
                const delay = Math.min(1000 * (2 ** retries), MAX_DELAY_MS);
                console.log(`Retrying DB connection (${retries}/${MAX_RETRIES}) in ${delay / 1000}s...`);
                await sleep(delay);
            } else {
                console.error('Max DB retries reached. Exiting...');
                process.exit(1);
            }
        }
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
});
mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
});
mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err.message);
});

module.exports = connectDB;

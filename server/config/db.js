const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
    try {
        // Fix for MongoDB connection issues in some environments
        dns.setServers(['1.1.1.1', '8.8.8.8']);

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;

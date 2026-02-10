require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
const { errorHandler } = require('./middleware/errorMiddleware');

app.use(express.json());
app.use(cors());

// Routes
app.use('/api/tasks', require('./routes/taskRoutes'));

app.use(errorHandler);

app.get('/', (req, res) => {
    res.send('Task Management API is running');
});

app.get('/api', (req, res) => {
    res.send(`Open Tasks in browser: http://localhost:${PORT}/api/tasks`);
})

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open in browser: http://localhost:${PORT}`);
});

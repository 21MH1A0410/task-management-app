// /server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const zodResolver = require('../middleware/zodResolver');
const { registerSchema, loginSchema } = require('../validations/userValidation');
const rateLimit = require('express-rate-limit');

// Stricter rate limiting for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // Default: 15 minutes
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5, // Default: 5 attempts
    message: 'Too many authentication attempts, please try again later'
});

// Public Routes
router.post('/', authLimiter, zodResolver(registerSchema), registerUser);
router.post('/login', authLimiter, zodResolver(loginSchema), loginUser);

// Protected Routes
router.get('/me', protect, getMe);

module.exports = router;

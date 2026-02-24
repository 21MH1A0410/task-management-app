const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Prefer the HttpOnly cookie — invisible to JS so XSS-safe.
    // Fall back to the Authorization header so supertest/Jest suites that send
    // `Bearer <token>` directly keep passing without any test-file changes.
    if (req.cookies?.token) {
        token = req.cookies.token;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }

    try {
        // algorithms whitelist prevents algorithm substitution attacks (e.g. 'none' or RS256 with HS256 key)
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256']
        });

        req.user = await User.findById(decoded.id)
            .select('-password -profileImage.data')
            .lean();

        if (!req.user) {
            // Token signature is valid but the user was deleted from the DB
            res.status(401);
            throw new Error('User not found');
        }

        // tokenVersion mismatch means the token was issued before a password change or session revoke
        const decodedVersion = decoded.tokenVersion || 0;
        if (req.user.tokenVersion !== decodedVersion) {
            res.status(401);
            throw new Error('Session expired or revoked. Please log in again.');
        }

        next();
    } catch (error) {
        logger.error({ requestId: req.id, err: error }, 'Authentication error');
        res.status(401);
        throw new Error(error.message || 'Not authorized');
    }
});

module.exports = { protect };

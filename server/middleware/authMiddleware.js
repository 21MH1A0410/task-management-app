// /server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Algorithm restriction prevents confusion attacks (CVE-2015-9235)
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            req.user = await User.findById(decoded.id)
                .select('-password')
                .lean();

            if (!req.user) {
                res.status(401);
                throw new Error('User not found');
            }

            next();
        } catch (error) {
            console.error('Auth error:', error.message);
            res.status(401);
            throw new Error('Not authorized');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

module.exports = { protect };

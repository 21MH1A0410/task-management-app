// /server/controllers/userController.js
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d'
    });
};

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Handle race condition if concurrent registrations slip past the check
    try {
        const user = await User.create({
            name,
            email,
            password
        });

        res.status(201).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
                expiresIn: '1d'
            }
        });
    } catch (err) {
        if (err.code === 11000) {
            res.status(400);
            throw new Error('Email already registered');
        }
        throw err;
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Normalize email to lowercase for case-insensitive comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
                expiresIn: '1d'
            }
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

const getMe = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email
        }
    });
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
};

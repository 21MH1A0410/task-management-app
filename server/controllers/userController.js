const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sharp = require('sharp');
const User = require('../models/User');

/**
 * Signs a JWT embedding the user's tokenVersion so any token issued before a version
 * bump is immediately rejected by authMiddleware.
 * @param {string} id - MongoDB user ID
 * @param {boolean} rememberMe - Extends expiry from 1d to 30d when true
 * @param {number} tokenVersion - Current version from the User document
 */
const generateToken = (id, rememberMe = false, tokenVersion = 0) => {
    const defaultExp = process.env.JWT_EXPIRES_IN || '1d';
    return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: rememberMe ? '30d' : defaultExp
    });
};

/**
 * Attaches the JWT as an HttpOnly cookie so JavaScript can never read it,
 * eliminating the XSS token-theft attack vector entirely.
 * - rememberMe → 30-day persistent cookie kept on disk by the browser
 * - no rememberMe → omitting maxAge makes it a session cookie (wiped on browser close)
 * - secure: true is only set in production since localhost doesn't run HTTPS in dev
 */
const setCookieToken = (res, token, rememberMe = false) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        ...(rememberMe && { maxAge: 30 * 24 * 60 * 60 * 1000 }) // 30 days in ms
    });
};

const registerUser = asyncHandler(async (req, res) => {
    // Zod middleware has already lowercased and trimmed the email before it reaches here
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    try {
        const user = await User.create({ name, email, password });
        const token = generateToken(user._id, false, user.tokenVersion);
        // Session cookie on register — user can choose rememberMe on the next login
        setCookieToken(res, token, false);

        res.status(201).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                createdAt: user.createdAt,
                hasProfilePic: !!(user.profileImage && user.profileImage.contentType)
            }
        });
    } catch (err) {
        // Race condition: two identical registrations can slip past the findOne check.
        // MongoDB's unique index on email is the real enforcement layer.
        if (err.code === 11000) {
            res.status(400);
            throw new Error('Email already registered');
        }
        throw err;
    }
});

const loginUser = asyncHandler(async (req, res) => {
    // Zod middleware has already lowercased and trimmed the email before it reaches here
    const { email, password, rememberMe } = req.body;

    // password is excluded from queries by default — must explicitly select it
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        res.status(401);
        throw new Error('Email not registered');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (isValidPassword) {
        const token = generateToken(user._id, rememberMe, user.tokenVersion);
        setCookieToken(res, token, rememberMe);

        res.json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                createdAt: user.createdAt,
                hasProfilePic: !!(user.profileImage && user.profileImage.contentType)
            }
        });
    } else {
        res.status(401);
        throw new Error('Incorrect credentials');
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    // Clearing with the same flags as the set call ensures the browser accepts the clear
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
});

const getMe = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            bio: req.user.bio,
            createdAt: req.user.createdAt,
            hasProfilePic: !!(req.user.profileImage && req.user.profileImage.contentType)
        }
    });
});

const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.name = req.body.name || user.name;
    // bio can be intentionally cleared to "" — checking for undefined rather than falsy
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;

    const updatedUser = await user.save();

    res.json({
        success: true,
        data: {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            bio: updatedUser.bio,
            createdAt: updatedUser.createdAt,
            hasProfilePic: !!(updatedUser.profileImage && updatedUser.profileImage.contentType)
        }
    });
});

const updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        res.status(401);
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    // Incrementing tokenVersion invalidates all existing JWTs on all devices immediately
    user.tokenVersion += 1;
    await user.save();

    // Issue a fresh cookie so the current session stays valid after the version bump
    const freshToken = generateToken(user._id, false, user.tokenVersion);
    setCookieToken(res, freshToken, false);

    res.json({
        success: true,
        message: 'Password updated successfully'
    });
});

const revokeAllSessions = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.tokenVersion += 1;
    await user.save();

    // Issue a new cookie so the caller's own session stays alive after the revoke
    const freshToken = generateToken(user._id, false, user.tokenVersion);
    setCookieToken(res, freshToken, false);

    res.json({
        success: true,
        message: 'All other sessions have been revoked'
    });
});

const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const Task = require('../models/Task');
    // Delete tasks first so orphaned documents don't linger if the user deletion fails
    await Task.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);

    // Clear the auth cookie so the browser drops the session immediately
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
    });

    res.status(200).json({
        success: true,
        message: 'User account and all associated tasks have been permanently deleted.'
    });
});

// multer puts the file in req.file.buffer (memory storage); sharp processes it without
// touching disk, so no file ever lands on the filesystem and there are no orphan files
const uploadProfilePic = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No image file provided');
    }

    // Fixed 200×200 JPEG keeps the stored Buffer small (~10-20KB)
    const resizedBuffer = await sharp(req.file.buffer)
        .resize(200, 200, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 85 })
        .toBuffer();

    // Buffer.from() guards against Uint8Array typed-array edge cases in some Node versions
    const finalBuffer = Buffer.from(resizedBuffer);
    if (!finalBuffer || finalBuffer.length === 0) {
        res.status(500);
        throw new Error('Image processing failed: resulting buffer is empty');
    }

    // $set overwrites the previous Buffer in-place — no orphan storage, no cleanup needed
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            'profileImage.data': finalBuffer,
            'profileImage.contentType': 'image/jpeg'
        }
    });

    res.status(200).json({
        success: true,
        data: { hasProfilePic: true }
    });
});

// Public — no auth. Browser <img> tags can't send Authorization headers, so this must be open
const getProfilePic = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('profileImage');

    if (!user?.profileImage?.data) {
        res.status(404);
        throw new Error('No profile picture found');
    }

    res.set('Content-Type', user.profileImage.contentType);
    // 24-hour client cache — busted by the ?t= timestamp appended after each upload
    res.set('Cache-Control', 'private, max-age=86400');
    res.send(user.profileImage.data);
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    updateProfile,
    updatePassword,
    revokeAllSessions,
    deleteUser,
    uploadProfilePic,
    getProfilePic
};

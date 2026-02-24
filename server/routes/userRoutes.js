const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
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
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const zodResolver = require('../middleware/zodResolver');
const { registerSchema, loginSchema } = require('../validations/userValidation');
const rateLimit = require('express-rate-limit');

// memoryStorage keeps the file in req.file.buffer so sharp can process it without touching disk
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG and WebP images are allowed'));
        }
    }
});

const authLimiter = rateLimit({
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: { message: 'Too many authentication attempts, please try again later' }
        });
    }
});

router.post('/', authLimiter, zodResolver(registerSchema), registerUser);
router.post('/login', authLimiter, zodResolver(loginSchema), loginUser);
router.post('/logout', logoutUser);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.delete('/profile', protect, deleteUser);
router.put('/password', protect, updatePassword);
router.post('/revoke-all-sessions', protect, revokeAllSessions);

router.put('/profile-pic', protect, upload.single('profilePic'), uploadProfilePic);
// Public — browser <img> tags can't send Authorization headers
router.get('/:id/profile-pic', getProfilePic);

module.exports = router;

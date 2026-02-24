// Profile images are stored as raw Buffers in MongoDB — no orphan files, no S3 complexity.
// Overwriting just replaces bytes in-place.
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        // select: false prevents the hash from appearing in query results unless
        // explicitly requested with .select('+password')
        select: false
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot be more than 500 characters'],
        default: ''
    },
    profileImage: {
        data: { type: Buffer, default: null },
        contentType: { type: String, default: null }
    },
    // Incremented on password change or session revoke. Auth middleware compares this
    // against the value embedded in the JWT to immediately invalidate stale tokens.
    tokenVersion: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Strips sensitive and internal fields before serialization.
// Consumers receive { id, name, email, bio, hasProfilePic, createdAt } — no Buffer, no tokenVersion.
userSchema.set('toJSON', {
    transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.tokenVersion;
        // Boolean flag instead of raw Buffer — keeps response payloads small
        ret.hasProfilePic = !!(ret.profileImage && ret.profileImage.data);
        delete ret.profileImage;
        return ret;
    }
});

// Skipping the isModified guard would re-hash an already-hashed value on unrelated saves
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', userSchema);

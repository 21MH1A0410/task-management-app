// Soft-delete: isDeleted=true hides the task from all API queries immediately.
// The TTL index permanently purges it after 7 days, giving users an undo window.
const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [50, 'Title is too long']
    },
    description: {
        type: String,
        maxlength: [100, 'Description is too long']
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },
    dueDate: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    // Populated on soft-delete. The TTL index reads this to schedule hard-deletion.
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// user+isDeleted first so Mongo filters to the right user's active tasks before
// applying any additional status or date predicates — avoids full collection scans
taskSchema.index({ user: 1, isDeleted: 1, status: 1, createdAt: -1 });
taskSchema.index({ user: 1, isDeleted: 1, dueDate: 1 });

// TTL index hard-deletes after 7 days (604800s); the undo window expires well before this
taskSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('Task', taskSchema);

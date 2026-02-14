// /server/models/Task.js
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
        trim: true
    },
    description: {
        type: String
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
    }
}, {
    timestamps: true
});

// Optimize common access patterns
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, isDeleted: 1, createdAt: -1 }); // Covers soft deletes
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ title: 'text' });

module.exports = mongoose.model('Task', taskSchema);

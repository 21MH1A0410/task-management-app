// /server/controllers/taskController.js
const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');

const getTasks = asyncHandler(async (req, res) => {
    const filter = { user: req.user._id, isDeleted: false };

    if (req.query.search) {
        filter.$text = { $search: req.query.search };
    }

    if (req.query.status) {
        filter.status = req.query.status;
    }

    // Explicit number casting for safety
    const page = Number(req.query.page) || 1;
    const maxLimit = parseInt(process.env.MAX_PAGINATION_LIMIT) || 50;
    const limit = req.query.limit
        ? Math.min(Number(req.query.limit), maxLimit)
        : 10;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
        Task.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Task.countDocuments(filter)
    ]);

    // totalPages should be at least 1 for empty results (frontend UX)
    const totalPages = Math.max(1, Math.ceil(total / limit));

    if (page > 1 && page > totalPages) {
        return res.status(200).json({
            success: true,
            data: [],
            meta: {
                count: 0,
                total,
                page,
                pages: totalPages
            }
        });
    }

    res.status(200).json({
        success: true,
        data: tasks,
        meta: {
            count: tasks.length,
            total,
            page,
            pages: totalPages
        }
    });
});

const getTaskById = asyncHandler(async (req, res) => {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id, isDeleted: false }).lean();

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    res.status(200).json({
        success: true,
        data: task
    });
});

const createTask = asyncHandler(async (req, res) => {
    const task = await Task.create({
        user: req.user._id,
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        dueDate: req.body.dueDate
    });

    res.status(201).json({
        success: true,
        data: task
    });
});



const updateTask = asyncHandler(async (req, res) => {
    const { title, description, status, dueDate } = req.body;

    // $set preserves createdAt/updatedAt instead of full replace
    const updatedTask = await Task.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id, isDeleted: false },
        {
            $set: {
                title,
                description,
                status,
                dueDate
            }
        },
        { new: true, runValidators: true }
    );

    if (!updatedTask) {
        res.status(404);
        throw new Error('Task not found');
    }

    res.status(200).json({
        success: true,
        data: updatedTask
    });
});

const patchTask = asyncHandler(async (req, res) => {
    // Whitelist prevents mass assignment (e.g., user, isDeleted, createdAt)
    const allowedFields = ['title', 'description', 'status', 'dueDate'];

    const fieldsToUpdate = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    // Reject empty updates to prevent confusion
    if (Object.keys(fieldsToUpdate).length === 0) {
        res.status(400);
        throw new Error('No valid fields provided for update');
    }

    const updatedTask = await Task.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id, isDeleted: false },
        { $set: fieldsToUpdate },
        { new: true, runValidators: true }
    );

    if (!updatedTask) {
        res.status(404);
        throw new Error('Task not found');
    }

    res.status(200).json({
        success: true,
        data: updatedTask
    });
});

const completeAllTasks = asyncHandler(async (req, res) => {
    const result = await Task.updateMany(
        { user: req.user._id, status: { $ne: 'completed' }, isDeleted: false },
        { status: 'completed' }
    );

    res.status(200).json({
        success: true,
        data: {
            modifiedCount: result.modifiedCount
        }
    });
});

const deleteTask = asyncHandler(async (req, res) => {
    const result = await Task.updateOne(
        { _id: req.params.id, user: req.user._id, isDeleted: false },
        { isDeleted: true }
    );

    if (result.matchedCount === 0) {
        res.status(404);
        throw new Error('Task not found');
    }

    res.status(200).json({
        success: true,
        data: { id: req.params.id }
    });
});

const deleteTasksByStatus = asyncHandler(async (req, res) => {
    const result = await Task.updateMany({
        user: req.user._id,
        status: req.query.status,
        isDeleted: false
    }, {
        isDeleted: true
    });

    res.status(200).json({
        success: true,
        data: {
            modifiedCount: result.modifiedCount
        }
    });
});

const quickTaskFlow = asyncHandler(async (req, res) => {
    const task = await Task.create({
        user: req.user._id,
        title: req.body.title,
        status: 'in-progress'
    });

    res.status(201).json({
        success: true,
        data: task
    });
});

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    patchTask,
    completeAllTasks,
    deleteTask,
    deleteTasksByStatus,
    quickTaskFlow
};

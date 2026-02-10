const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Task = require('../models/Task');

// @desc    Get all tasks (with filtering and pagination)
// @route   GET /api/tasks?status=pending&page=1&limit=10
// @access  Public (will be Private)
const getTasks = asyncHandler(async (req, res) => {
    const filter = { user: req.user.id };
    if (req.query.status) {
        filter.status = req.query.status;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const tasks = await Task.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Task.countDocuments(filter);

    res.status(200).json({
        success: true,
        count: tasks.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: tasks
    });
});

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Public
const getTaskById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid task ID');
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    res.status(200).json(task);
});

// @desc    Create a task
// @route   POST /api/tasks
// @access  Public (will be Private)
const createTask = asyncHandler(async (req, res) => {
    if (!req.body.title) {
        res.status(400);
        throw new Error('Please add a title');
    }

    const task = await Task.create({
        user: req.user.id,
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        dueDate: req.body.dueDate
    });

    res.status(201).json(task);
});

// @desc    Bulk create tasks
// @route   POST /api/tasks/bulk
// @access  Public
const createBulkTasks = asyncHandler(async (req, res) => {
    if (!Array.isArray(req.body) || req.body.length === 0) {
        res.status(400);
        throw new Error('Provide an array of tasks');
    }

    const tasks = req.body.map(task => ({ ...task, user: req.user.id }));
    const createdTasks = await Task.insertMany(tasks);

    res.status(201).json({
        success: true,
        count: createdTasks.length,
        data: createdTasks
    });
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Public (will be Private)
const updateTask = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid task ID');
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the task user
    if (task.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json(updatedTask);
});

// @desc    Partial update (PATCH)
// @route   PATCH /api/tasks/:id
// @access  Public
const patchTask = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid task ID');
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the task user
    if (task.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    res.status(200).json(updatedTask);
});

// @desc    Bulk update (mark all completed)
// @route   PATCH /api/tasks/complete-all
// @access  Public
const completeAllTasks = asyncHandler(async (req, res) => {
    const result = await Task.updateMany(
        { status: { $ne: 'completed' } },
        { status: 'completed' }
    );

    res.status(200).json({
        success: true,
        modifiedCount: result.modifiedCount
    });
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Public (will be Private)
const deleteTask = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid task ID');
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the task user
    if (task.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await task.deleteOne();

    res.status(200).json({ id: req.params.id });
});

// @desc    Delete by filter
// @route   DELETE /api/tasks?status=completed
// @access  Public
const deleteTasksByStatus = asyncHandler(async (req, res) => {
    if (!req.query.status) {
        res.status(400);
        throw new Error('Status query is required');
    }

    const result = await Task.deleteMany({ status: req.query.status });

    res.status(200).json({
        success: true,
        deletedCount: result.deletedCount
    });
});

// @desc    Quick CRUD Flow
// @route   POST /api/tasks/quick
// @access  Public
const quickTaskFlow = asyncHandler(async (req, res) => {
    // 1. Create
    const task = await Task.create({
        user: req.user.id,
        title: req.body.title,
        status: 'pending'
    });

    // 2. Immediate Update
    task.status = 'in-progress';
    await task.save();

    // 3. Return
    res.status(201).json(task);
});

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    createBulkTasks,
    updateTask,
    patchTask,
    completeAllTasks,
    deleteTask,
    deleteTasksByStatus,
    quickTaskFlow
};

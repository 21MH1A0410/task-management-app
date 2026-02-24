// Tasks are always scoped to req.user._id — the user field is never accepted from req.body
const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');

const getTasks = asyncHandler(async (req, res) => {
    const filter = { user: req.user._id, isDeleted: false };

    if (req.query.search) {
        // Escape regex meta-characters so user input can't manipulate the query pattern (ReDoS)
        const escapedSearch = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.title = { $regex: `\\b${escapedSearch}`, $options: 'i' };
    }

    if (req.query.status) {
        filter.status = req.query.status;
    }

    // URL params are always strings — coerce explicitly before arithmetic
    const page = Number(req.query.page) || 1;
    const maxLimit = parseInt(process.env.MAX_PAGINATION_LIMIT) || 50;
    const limit = req.query.limit
        ? Math.min(Number(req.query.limit), maxLimit)
        : 12;
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    let tasksPromise;

    if (sortBy === 'dueDate') {
        // Regular .sort() pushes null dates inconsistently across drivers.
        // The aggregation pipeline lets us explicitly force no-date tasks to the bottom.
        tasksPromise = Task.aggregate([
            { $match: filter },
            {
                $addFields: {
                    hasDueDate: { $cond: [{ $eq: [{ $ifNull: ['$dueDate', null] }, null] }, 0, 1] }
                }
            },
            // hasDueDate desc → dated tasks first; then actual date; then newest as tie-breaker
            { $sort: { hasDueDate: -1, [sortBy]: order, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $project: { __v: 0, hasDueDate: 0 } }
        ]);
    } else {
        tasksPromise = Task.find(filter)
            .sort({ [sortBy]: order })
            .skip(skip)
            .limit(limit)
            .select('-__v')
            .lean();
    }

    // Run task query and count in parallel — neither depends on the other's result
    const [tasks, total] = await Promise.all([
        tasksPromise,
        Task.countDocuments(filter)
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Return an empty data array with real page count if the client is ahead of the server
    // (e.g. user is on page 4 and a bulk delete leaves only 3 pages) so the frontend can self-correct
    if (page > 1 && page > totalPages) {
        return res.status(200).json({
            success: true,
            data: [],
            meta: { count: 0, total, page, pages: totalPages }
        });
    }

    res.status(200).json({
        success: true,
        data: tasks,
        meta: { count: tasks.length, total, page, pages: totalPages }
    });
});

const getTaskById = asyncHandler(async (req, res) => {
    // Scoping to req.user._id ensures users can never read each other's tasks by ID
    const task = await Task.findOne({
        _id: req.params.id,
        user: req.user._id,
        isDeleted: false
    }).lean();

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    res.status(200).json({ success: true, data: task });
});

const createTask = asyncHandler(async (req, res) => {
    const task = await Task.create({
        user: req.user._id, // Always stamped server-side — never from req.body
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        dueDate: req.body.dueDate
    });

    res.status(201).json({ success: true, data: task });
});

// Full replacement — Zod validates all required fields are present before we reach here
const updateTask = asyncHandler(async (req, res) => {
    const { title, description, status, dueDate } = req.body;
    const updates = { title, description, status, dueDate };

    // Belt-and-suspenders: guard against an empty body slipping past a misconfigured route
    if (Object.keys(updates).filter(k => updates[k] !== undefined).length === 0) {
        res.status(400);
        throw new Error('No valid fields provided for update');
    }

    const updatedTask = await Task.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id, isDeleted: false },
        { $set: updates },
        { new: true, runValidators: true }
    ).lean();

    if (!updatedTask) {
        res.status(404);
        throw new Error('Task not found');
    }

    res.status(200).json({ success: true, data: updatedTask });
});

// Explicitly whitelist allowed fields to prevent mass-assignment attacks
const patchTask = asyncHandler(async (req, res) => {
    const allowedFields = ['title', 'description', 'status', 'dueDate'];

    const fieldsToUpdate = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    // An empty PATCH is misleading — the client assumes something changed, but nothing did
    if (Object.keys(fieldsToUpdate).length === 0) {
        res.status(400);
        throw new Error('No valid fields provided for update');
    }

    const updatedTask = await Task.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id, isDeleted: false },
        { $set: fieldsToUpdate },
        { new: true, runValidators: true }
    ).lean();

    if (!updatedTask) {
        res.status(404);
        throw new Error('Task not found');
    }

    res.status(200).json({ success: true, data: updatedTask });
});

const completeAllTasks = asyncHandler(async (req, res) => {
    const result = await Task.updateMany(
        { user: req.user._id, status: { $ne: 'completed' }, isDeleted: false },
        { status: 'completed' }
    );

    res.status(200).json({
        success: true,
        data: { modifiedCount: result.modifiedCount }
    });
});

// Soft-delete: stamps deletedAt so the TTL index can schedule hard-deletion after 7 days
const deleteTask = asyncHandler(async (req, res) => {
    const result = await Task.updateOne(
        { _id: req.params.id, user: req.user._id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() }
    );

    if (result.matchedCount === 0) {
        res.status(404);
        throw new Error('Task not found');
    }

    res.status(200).json({ success: true, data: { id: req.params.id } });
});

// Nulling deletedAt also cancels the TTL index schedule — the task won't be hard-deleted
const restoreTask = asyncHandler(async (req, res) => {
    const result = await Task.updateOne(
        { _id: req.params.id, user: req.user._id, isDeleted: true },
        { isDeleted: false, deletedAt: null }
    );

    if (result.matchedCount === 0) {
        res.status(404);
        throw new Error('Task not found or already restored');
    }

    res.status(200).json({ success: true, data: { id: req.params.id } });
});

const deleteTasksByStatus = asyncHandler(async (req, res) => {
    // Double-check the confirmation flag even though Zod validates it —
    // makes accidental bulk deletes from tooling or misconfigured clients much harder
    if (req.query.confirm !== 'true') {
        res.status(400);
        throw new Error('Please confirm deletion by setting confirm=true');
    }

    const result = await Task.updateMany({
        user: req.user._id,
        status: req.query.status,
        isDeleted: false
    }, {
        isDeleted: true,
        deletedAt: new Date()
    });

    res.status(200).json({
        success: true,
        data: { modifiedCount: result.modifiedCount }
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
    restoreTask,
    deleteTasksByStatus,
};

const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/taskController');

// Static Routes (MUST be before dynamic :id routes)
const { protect } = require('../middleware/authMiddleware');

router.post('/bulk', protect, createBulkTasks);
router.patch('/complete-all', protect, completeAllTasks);
router.post('/quick', protect, quickTaskFlow);

// General Routes (Get All / Delete by Filter / Create)
router.route('/')
    .get(protect, getTasks)
    .post(protect, createTask)
    .delete(protect, deleteTasksByStatus);

// Dynamic Routes (ID based)
router.route('/:id')
    .get(protect, getTaskById)
    .put(protect, updateTask)
    .patch(protect, patchTask)
    .delete(protect, deleteTask);

module.exports = router;

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
router.post('/bulk', createBulkTasks);
router.patch('/complete-all', completeAllTasks);
router.post('/quick', quickTaskFlow);

// General Routes (Get All / Delete by Filter / Create)
router.route('/')
    .get(getTasks)
    .post(createTask)
    .delete(deleteTasksByStatus);

// Dynamic Routes (ID based)
router.route('/:id')
    .get(getTaskById)
    .put(updateTask)
    .patch(patchTask)
    .delete(deleteTask);

module.exports = router;

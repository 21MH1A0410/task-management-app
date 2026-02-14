// /server/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    patchTask,
    completeAllTasks,
    deleteTask,
    deleteTasksByStatus,
    quickTaskFlow
} = require('../controllers/taskController');

const zodResolver = require('../middleware/zodResolver');
const {
    createTaskSchema,
    updateTaskSchema,
    patchTaskSchema,
    getTasksSchema,
    deleteTasksByStatusSchema,
    quickTaskSchema,
    taskIdParamSchema
} = require('../validations/taskValidation');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.patch('/complete-all', zodResolver(require('zod').object({})), completeAllTasks);
router.post('/quick', zodResolver(quickTaskSchema), quickTaskFlow);

// General Routes
router.route('/')
    .get(zodResolver(getTasksSchema), getTasks)
    .post(zodResolver(createTaskSchema), createTask)
    .delete(zodResolver(deleteTasksByStatusSchema), deleteTasksByStatus);

// Specific Task Routes
router.route('/:id')
    .get(zodResolver(taskIdParamSchema), getTaskById)
    .put(zodResolver(updateTaskSchema), updateTask)
    .patch(zodResolver(patchTaskSchema), patchTask)
    .delete(zodResolver(taskIdParamSchema), deleteTask);

module.exports = router;

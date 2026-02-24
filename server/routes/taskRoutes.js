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
    restoreTask,
    deleteTasksByStatus,
} = require('../controllers/taskController');

const zodResolver = require('../middleware/zodResolver');
const {
    createTaskSchema,
    updateTaskSchema,
    patchTaskSchema,
    getTasksSchema,
    deleteTasksByStatusSchema,
    taskIdParamSchema
} = require('../validations/taskValidation');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// complete-all must be registered before /:id or Express will match "complete-all" as an ID param
router.patch('/complete-all', zodResolver(require('zod').object({})), completeAllTasks);

router.route('/')
    .get(zodResolver(getTasksSchema), getTasks)
    .post(zodResolver(createTaskSchema), createTask)
    .delete(zodResolver(deleteTasksByStatusSchema), deleteTasksByStatus);

router.route('/:id')
    .get(zodResolver(taskIdParamSchema), getTaskById)
    .put(zodResolver(updateTaskSchema), updateTask)
    .patch(zodResolver(patchTaskSchema), patchTask)
    .delete(zodResolver(taskIdParamSchema), deleteTask);

router.patch('/:id/restore', zodResolver(taskIdParamSchema), restoreTask);

module.exports = router;

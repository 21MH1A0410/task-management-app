import api from './api';

/**
 * Fetches a paginated, filtered list of tasks for the authenticated user.
 * @param {{ page?: number, limit?: number, status?: string, search?: string, sortBy?: string, order?: string }} params
 * @returns {Promise<{ data: Task[], meta: { count, total, page, pages } }>}
 */
const getTasks = async (params) => {
    return await api.get('/tasks', { params });
};

/**
 * Creates a new task.
 * @param {{ title: string, description?: string, status?: string, dueDate?: string }} taskData
 */
const createTask = async (taskData) => {
    return await api.post('/tasks', taskData);
};

/**
 * Full replacement update (PUT). All required fields must be present.
 * @param {string} id - Task MongoDB ID
 * @param {{ title: string, description?: string, status?: string, dueDate?: string }} taskData
 */
const updateTask = async (id, taskData) => {
    return await api.put(`/tasks/${id}`, taskData);
};

/**
 * Partial update (PATCH). Used for status transitions to avoid sending the full task payload.
 * @param {string} id - Task MongoDB ID
 * @param {Partial<{ title, description, status, dueDate }>} partialData
 */
const patchTask = async (id, partialData) => {
    return await api.patch(`/tasks/${id}`, partialData);
};

/**
 * Soft-deletes a task. A MongoDB TTL index handles permanent removal after 7 days.
 * @param {string} id - Task MongoDB ID
 */
const deleteTask = async (id) => {
    return await api.delete(`/tasks/${id}`);
};

/**
 * Reverses a soft-delete within the undo window.
 * @param {string} id - Task MongoDB ID
 */
const restoreTask = async (id) => {
    return await api.patch(`/tasks/${id}/restore`);
};

/** Marks every non-completed task as 'completed' in a single DB operation. */
const completeAllTasks = async () => {
    return await api.patch('/tasks/complete-all');
};

/**
 * Soft-deletes all tasks matching the given status.
 * The `confirm: 'true'` param is a backend safeguard against accidental bulk deletes.
 * @param {string} status - 'pending' | 'in-progress' | 'completed'
 */
const deleteTasksByStatus = async (status) => {
    return await api.delete('/tasks', { params: { status, confirm: 'true' } });
};

/**
 * Uploads or replaces the user's profile picture as multipart/form-data.
 * @param {File} file - Cropped JPEG from the ImageCropper component
 */
const uploadProfilePic = async (file) => {
    const formData = new FormData();
    formData.append('profilePic', file);
    return await api.put('/users/profile-pic', formData);
};

const taskService = {
    getTasks,
    createTask,
    updateTask,
    patchTask,
    deleteTask,
    restoreTask,
    completeAllTasks,
    deleteTasksByStatus,
    uploadProfilePic,
};

export default taskService;

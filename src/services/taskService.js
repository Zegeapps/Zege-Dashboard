import axios from 'axios';

/* ── Axios instance ──────────────────────────────────────── */
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

/* ── Task service functions ──────────────────────────────── */

/**
 * Fetch all tasks.
 * GET /api/tasks
 */
export const getTasks = () => api.get('/tasks');

/**
 * Create a new task.
 * POST /api/tasks
 * @param {Object} data - Task fields (title, description, etc.)
 */
export const createTask = (data) => api.post('/tasks', data);

/**
 * Update an existing task.
 * PUT /api/tasks?id=:id
 * @param {string} id   - Task ID
 * @param {Object} data - Updated fields
 */
export const updateTask = (id, data) => api.put(`/tasks?id=${id}`, data);

/**
 * Delete a task.
 * DELETE /api/tasks?id=:id
 * @param {string} id - Task ID
 */
export const deleteTask = (id) => api.delete(`/tasks?id=${id}`);

export default api;

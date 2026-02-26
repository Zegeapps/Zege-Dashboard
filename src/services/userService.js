import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getUsers = () => api.get('/admin');
export const createUser = (data) => api.post('/admin', data);
export const updateUser = (id, data) => api.put(`/admin?id=${id}`, data);
export const deleteUser = (id) => api.delete(`/admin?id=${id}`);

export default api;

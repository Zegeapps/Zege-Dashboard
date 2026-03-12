import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getActivities = async (userId) => {
    return api.get(`/activities?userId=${userId}`);
};

export const toggleManualActivity = async (userId, date) => {
    return api.post('/activities', { userId, date });
};

export default {
    getActivities,
    toggleManualActivity,
};

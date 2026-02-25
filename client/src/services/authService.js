import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api/auth',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const login = async (username, password) => {
    // Trim before sending so "sree " matches "sree" in DB
    const res = await api.post('/login', {
        username: username.trim(),
        password: password.trim(),
    });
    if (res.data) {
        localStorage.setItem('user', JSON.stringify(res.data));
    }
    return res.data;
};

export const logout = () => {
    localStorage.removeItem('user');
};

export const getCurrentUser = () => {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Must be a real object with _id
        return parsed && parsed._id ? parsed : null;
    } catch {
        // Corrupt localStorage value — clear it
        localStorage.removeItem('user');
        return null;
    }
};

export const isAuthenticated = () => {
    return getCurrentUser() !== null;
};

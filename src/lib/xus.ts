import axios from 'axios';

const getBaseUrl = () => {
    switch (import.meta.env.MODE) {
        case 'development':
            return 'http://localhost:3000';
        case 'test':
            return 'http://localhost:3000';
        case 'production':
            return process.env.VITE_API_URL || 'https://api.designflowhq.com';
        default:
            return 'http://localhost:3000';
    }
};

const xus = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
xus.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
xus.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default xus; 
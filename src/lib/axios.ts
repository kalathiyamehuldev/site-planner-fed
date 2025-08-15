import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor to handle common responses
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        // Handle common error responses
        if (error.response) {
            const { status, data } = error.response;
            
            // Handle unauthorized access
            if (status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('selectedCompany');
                window.location.href = '/auth/login';
                return Promise.reject(new Error('Session expired. Please login again.'));
            }
            
            // Handle other HTTP errors
            const errorMessage = data?.error || data?.message || `HTTP Error ${status}`;
            return Promise.reject(new Error(errorMessage));
        }
        
        // Handle network errors
        if (error.request) {
            return Promise.reject(new Error('Network error. Please check your connection.'));
        }
        
        // Handle other errors
        return Promise.reject(error);
    }
);

export default api;
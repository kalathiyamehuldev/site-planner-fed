import axios from 'axios';
import { toast } from 'sonner';

// Environment-specific API configuration
const getApiBaseUrl = () => {
    // Check if we're in production (Vercel)
    if (import.meta.env.PROD) {
        // In production, use the same domain with /api prefix for proxy
        return '/api';
    }
    // Development environment - use Vite proxy
    return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // Increased timeout for network issues
    headers: {
        'Content-Type': 'application/json',
    },
    // Add withCredentials for CORS
    withCredentials: false,
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
            console.error('Network Error Details:', {
                url: error.config?.url,
                method: error.config?.method,
                baseURL: error.config?.baseURL,
                timeout: error.config?.timeout
            });
            toast.error('Network error. Please check your connection and try again.');
            return Promise.reject(new Error('Network error. Please check your connection.'));
        }
        
        // Handle other errors
        return Promise.reject(error);
    }
);

export default api;
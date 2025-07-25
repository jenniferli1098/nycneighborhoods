import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';
console.log('🔍 VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('🔍 Computed API_URL:', API_URL);
console.log('🔍 All env vars:', import.meta.env);
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
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

export default api;
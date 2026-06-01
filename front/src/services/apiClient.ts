import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const noAuthEndpoints = ['/auth/login', '/auth/register'];
    const isAuthPath = noAuthEndpoints.some(path => config.url?.endsWith(path));

    if (token && config.url && !isAuthPath) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      if (error.config.url && !error.config.url.endsWith('/auth/login')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return new Promise(() => {});
      }
    }

    let errorMessage = 'Произошла неизвестная ошибка!';
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    if (!error.response || error.response.status !== 401) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  },
);

export default api;

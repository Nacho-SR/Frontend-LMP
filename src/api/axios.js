import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.replace('/login');
    }

    return Promise.reject(error);
  },
);

export default api;

import axios from 'axios';

var API_URL = process.env.NEXT_PUBLIC_API_URL;

export var api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    return typeof window !== 'undefined' ? 
      (() => {
        var token = localStorage.getItem('access_token');
        return token && config.headers ? 
          (() => {
            config.headers.Authorization = `Bearer ${token}`;
            return config;
          })() : 
          config;
      })() : 
      config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return error.response?.status === 401 ? 
      (() => {
        typeof window !== 'undefined' ? 
          (() => {
            import('../store/authStore').then(({ useAuthStore }) => {
              useAuthStore.getState().logout();
            });
            window.location.href = '/login';
          })() : 
          null;
        return Promise.reject(error);
      })() : 
      Promise.reject(error);
  }
);
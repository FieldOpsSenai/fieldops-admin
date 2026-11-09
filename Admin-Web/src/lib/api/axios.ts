import axios, { type AxiosError } from 'axios';
import { useSessionStore } from '@/stores/sessionStore';

// Credentials remain in HttpOnly cookies on the web origin.
export const API_BASE_URL = '/api/v1';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (typeof window !== 'undefined' && error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      useSessionStore.getState().clearSession();
      window.location.replace('/login?expired=true');
    }
    return Promise.reject(error);
  },
);
export default apiClient;

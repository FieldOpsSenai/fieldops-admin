import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useSessionStore } from '@/stores/sessionStore';
import { refreshSession } from '@/lib/auth/refreshSession';

// Credentials remain in HttpOnly cookies on the web origin.
export const API_BASE_URL = '/api/v1';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (typeof window !== 'undefined' && error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      const config = error.config as (InternalAxiosRequestConfig & { sessionRetried?: boolean }) | undefined;
      if (config && !config.sessionRetried) {
        config.sessionRetried = true;
        if (await refreshSession()) return apiClient.request(config);
      }
      useSessionStore.getState().clearSession();
      window.location.replace('/login?expired=true');
    }
    return Promise.reject(error);
  },
);
export default apiClient;

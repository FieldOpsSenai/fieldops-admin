import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * Axios instance configured for the FieldOps Java REST API.
 * 
 * Features:
 * - BaseURL from NEXT_PUBLIC_API_URL (default: http://localhost:8080/api/v1)
 * - Automatic Authorization: Bearer <token> request interceptor
 * - Response interceptors for 401 / 403 / 5xx handling
 */

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('fieldops_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Authentication and Server Errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 401 Unauthorized - token invalid or expired
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const isAuthRoute = window.location.pathname.startsWith('/login');
        if (!isAuthRoute) {
          useSessionStore.getState().clearSession();
          window.location.href = '/login?expired=true';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

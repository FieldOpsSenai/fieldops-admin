import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  useSessionStore,
} from '@/stores/sessionStore';

export const API_BASE_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  '/api/v1';

const apiClient: AxiosInstance =
  axios.create({
    baseURL:
      API_BASE_URL,

    timeout: 30_000,
    headers: {
      'Content-Type':
        'application/json',
    },
  });

apiClient.interceptors.request.use(
  (
    config:
      InternalAxiosRequestConfig
  ) => {
    if (
      typeof window !==
      'undefined'
    ) {
      const token =
        localStorage.getItem(
          'fieldops_token'
        );

      if (
        token &&
        config.headers
      ) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }
    }

    return config;
  },
  (error: unknown) =>
    Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) =>
    response,

  (
    error:
      AxiosError
  ) => {
    if (
      typeof window ===
      'undefined'
    ) {
      return Promise.reject(
        error
      );
    }

    const status =
      error.response?.status;

    const pathname =
      window.location.pathname;

    const isLoginPage =
      pathname.startsWith(
        '/login'
      );

    const isForbiddenPage =
      pathname.startsWith(
        '/forbidden'
      );

    if (
      status === 401 &&
      !isLoginPage
    ) {
      useSessionStore
        .getState()
        .clearSession();

      window.location.href =
        '/login?expired=true';

      return Promise.reject(
        error
      );
    }

    if (
      status === 403 &&
      !isLoginPage &&
      !isForbiddenPage
    ) {
      window.location.href =
        '/forbidden';

      return Promise.reject(
        error
      );
    }

    return Promise.reject(
      error
    );
  }
);

export default apiClient;

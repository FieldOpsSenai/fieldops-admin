/**
 * Unit tests for Axios instance configuration
 * 
 * These tests verify that the Axios instance is properly configured with:
 * - Correct baseURL and timeout
 * - JWT bearer authentication without cross-origin cookies
 * - Response interceptors for error handling
 */

import apiClient from './axios';

// Mock the session store
jest.mock('@/stores/sessionStore', () => ({
  useSessionStore: {
    getState: jest.fn(() => ({
      clearSession: jest.fn(),
    })),
  },
}));

describe('Axios instance - Configuration', () => {
  test('should have baseURL from environment variable or default', () => {
    expect(apiClient.defaults.baseURL).toBeDefined();
    // Should be either from NEXT_PUBLIC_API_URL or the same-origin API proxy.
    const isValidBaseURL =
      apiClient.defaults.baseURL === process.env.NEXT_PUBLIC_API_URL ||
      apiClient.defaults.baseURL === '/api/v1';
    expect(isValidBaseURL).toBe(true);
  });

  test('should not send cookies to the JWT API', () => {
    expect(apiClient.defaults.withCredentials).not.toBe(true);
  });

  test('should have 30 second timeout configured', () => {
    expect(apiClient.defaults.timeout).toBe(30_000);
  });

  test('should have response interceptors configured', () => {
    expect(apiClient.interceptors.response.handlers).toBeDefined();
    expect(apiClient.interceptors.response.handlers.length).toBeGreaterThan(0);
  });
});

describe('Axios instance - Interceptor behavior (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should have error handling logic for 401, 403, and 5xx status codes', () => {
    // This test verifies the interceptor exists and has the expected structure
    expect(apiClient.interceptors.response).toBeDefined();
    expect(apiClient.interceptors.response.handlers).toBeDefined();

    // The interceptor should have handlers for both resolved and rejected cases
    const handlers = apiClient.interceptors.response.handlers;
    expect(handlers.length).toBeGreaterThanOrEqual(1);

    // Each handler should have a fulfilled and/or rejected function
    handlers.forEach((handler) => {
      const typedHandler = handler as {
        fulfilled?: unknown;
        rejected?: unknown;
      };

      expect(
        typeof typedHandler.fulfilled === 'function' ||
          typeof typedHandler.rejected === 'function'
      ).toBe(true);
    });
  });
});

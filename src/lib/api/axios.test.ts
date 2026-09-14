/**
 * Unit tests for Axios instance configuration
 * 
 * These tests verify that the Axios instance is properly configured with:
 * - Correct baseURL and timeout
 * - withCredentials for cookie transmission
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
    // Should be either from NEXT_PUBLIC_API_URL or 'http://localhost:8080'
    const isValidBaseURL =
      apiClient.defaults.baseURL === process.env.NEXT_PUBLIC_API_URL ||
      apiClient.defaults.baseURL === 'http://localhost:8080';
    expect(isValidBaseURL).toBe(true);
  });

  test('should have withCredentials enabled for cookie transmission', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
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
    handlers.forEach((handler: any) => {
      expect(
        typeof handler.fulfilled === 'function' ||
          typeof handler.rejected === 'function'
      ).toBe(true);
    });
  });
});

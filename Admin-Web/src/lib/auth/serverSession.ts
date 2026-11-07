import { NextRequest, NextResponse } from 'next/server';
import type { Session } from '@/types';

export const ACCESS_COOKIE = 'fieldops_access';
export const REFRESH_COOKIE = 'fieldops_refresh';
export const apiBaseUrl = (
  process.env.FIELDOPS_API_INTERNAL_URL ??
  `${(process.env.FIELDOPS_API_URL || 'http://localhost:8080').replace(/\/+$/, '')}/api/v1`
).replace(/\/+$/, '');

export interface ApiSessionUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMINISTRATOR' | 'SUPERVISOR' | 'TECHNICIAN';
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export function toSession(user: ApiSessionUser): Session | null {
  if ((user.status && user.status !== 'ACTIVE') || !['ADMINISTRATOR', 'SUPERVISOR'].includes(user.role)) return null;
  return { userId: String(user.id), name: user.name, email: user.email, profile: user.role === 'ADMINISTRATOR' ? 'ADMINISTRADOR' : 'SUPERVISOR' };
}

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return request.headers.get('sec-fetch-site') !== 'cross-site' && (!origin || origin === request.nextUrl.origin);
}

export function sessionResponse(body: unknown, status = 200): NextResponse {
  const response = NextResponse.json(body, { status });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export function setSessionCookies(response: NextResponse, accessToken: string, expiresIn: number, refreshToken?: string) {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
  response.cookies.set(ACCESS_COOKIE, accessToken, { ...options, maxAge: Math.max(1, expiresIn) });
  if (refreshToken) response.cookies.set(REFRESH_COOKIE, refreshToken, { ...options, maxAge: 7 * 24 * 60 * 60 });
  // Remove the legacy cookie containing a token readable by browser scripts.
  response.cookies.set('fieldops_auth', '', { ...options, maxAge: 0 });
}

export function clearSessionCookies(response: NextResponse): NextResponse {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, 'fieldops_auth']) {
    response.cookies.set(name, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  }
  return response;
}

export async function authRequest(path: string, init: RequestInit = {}) {
  return fetch(`${apiBaseUrl}/auth/${path}`, { ...init, cache: 'no-store', signal: AbortSignal.timeout(15000) });
}

import { NextRequest, NextResponse } from 'next/server';
import type { Session } from '@/types';

export const ACCESS_COOKIE = 'fieldops_access';
export const REFRESH_COOKIE = 'fieldops_refresh';
export const apiBaseUrl = (
  process.env.FIELDOPS_API_INTERNAL_URL ??
  `${(process.env.FIELDOPS_API_URL || 'http://localhost:8080').replace(/\/+$/, '')}/api/v1`
).replace(/\/+$/, '');

export interface ApiSessionUser {
  id?: number;
  name?: string;
  nome?: string;
  email: string;
  role?: 'ADMINISTRATOR' | 'SUPERVISOR' | 'TECHNICIAN';
  perfil?: 'ADMINISTRADOR' | 'SUPERVISOR' | 'TECNICO';
  ativo?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export function jwtClaims(token: string): { id?: number; exp?: number } {
  try { return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')); }
  catch { return {}; }
}

export function toSession(user: ApiSessionUser, token?: string): Session | null {
  const profile = user.perfil ?? (user.role === 'ADMINISTRATOR' ? 'ADMINISTRADOR' : user.role);
  const id = user.id ?? (token ? jwtClaims(token).id : undefined);
  const name = user.nome ?? user.name;
  if (user.ativo === false || (user.status && user.status !== 'ACTIVE') || !['ADMINISTRADOR', 'SUPERVISOR'].includes(profile ?? '') || !id || !name || !user.email) return null;
  return { userId: String(id), name, email: user.email, profile: profile === 'ADMINISTRADOR' ? 'ADMINISTRADOR' : 'SUPERVISOR' };
}

export function tokenExpiry(token: string, fallback: number): number {
  const exp = jwtClaims(token).exp;
  return typeof exp === 'number' ? Math.max(1, Math.min(fallback, exp - Math.floor(Date.now() / 1000))) : fallback;
}

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  if (!origin || origin === request.nextUrl.origin) return true;
  // Next.js can normalize 127.0.0.1 to localhost internally. Compare the
  // browser's Origin with the actual request Host using the request protocol.
  const host = request.headers.get('host');
  if (!host) return false;
  try {
    const expected = new URL(request.nextUrl.origin);
    expected.host = host;
    return expected.host === host && expected.origin === origin;
  } catch { return false; }
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

import { NextRequest } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, authRequest, clearSessionCookies, isSameOrigin, sessionResponse, setSessionCookies, toSession, type ApiSessionUser } from '@/lib/auth/serverSession';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return sessionResponse({ message: 'Origem não permitida.' }, 403);
  let credentials: { email?: string; password?: string };
  try { credentials = await request.json(); } catch { return sessionResponse({ message: 'Requisição inválida.' }, 400); }
  if (typeof credentials.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email.trim()) || typeof credentials.password !== 'string' || !credentials.password) {
    return sessionResponse({ message: 'Informe e-mail e senha válidos.' }, 400);
  }
  try {
    const upstream = await authRequest('login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: credentials.email.trim(), password: credentials.password }) });
    if (!upstream.ok) return clearSessionCookies(sessionResponse({ message: upstream.status === 401 || upstream.status === 403 ? 'Credenciais inválidas ou usuário sem acesso.' : 'Não foi possível iniciar a sessão.' }, upstream.status));
    const data: { accessToken: string; refreshToken: string; expiresIn: number; user: ApiSessionUser } = await upstream.json();
    if (!data.accessToken || !data.refreshToken || !Number.isFinite(data.expiresIn) || !data.user) return sessionResponse({ message: 'Resposta de autenticação inválida.' }, 502);
    const session = toSession(data.user);
    if (!session) {
      await authRequest('logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: data.refreshToken }) });
      return clearSessionCookies(sessionResponse({ message: 'Este usuário não tem acesso à interface administrativa.' }, 403));
    }
    const response = sessionResponse({ session });
    setSessionCookies(response, data.accessToken, data.expiresIn, data.refreshToken);
    return response;
  } catch {
    return sessionResponse({ message: 'Não foi possível conectar à API FieldOps.' }, 502);
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return sessionResponse({ message: 'Sessão expirada.' }, 401);
  try {
    const upstream = await authRequest('me', { headers: { Authorization: `Bearer ${token}` } });
    if (!upstream.ok) return sessionResponse({ message: 'Não foi possível validar a sessão.' }, upstream.status);
    const user: ApiSessionUser = await upstream.json();
    const session = toSession(user);
    if (!session) return clearSessionCookies(sessionResponse({ message: 'Acesso não permitido.' }, 403));
    return sessionResponse({ session });
  } catch { return sessionResponse({ message: 'Não foi possível conectar à API FieldOps.' }, 502); }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return sessionResponse({ message: 'Origem não permitida.' }, 403);
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  let revoked = true;
  try {
    if (refreshToken) {
      const upstream = await authRequest('logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
      revoked = upstream.ok || upstream.status === 401;
    }
  } catch { revoked = false; }
  return clearSessionCookies(sessionResponse({ loggedOut: true, revoked }));
}

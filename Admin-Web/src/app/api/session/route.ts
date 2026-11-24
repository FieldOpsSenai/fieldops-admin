import { NextRequest } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, authRequest, clearSessionCookies, isSameOrigin, sessionResponse, setSessionCookies, toSession, tokenExpiry, type ApiSessionUser } from '@/lib/auth/serverSession';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return sessionResponse({ message: 'Origem não permitida.' }, 403);
  let credentials: { email?: string; password?: string };
  try { credentials = await request.json(); } catch { return sessionResponse({ message: 'Requisição inválida.' }, 400); }
  if (typeof credentials.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email.trim()) || typeof credentials.password !== 'string' || !credentials.password) {
    return sessionResponse({ message: 'Informe e-mail e senha válidos.' }, 400);
  }
  try {
    const upstream = await authRequest('login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: credentials.email.trim(), senha: credentials.password }) });
    if (!upstream.ok) return clearSessionCookies(sessionResponse({ message: upstream.status === 401 || upstream.status === 403 ? 'Credenciais inválidas ou usuário sem acesso.' : 'Não foi possível iniciar a sessão.' }, upstream.status));
    const data: { token?: string; accessToken?: string; refreshToken: string; expiracao?: number; expiresIn?: number; user?: ApiSessionUser } & Partial<ApiSessionUser> = await upstream.json();
    const access = data.token ?? data.accessToken;
    const lifetime = data.expiracao ?? data.expiresIn;
    if (!access || !data.refreshToken || !Number.isFinite(lifetime)) return sessionResponse({ message: 'Resposta de autenticação inválida.' }, 502);
    const session = toSession(data.user ?? data as ApiSessionUser, access);
    if (!session) {
      await authRequest('logout', { method: 'POST', headers: { Authorization: `Bearer ${access}` } });
      return clearSessionCookies(sessionResponse({ message: 'Este usuário não tem acesso à interface administrativa.' }, 403));
    }
    const response = sessionResponse({ session });
    setSessionCookies(response, access, tokenExpiry(access, lifetime!), data.refreshToken);
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
    const session = toSession(user, token);
    if (!session) return clearSessionCookies(sessionResponse({ message: 'Acesso não permitido.' }, 403));
    return sessionResponse({ session });
  } catch { return sessionResponse({ message: 'Não foi possível conectar à API FieldOps.' }, 502); }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return sessionResponse({ message: 'Origem não permitida.' }, 403);
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  let revoked = !accessToken && !refreshToken;
  try {
    if (accessToken) {
      const upstream = await authRequest('logout', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } });
      revoked = upstream.ok;
      if (upstream.status !== 401 && !upstream.ok) return clearSessionCookies(sessionResponse({ loggedOut: true, revoked: false }));
    }
    if (!revoked && refreshToken) {
      const refreshed = await authRequest('refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
      if (refreshed.status === 401 || refreshed.status === 403) revoked = true;
      else if (refreshed.ok) {
        const data: { token?: string; accessToken?: string } = await refreshed.json();
        accessToken = data.token ?? data.accessToken;
        if (accessToken) {
          const logout = await authRequest('logout', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } });
          revoked = logout.ok;
        }
      }
    } else if (!refreshToken && !revoked) {
      // Não há refresh token local que possa continuar a sessão.
      revoked = true;
    }
  } catch { revoked = false; }
  return clearSessionCookies(sessionResponse({ loggedOut: true, revoked }));
}

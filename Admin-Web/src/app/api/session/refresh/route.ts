import { NextRequest } from 'next/server';
import { REFRESH_COOKIE, authRequest, clearSessionCookies, isSameOrigin, sessionResponse, setSessionCookies, toSession, type ApiSessionUser } from '@/lib/auth/serverSession';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return sessionResponse({ message: 'Origem não permitida.' }, 403);
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return clearSessionCookies(sessionResponse({ message: 'Sessão expirada.' }, 401));
  try {
    const upstream = await authRequest('refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
    if (!upstream.ok) {
      const response = sessionResponse({ message: 'Não foi possível renovar a sessão.' }, upstream.status);
      return upstream.status === 401 || upstream.status === 403 ? clearSessionCookies(response) : response;
    }
    const data: { accessToken: string; expiresIn: number; refreshToken?: string } = await upstream.json();
    if (!data.accessToken || !Number.isFinite(data.expiresIn)) return sessionResponse({ message: 'Resposta de renovação inválida.' }, 502);
    const me = await authRequest('me', { headers: { Authorization: `Bearer ${data.accessToken}` } });
    if (!me.ok) {
      const response = sessionResponse({ message: 'Não foi possível validar a sessão renovada.' }, me.status);
      return me.status === 401 || me.status === 403 ? clearSessionCookies(response) : response;
    }
    const user: ApiSessionUser = await me.json();
    if (!toSession(user)) return clearSessionCookies(sessionResponse({ message: 'Acesso não permitido.' }, 403));
    const response = sessionResponse({ renewed: true });
    setSessionCookies(response, data.accessToken, data.expiresIn, data.refreshToken);
    return response;
  } catch { return sessionResponse({ message: 'Não foi possível conectar à API FieldOps.' }, 502); }
}

/** @jest-environment node */
import { NextRequest } from 'next/server';
import { POST, GET, DELETE } from './route';

const fetchMock = jest.fn();
const user = { id: 1, name: 'Admin', email: 'admin@example.com', role: 'ADMINISTRATOR', status: 'ACTIVE' };
const loginRequest = (origin = 'http://localhost') => new NextRequest('http://localhost/api/session', {
  method: 'POST', headers: { origin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@example.com', password: 'password-test' }),
});
beforeEach(() => { fetchMock.mockReset(); global.fetch = fetchMock; });

it('mantém os tokens somente em cookies HttpOnly', async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ accessToken: 'access-secret', refreshToken: 'refresh-secret', expiresIn: 900, user }));
  const response = await POST(loginRequest());
  const body = await response.text();
  expect(response.status).toBe(200);
  expect(body).not.toContain('access-secret');
  expect(body).not.toContain('refresh-secret');
  expect(response.cookies.get('fieldops_access')).toMatchObject({ value: 'access-secret', httpOnly: true, sameSite: 'lax' });
  expect(response.cookies.get('fieldops_refresh')).toMatchObject({ httpOnly: true });
  expect(response.headers.get('Cache-Control')).toBe('no-store');
});

it.each(['TECHNICIAN', 'INACTIVE'])('recusa usuário sem acesso web: %s', async (condition) => {
  fetchMock.mockResolvedValueOnce(Response.json({ accessToken: 'secret', refreshToken: 'refresh', expiresIn: 900,
    user: { ...user, ...(condition === 'TECHNICIAN' ? { role: condition } : { status: condition }) },
  })).mockResolvedValueOnce(new Response(null, { status: 204 }));
  const response = await POST(loginRequest());
  expect(response.status).toBe(403);
  expect(response.cookies.get('fieldops_access')?.value).toBe('');
});

it('bloqueia requisições de outra origem antes de acessar a API', async () => {
  expect((await POST(loginRequest('https://external.example'))).status).toBe(403);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('aceita origem local que corresponde ao Host mesmo quando Next normaliza a URL', async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ accessToken: 'access-secret', refreshToken: 'refresh-secret', expiresIn: 900, user }));
  const request = new NextRequest('http://localhost:3000/api/session', {
    method: 'POST', headers: { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: 'password-test' }),
  });
  expect((await POST(request)).status).toBe(200);
});

it('continua bloqueando origem diferente do Host', async () => {
  const request = new NextRequest('http://localhost:3000/api/session', {
    method: 'POST', headers: { host: '127.0.0.1:3000', origin: 'http://evil.example', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: 'password-test' }),
  });
  expect((await POST(request)).status).toBe(403);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('não restaura a sessão sem credencial no cookie', async () => {
  expect((await GET(new NextRequest('http://localhost/api/session'))).status).toBe(401);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('revoga o refresh token e remove os cookies ao sair', async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  const response = await DELETE(new NextRequest('http://localhost/api/session', { method: 'DELETE', headers: { cookie: 'fieldops_access=access-secret; fieldops_refresh=refresh-secret' } }));
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/auth/logout'), expect.objectContaining({ headers: { Authorization: 'Bearer access-secret' } }));
  expect(response.cookies.get('fieldops_access')?.value).toBe('');
  expect(response.cookies.get('fieldops_refresh')?.value).toBe('');
});

it('autentica com o contrato da API main e limita o cookie à expiração real do JWT', async () => {
  const claims = Buffer.from(JSON.stringify({ id: 42, exp: Math.floor(Date.now() / 1000) + 600 })).toString('base64url');
  const token = `header.${claims}.signature`;
  fetchMock.mockResolvedValueOnce(Response.json({ token, refreshToken: 'refresh', expiracao: 86400, nome: 'Admin', email: user.email, perfil: 'ADMINISTRADOR' }));
  const response = await POST(loginRequest());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ session: { userId: '42', name: 'Admin', email: user.email, profile: 'ADMINISTRADOR' } });
  expect(response.cookies.get('fieldops_access')?.maxAge).toBeLessThanOrEqual(600);
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), expect.objectContaining({ body: JSON.stringify({ email: user.email, senha: 'password-test' }) }));
});

it('valida a sessão da API main usando o id do token autenticado', async () => {
  const claims = Buffer.from(JSON.stringify({ id: 42 })).toString('base64url');
  fetchMock.mockResolvedValueOnce(Response.json({ nome: 'Admin', email: user.email, perfil: 'ADMINISTRADOR' }));
  const response = await GET(new NextRequest('http://localhost/api/session', { headers: { cookie: `fieldops_access=header.${claims}.signature` } }));
  expect(await response.json()).toEqual({ session: { userId: '42', name: 'Admin', email: user.email, profile: 'ADMINISTRADOR' } });
});

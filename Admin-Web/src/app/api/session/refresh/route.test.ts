/** @jest-environment node */
import { NextRequest } from 'next/server';
import { POST } from './route';

const fetchMock = jest.fn();
const request = () => new NextRequest('http://localhost/api/session/refresh', { method: 'POST', headers: { cookie: 'fieldops_refresh=refresh-secret' } });
beforeEach(() => { fetchMock.mockReset(); global.fetch = fetchMock; });

it('renova o cookie sem expor o access token e preserva refresh não rotacionado', async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ accessToken: 'renewed-secret', expiresIn: 900 }))
    .mockResolvedValueOnce(Response.json({ id: 1, name: 'Supervisor', email: 'supervisor@example.com', role: 'SUPERVISOR', status: 'ACTIVE' }));
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.text()).not.toContain('renewed-secret');
  expect(response.cookies.get('fieldops_access')).toMatchObject({ value: 'renewed-secret', httpOnly: true });
  expect(response.cookies.get('fieldops_refresh')).toBeUndefined();
});

it('limpa cookies quando a API rejeita definitivamente a renovação', async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
  const response = await POST(request());
  expect(response.status).toBe(401);
  expect(response.cookies.get('fieldops_refresh')?.value).toBe('');
});

it('preserva cookies diante de falha transitória da API', async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));
  const response = await POST(request());
  expect(response.status).toBe(503);
  expect(response.cookies.get('fieldops_refresh')).toBeUndefined();
});

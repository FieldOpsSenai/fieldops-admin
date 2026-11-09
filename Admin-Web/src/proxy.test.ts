/** @jest-environment node */
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

it('redireciona visitante sem sessão para login', () => {
  const response = proxy(new NextRequest('http://localhost/inspections'));
  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toContain('/login?redirect=%2Finspections');
});

it.each(['fieldops_access', 'fieldops_refresh'])('permite alcançar a aplicação com cookie %s', (name) => {
  const response = proxy(new NextRequest('http://localhost/inspections', { headers: { cookie: `${name}=test` } }));
  expect(response.headers.get('x-middleware-next')).toBe('1');
});

it('não aceita o cookie antigo como sessão', () => {
  const response = proxy(new NextRequest('http://localhost/inspections', { headers: { cookie: 'fieldops_auth=legacy' } }));
  expect(response.status).toBe(307);
});

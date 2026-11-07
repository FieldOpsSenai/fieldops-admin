import { NextRequest } from 'next/server';
import { ACCESS_COOKIE, apiBaseUrl, isSameOrigin } from '@/lib/auth/serverSession';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyToApi(
  request: NextRequest,
  { params }: RouteContext
) {
  const { path } = await params;
  if (!['GET', 'HEAD'].includes(request.method) && !isSameOrigin(request)) {
    return Response.json({ message: 'Origem não permitida.' }, { status: 403 });
  }
  if (path[0] === 'auth') return Response.json({ message: 'Use a sessão da interface web.' }, { status: 404 });
  const endpoint = path.map(encodeURIComponent).join('/');
  const targetUrl = `${apiBaseUrl}/${endpoint}${request.nextUrl.search}`;
  const headers = new Headers();

  for (const name of ['accept', 'content-type']) {
    const value = request.headers.get(name);

    if (value) {
      headers.set(name, value);
    }
  }

  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return Response.json({ message: 'Sessão expirada.' }, { status: 401 });
  headers.set('Authorization', `Bearer ${token}`);

  try {
    const apiResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body:
        request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : await request.arrayBuffer(),
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });
    const responseHeaders = new Headers();

    for (const name of ['content-type', 'content-disposition', 'cache-control']) {
      const value = apiResponse.headers.get(name);

      if (value) {
        responseHeaders.set(name, value);
      }
    }

    return new Response(apiResponse.body, {
      status: apiResponse.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { message: 'Não foi possível conectar à API FieldOps.' },
      { status: 502 }
    );
  }
}

export const GET = proxyToApi;
export const POST = proxyToApi;
export const PUT = proxyToApi;
export const PATCH = proxyToApi;
export const DELETE = proxyToApi;

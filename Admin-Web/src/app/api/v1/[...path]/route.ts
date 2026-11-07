import { NextRequest } from 'next/server';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const apiBaseUrl = (
  process.env.FIELDOPS_API_INTERNAL_URL ??
  'http://localhost:8080/api/v1'
).replace(/\/+$/, '');

async function proxyToApi(
  request: NextRequest,
  { params }: RouteContext
) {
  const { path } = await params;
  const endpoint = path.map(encodeURIComponent).join('/');
  const targetUrl = `${apiBaseUrl}/${endpoint}${request.nextUrl.search}`;
  const headers = new Headers();

  for (const name of ['accept', 'authorization', 'content-type']) {
    const value = request.headers.get(name);

    if (value) {
      headers.set(name, value);
    }
  }

  try {
    const apiResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body:
        request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : await request.arrayBuffer(),
      cache: 'no-store',
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

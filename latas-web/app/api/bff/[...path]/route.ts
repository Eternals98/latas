import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8000';

/** Lee la cookie HTTP-only server-side y reenvía la petición a FastAPI con Bearer token. */
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ detail: 'No autenticado' }, { status: 401 });
  }

  // /api/bff/cash/today → http://backend/api/cash/today
  const backendPath = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const backendUrl = `${BACKEND_URL}/api/${backendPath}${searchParams ? `?${searchParams}` : ''}`;

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'DELETE') {
    body = await request.text();
  }

  try {
    const res = await fetch(backendUrl, {
      method: request.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...(body !== undefined ? { body } : {}),
    });

    const contentType = res.headers.get('content-type') ?? '';

    // Archivos binarios (Excel, PDF) → pasar directo sin parsear JSON
    if (
      contentType.includes('application/vnd') ||
      contentType.includes('application/pdf') ||
      contentType.includes('octet-stream')
    ) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        status: res.status,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': res.headers.get('Content-Disposition') ?? '',
        },
      });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });

  } catch (err) {
    console.error('[BFF proxy error]', backendPath, err);
    return NextResponse.json(
      { detail: 'Error de conexión con el backend' },
      { status: 502 },
    );
  }
}

export const GET    = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => proxy(req, ctx);
export const POST   = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => proxy(req, ctx);
export const PUT    = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => proxy(req, ctx);
export const PATCH  = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => proxy(req, ctx);
export const DELETE = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => proxy(req, ctx);

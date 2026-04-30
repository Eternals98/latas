import { NextRequest, NextResponse } from "next/server";
import { decodeSessionUser, SESSION } from "../../../../lib/session";

function getBackendUrl(): string {
  const base = process.env.BACKEND_API_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("BACKEND_API_URL is required");
  }
  return base;
}

function buildHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  return headers;
}

async function proxy(request: NextRequest, method: string, path: string[]): Promise<Response> {
  if (isVentasWrite(method, path)) {
    const session = decodeSessionUser(request.cookies.get(SESSION.cookieName)?.value);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ detail: "No autorizado para editar o eliminar transacciones." }, { status: 403 });
    }
  }

  const search = request.nextUrl.search;
  const target = `${getBackendUrl()}/${path.join("/")}${search}`;
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const upstream = await fetch(target, {
    method,
    headers: buildHeaders(request),
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

function isVentasWrite(method: string, path: string[]): boolean {
  if (method !== "PUT" && method !== "DELETE") {
    return false;
  }
  if (path.length < 3) {
    return false;
  }
  return path[0] === "api" && path[1] === "ventas" && /^\d+$/.test(path[2]);
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, "GET", path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, "POST", path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, "PUT", path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, "DELETE", path);
}

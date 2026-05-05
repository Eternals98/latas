import { backendFetch } from "../../../../../lib/backend";
import { requireCsrf } from "../../../../../lib/csrf";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const response = await backendFetch(`/api/sales/${id}`);
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!requireCsrf(request)) {
    return NextResponse.json({ detail: "CSRF inválido." }, { status: 403 });
  }
  const { id } = await context.params;
  const payload = await request.text();
  const response = await backendFetch(`/api/sales/${id}`, {
    method: "PUT",
    body: payload,
  });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!requireCsrf(request)) {
    return NextResponse.json({ detail: "CSRF inválido." }, { status: 403 });
  }
  const { id } = await context.params;
  const payload = await request.text();
  const response = await backendFetch(`/api/sales/${id}`, {
    method: "DELETE",
    body: payload,
  });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

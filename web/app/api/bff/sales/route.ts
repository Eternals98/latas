import { backendFetch } from "../../../../lib/backend";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const response = await backendFetch(`/api/sales${search}`);
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  const payload = await request.text();
  const response = await backendFetch("/api/sales", {
    method: "POST",
    body: payload,
  });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

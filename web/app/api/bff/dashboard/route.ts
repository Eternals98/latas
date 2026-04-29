import { backendFetch } from "../../../../lib/backend";
import { NextResponse } from "next/server";

export async function GET() {
  const response = await backendFetch("/api/dashboard");
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" }
  });
}

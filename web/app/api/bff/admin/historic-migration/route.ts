import { backendFetch } from "../../../../../lib/backend";
import { requireCsrf } from "../../../../../lib/csrf";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!requireCsrf(request)) {
    return NextResponse.json({ detail: "CSRF inválido." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const month = formData.get("month");
  if (!(file instanceof File)) {
    return NextResponse.json({ detail: "Debes seleccionar un archivo Excel." }, { status: 400 });
  }

  const payload = new FormData();
  payload.append("file", file, file.name);
  if (typeof month === "string" && month) {
    payload.append("month", month);
  }

  const response = await backendFetch("/api/admin/historic-migration", {
    method: "POST",
    body: payload,
    headers: {},
  });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

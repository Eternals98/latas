import { Resend } from "resend";
import { backendFetch } from "../../../../lib/backend";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const dashboardResponse = await backendFetch("/api/dashboard");
  if (!dashboardResponse.ok) {
    return NextResponse.json({ detail: "Dashboard fetch failed" }, { status: 502 });
  }

  const dashboard = await dashboardResponse.json();
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.REPORT_EMAIL_FROM || "reports@example.com",
    to: process.env.REPORT_EMAIL_TO || "owner@example.com",
    subject: "Reporte diario LATAS",
    text: `Reporte diario\n\n${JSON.stringify(dashboard, null, 2)}`
  });

  return NextResponse.json({ ok: true });
}

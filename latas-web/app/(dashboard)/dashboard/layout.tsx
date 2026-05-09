import { requireRole } from "@/lib/get-session";

export default async function DashboardLayout({ children }) {
  await requireRole(["admin"]); // Solo admin

  return <>{children}</>;
}
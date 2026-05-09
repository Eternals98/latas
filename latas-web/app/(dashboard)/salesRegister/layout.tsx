import { requireRole } from "@/lib/get-session";

export default async function SalesLayout({ children }) {
  await requireRole(["admin", "cashier"]); // Ambos

  return <>{children}</>;
}
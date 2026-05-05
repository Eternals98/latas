import { requireAdminSession } from "../../lib/session";
import DashboardClientPage from "./DashboardClientPage";

export default async function DashboardRoutePage() {
  await requireAdminSession();
  return <DashboardClientPage />;
}

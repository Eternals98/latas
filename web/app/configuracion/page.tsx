import { requireAdminSession } from "../../lib/session";
import ConfigurationClientPage from "./ConfigurationClientPage";

export default async function ConfigurationPage() {
  await requireAdminSession();
  return <ConfigurationClientPage />;
}


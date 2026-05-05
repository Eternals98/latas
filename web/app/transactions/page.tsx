import { requireAdminSession } from "../../lib/session";
import TransactionsClientPage from "./TransactionsClientPage";

export default async function TransactionsPage() {
  await requireAdminSession();
  return <TransactionsClientPage />;
}

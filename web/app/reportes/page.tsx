import { requireAdminSession } from '../../lib/session';
import ReportesClientPage from './ReportesClientPage';

export default async function ReportesPage() {
  await requireAdminSession();
  return <ReportesClientPage />;
}

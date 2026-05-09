import { Metadata } from "next";
import { requireAuth } from "@/lib/get-session";
import { DashboardScreen } from "@/components/DashboardScreen";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Mock data (después conecta con tu API)
const mockMetrics = {
  totalSales: 1250,
  totalRevenue: 45000,
  averageTicket: 36,
  salesCount: 342,
  chartData: [
    { date: "01/01", sales: 120, revenue: 4200 },
    { date: "02/01", sales: 150, revenue: 5100 },
    { date: "03/01", sales: 130, revenue: 4800 },
    { date: "04/01", sales: 180, revenue: 6200 },
    { date: "05/01", sales: 160, revenue: 5500 },
  ],
};

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <DashboardScreen
      metrics={mockMetrics}
      loading={false}
    />
  );
}
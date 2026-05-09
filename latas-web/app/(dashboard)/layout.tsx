import { ReactNode } from 'react';
import { Metadata } from 'next';
import { getSession } from '@/lib/get-session';
import { redirect } from 'next/navigation';
import { AppShell } from './AppShell';

export const metadata: Metadata = {
  title: 'Axentria — Panel de control',
  description: 'Panel de administración y gestión',
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <AppShell role={session.role}>{children}</AppShell>;
}
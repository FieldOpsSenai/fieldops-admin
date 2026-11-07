import React from 'react';

import Sidebar from '@/components/layout/Sidebar';
import AdminWebGuard from '@/components/auth/AdminWebGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminWebGuard>
      <div className="flex min-h-screen bg-[var(--background)] md:h-screen md:overflow-hidden">
        <Sidebar />

        <div className="min-w-0 flex-1 flex flex-col md:h-screen md:overflow-hidden">
          <main className="min-w-0 flex-1 md:overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminWebGuard>
  );
}
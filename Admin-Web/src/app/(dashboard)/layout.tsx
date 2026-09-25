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
      <div className="flex h-screen overflow-hidden bg-[var(--background)]">
        <div className="flex-shrink-0">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminWebGuard>
  );
}
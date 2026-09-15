import React from 'react';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header would be included in the individual pages to allow custom titles/context, 
            or we can include it here and use a context/store to update the title. 
            For simplicity and flexibility, we will include the TopHeader inside each page 
            or a wrapper component if needed. But let's actually just render the children here
            and let each page render its own TopHeader so they can customize it. */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

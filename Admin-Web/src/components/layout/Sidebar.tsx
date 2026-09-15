'use client';

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  FileText, 
  BarChart, 
  Settings, 
  HelpCircle,
  MapPin
} from 'lucide-react';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inspections', href: '/inspections', icon: CheckSquare },
  { name: 'Scheduling', href: '/scheduling', icon: Calendar },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Reports', href: '/reports', icon: BarChart },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-[#526379] flex flex-col h-screen text-slate-300">
      
      {/* Brand */}
      <div className="h-16 flex items-center px-6 gap-3 bg-[#445569] text-white">
        <div className="bg-[#10b981] p-1.5 rounded text-white">
          <MapPin size={20} strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-bold text-lg leading-tight tracking-wide">FieldOps</div>
          <div className="text-[0.65rem] text-slate-300 tracking-wider font-semibold uppercase">Technical Inspection</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
                isActive 
                  ? "bg-[#445569] text-white border-l-4 border-[#10b981]" 
                  : "hover:bg-[#445569] hover:text-white border-l-4 border-transparent"
              )}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-[#64748b] space-y-1">
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[#445569] hover:text-white transition-colors text-sm font-medium">
          <Settings size={18} />
          Settings
        </Link>
        <Link href="/support" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[#445569] hover:text-white transition-colors text-sm font-medium">
          <HelpCircle size={18} />
          Support
        </Link>
      </div>

    </div>
  );
}

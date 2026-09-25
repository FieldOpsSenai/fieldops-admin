'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  ClipboardCheck,
  CalendarDays,
  FileText,
  Users,
  Building2,
  MapPin,
  Wrench,
  HelpCircle,
  MapPinned,
} from 'lucide-react';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';

import { useSessionStore } from '@/stores/sessionStore';
import {
  normalizeRole,
  type AppRole,
} from '@/lib/auth/permissions';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: AppRole[];
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'SUPERVISOR'],
  },
  {
    name: 'Usuários',
    href: '/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    name: 'Clientes',
    href: '/clients',
    icon: Building2,
    roles: ['ADMIN', 'SUPERVISOR'],
  },
  {
    name: 'Locais',
    href: '/sites',
    icon: MapPin,
    roles: ['ADMIN', 'SUPERVISOR'],
  },
  {
    name: 'Equipamentos',
    href: '/equipment',
    icon: Wrench,
    roles: ['ADMIN', 'SUPERVISOR'],
  },
  {
    name: 'Modelos de inspeção',
    href: '/inspection-templates',
    icon: FileText,
    roles: ['ADMIN', 'SUPERVISOR'],
  },
  {
    name: 'Inspeções',
    href: '/inspections',
    icon: ClipboardCheck,
    roles: ['ADMIN', 'SUPERVISOR'],
  },
  {
    name: 'Planejamento',
    href: '/inspections/new',
    icon: CalendarDays,
    roles: ['SUPERVISOR'],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { session } = useSessionStore();

  const role = normalizeRole(session?.profile);

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(role)
  );

  return (
    <aside className="w-64 bg-[#526379] flex flex-col h-screen text-slate-300">
      <div className="h-16 flex items-center px-6 gap-3 bg-[#445569] text-white">
        <div className="bg-[#10b981] p-1.5 rounded text-white">
          <MapPinned size={20} strokeWidth={2.5} />
        </div>

        <div>
          <div className="font-bold text-lg leading-tight tracking-wide">
            FieldOps
          </div>

          <div className="text-[0.65rem] text-slate-300 tracking-wider font-semibold uppercase">
            Technical Inspection
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-md',
                'transition-colors text-sm font-medium border-l-4',
                isActive
                  ? 'bg-[#445569] text-white border-[#10b981]'
                  : 'hover:bg-[#445569] hover:text-white border-transparent'
              )}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#64748b]">
        <Link
          href="/support"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[#445569] hover:text-white transition-colors text-sm font-medium"
        >
          <HelpCircle size={18} />
          Suporte
        </Link>
      </div>
    </aside>
  );
}
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  MapPinned,
  Menu,
  Users,
  Wrench,
  X,
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
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'SUPERVISOR'],
  },
  {
    name: 'Usuários',
    href: '/users',
    icon: Users,
    roles: ['ADMIN', 'SUPERVISOR'],
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
    roles: ['ADMIN', 'SUPERVISOR'],
  },
];

function isNavItemActive(
  pathname: string,
  href: string
) {
if (href === '/inspections/new') {
    return pathname === '/inspections/new';
  }

  if (href === '/inspections') {
    return (
      pathname === '/inspections' ||
      (
        pathname.startsWith('/inspections/') &&
        pathname !== '/inspections/new'
      )
    );
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  const session = useSessionStore(
    (state) => state.session
  );

  const [isMobileOpen, setIsMobileOpen] =
    useState(false);

  const role = normalizeRole(
    session?.profile
  );

  const visibleItems =
    navItems.filter((item) =>
      item.roles.includes(role)
    );

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() =>
          setIsMobileOpen(
            (current) => !current
          )
        }
        className="fixed left-4 top-4 z-[60] flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 md:hidden"
        aria-label={
          isMobileOpen
            ? 'Fechar menu'
            : 'Abrir menu'
        }
        aria-expanded={isMobileOpen}
        aria-controls="fieldops-sidebar"
      >
        {isMobileOpen ? (
          <X size={19} />
        ) : (
          <Menu size={19} />
        )}
      </button>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu lateral"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-950/50 md:hidden"
        />
      )}

      <aside
        id="fieldops-sidebar"
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-[#526379] text-slate-300',
          'transition-transform duration-200 ease-out',
          'md:static md:z-auto md:translate-x-0 md:shrink-0',
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="h-16 flex shrink-0 items-center gap-3 bg-[#445569] px-6 text-white">
          <div className="rounded bg-[#10b981] p-1.5 text-white">
            <MapPinned
              size={20}
              strokeWidth={2.5}
            />
          </div>

          <div>
            <div className="text-lg font-bold leading-tight tracking-wide">
              FieldOps
            </div>

            <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-300">
              Technical Inspection
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            const active =
              isNavItemActive(
                pathname,
                item.href
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                aria-current={
                  active
                    ? 'page'
                    : undefined
                }
                className={clsx(
                  'flex items-center gap-3 rounded-md border-l-4 px-3 py-2.5',
                  'text-sm font-medium transition-colors',
                  active
                    ? 'border-[#10b981] bg-[#445569] text-white'
                    : 'border-transparent hover:bg-[#445569] hover:text-white'
                )}
              >
                <Icon
                  size={18}
                  className="shrink-0"
                />

                <span>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#64748b] p-3">
          <Link
            href="/support"
            onClick={closeMobileMenu}
            className={clsx(
              'flex items-center gap-3 rounded-md border-l-4 px-3 py-2.5',
              'text-sm font-medium transition-colors',
              pathname === '/support'
                ? 'border-[#10b981] bg-[#445569] text-white'
                : 'border-transparent hover:bg-[#445569] hover:text-white'
            )}
          >
            <HelpCircle
              size={18}
              className="shrink-0"
            />

            Suporte
          </Link>
        </div>
      </aside>
    </>
  );
}
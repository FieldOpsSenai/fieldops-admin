'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useSessionStore } from '@/stores/sessionStore';
import { canAccessAdminWeb } from '@/lib/auth/permissions';

export default function AdminWebGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const {
    session,
    initializeFromStorage,
  } = useSessionStore();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeFromStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);
  }, [initializeFromStorage]);

  useEffect(() => {
    if (!isReady) return;

    if (!session) {
      router.replace('/login');
      return;
    }

    if (!canAccessAdminWeb(session.profile)) {
      router.replace('/forbidden');
    }
  }, [isReady, router, session]);

  if (
    !isReady ||
    !session ||
    !canAccessAdminWeb(session.profile)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Loader2
            size={20}
            className="animate-spin text-[#0f766e]"
          />

          Validando acesso...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
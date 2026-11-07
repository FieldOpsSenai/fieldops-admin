'use client';

import React, {
  useEffect,
} from 'react';

import {
  Loader2,
} from 'lucide-react';

import {
  useRouter,
} from 'next/navigation';

import {
  useSessionStore,
} from '@/stores/sessionStore';

import {
  canAccessAdminWeb,
} from '@/lib/auth/permissions';

export default function AdminWebGuard({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const router =
    useRouter();

  const session =
    useSessionStore(
      (state) =>
        state.session
    );

  const isInitialized =
    useSessionStore(
      (state) =>
        state.isInitialized
    );

  const initializeFromStorage =
    useSessionStore(
      (state) =>
        state.initializeFromStorage
    );

  useEffect(() => {
    if (
      !isInitialized
    ) {
      initializeFromStorage();
    }
  }, [
    initializeFromStorage,
    isInitialized,
  ]);

  useEffect(() => {
    if (
      !isInitialized
    ) {
      return;
    }

    if (!session) {
      router.replace(
        '/login'
      );

      return;
    }

    if (
      !canAccessAdminWeb(
        session.profile
      )
    ) {
      router.replace(
        '/forbidden'
      );
    }
  }, [
    isInitialized,
    router,
    session,
  ]);

  if (
    !isInitialized ||
    !session ||
    !canAccessAdminWeb(
      session.profile
    )
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

  return (
    <>
      {children}
    </>
  );
}
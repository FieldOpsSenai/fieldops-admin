'use client';

import React, {
  useEffect,
  useState,
} from 'react';

import {
  Activity,
  LogOut,
  Shield,
} from 'lucide-react';

import {
  useSessionStore,
} from '@/stores/sessionStore';

import {
  authService,
} from '@/lib/api/services';

export default function TopHeader({
  title,
  context,
}: {
  title: string;
  context?: React.ReactNode;
}) {
  const session =
    useSessionStore(
      (state) =>
        state.session
    );

  const [
    isApiOnline,
    setIsApiOnline,
  ] =
    useState<
      boolean | null
    >(null);

  const [
    showUserMenu,
    setShowUserMenu,
  ] =
    useState(false);

  useEffect(() => {
    let active = true;

    const checkApi =
      async () => {
        try {
          /*
           * Usamos axios diretamente,
           * e não apiClient.
           *
           * Assim um 401/403 neste
           * teste de conectividade
           * não ativa os redirects
           * globais do interceptor.
           *
           * Qualquer resposta HTTP
           * significa que a API está
           * acessível.
           */
          const response = await fetch('/api/session', {
            cache: 'no-store',
            signal: AbortSignal.timeout(5000),
          });

          if (response.status >= 500) {
            throw new Error('A API respondeu com erro interno.');
          }

          if (active) {
            setIsApiOnline(
              true
            );
          }
        } catch (
          error: unknown
        ) {
          if (active) {
            setIsApiOnline(
              false
            );
          }

          if (
            process.env
              .NODE_ENV ===
            'development'
          ) {
            console.debug(
              'API indisponível durante verificação de conectividade.',
              error
            );
          }
        }
      };

    void checkApi();

    const intervalId =
      window.setInterval(
        () => {
          void checkApi();
        },
        30_000
      );

    return () => {
      active = false;

      window.clearInterval(
        intervalId
      );
    };
  }, []);

  const userName =
    session?.name ||
    'Usuário';

  const userEmail =
    session?.email ||
    '';

  const userProfile =
    session?.profile ||
    '—';

  const initials =
    userName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(
        (part) =>
          part[0]
      )
      .slice(0, 2)
      .join('')
      .toUpperCase() ||
    'FO';

  return (
<header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between gap-4 pl-16 pr-4 sm:pr-6 md:px-6 sticky top-0 z-20">      {/* LEFT */}
      <div className="min-w-0 flex-1">
        {context ? (
          <div className="min-w-0">
            {context}
          </div>
        ) : (
          <span className="block font-bold text-slate-800 text-base sm:text-lg truncate">
            {title}
          </span>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* API STATUS */}
        <div
          className="hidden sm:flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-full border border-slate-200 bg-slate-50"
          title={
            isApiOnline ===
            true
              ? 'A API FieldOps está respondendo.'
              : isApiOnline ===
                  false
                ? 'Não foi possível acessar a API FieldOps.'
                : 'Verificando conectividade com a API.'
          }
        >
          <Activity
            size={13}
            className={
              isApiOnline ===
              true
                ? 'text-emerald-600'
                : isApiOnline ===
                    false
                  ? 'text-red-600'
                  : 'text-amber-500'
            }
          />

          <span
            className={
              isApiOnline ===
              true
                ? 'text-emerald-700'
                : isApiOnline ===
                    false
                  ? 'text-red-700'
                  : 'text-slate-600'
            }
          >
            {isApiOnline ===
            true
              ? 'API Online'
              : isApiOnline ===
                  false
                ? 'API Offline'
                : 'Verificando API'}
          </span>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* USER */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setShowUserMenu(
                (current) =>
                  !current
              )
            }
            className="flex items-center gap-2.5 hover:bg-slate-50 p-1.5 rounded-lg border border-transparent hover:border-slate-200 transition-colors"
            aria-expanded={
              showUserMenu
            }
            aria-haspopup="menu"
          >
            <div className="w-8 h-8 rounded-full bg-[#0f766e] flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {initials}
            </div>

            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-slate-800 leading-tight max-w-40 truncate">
                {userName}
              </div>

              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <Shield
                  size={10}
                  className="text-[#0f766e]"
                />

                {userProfile}
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30"
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="font-bold text-sm text-slate-800 truncate">
                  {userName}
                </div>

                {userEmail && (
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {userEmail}
                  </div>
                )}

                <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-1 bg-teal-50 text-[#0f766e] rounded-md">
                  <Shield
                    size={10}
                  />

                  {userProfile}
                </span>
              </div>

              <div className="p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowUserMenu(
                      false
                    );

                    authService.logout();
                  }}
                  className="w-full px-3 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <LogOut
                    size={14}
                  />

                  Sair do sistema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

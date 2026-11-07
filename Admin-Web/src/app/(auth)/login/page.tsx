'use client';

import React, {
  Suspense,
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  MapPin,
} from 'lucide-react';

import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import {
  authService,
} from '@/lib/api/services';

import {
  useSessionStore,
} from '@/stores/sessionStore';

function getSafeRedirect(
  value: string | null
) {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//')
  ) {
    return '/';
  }

  return value;
}

function LoginContent() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

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

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string | null
    >(null);

  const sessionExpired =
    searchParams.get(
      'expired'
    ) === 'true';

  const redirectTo =
    getSafeRedirect(
      searchParams.get(
        'redirect'
      )
    );

  useEffect(() => {
    if (!isInitialized) {
      initializeFromStorage();
    }
  }, [
    initializeFromStorage,
    isInitialized,
  ]);

  useEffect(() => {
    if (
      isInitialized &&
      session
    ) {
      router.replace(
        redirectTo
      );
    }
  }, [
    isInitialized,
    redirectTo,
    router,
    session,
  ]);

  const handleLogin =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      const normalizedEmail =
        email.trim();

      if (
        !normalizedEmail ||
        !password
      ) {
        setErrorMessage(
          'Informe o e-mail e a senha.'
        );

        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        await authService.login(
          {
            email:
              normalizedEmail,

            senha:
              password,
          }
        );

        router.replace(
          redirectTo
        );
      } catch (
        error: unknown
      ) {
        console.error(
          'Falha no login:',
          error
        );

        if (
          axios.isAxiosError(
            error
          )
        ) {
          const status =
            error.response
              ?.status;

          if (
            status === 401 ||
            status === 403
          ) {
            setErrorMessage(
              'Credenciais inválidas. Verifique o e-mail e a senha.'
            );

            return;
          }

          if (
            !error.response
          ) {
            setErrorMessage(
              'Não foi possível conectar à API FieldOps. Verifique sua conexão e tente novamente.'
            );

            return;
          }

          if (
            status &&
            status >= 500
          ) {
            setErrorMessage(
              `A API retornou erro interno (${status}). Verifique os logs da API e a conexão com o banco de dados.`
            );

            return;
          }
        }

        setErrorMessage(
          'Não foi possível realizar o login. Tente novamente.'
        );
      } finally {
        setIsLoading(false);
      }
    };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-300">
          <Loader2
            size={20}
            className="animate-spin text-emerald-400"
          />

          Carregando sessão...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none"
      />

      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="bg-[#10b981] p-2 rounded-xl text-white shadow-lg">
          <MapPin
            size={32}
            strokeWidth={2.5}
          />
        </div>

        <div>
          <div className="text-3xl font-black tracking-tight text-white">
            FieldOps
          </div>

          <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest">
            Technical Inspection
          </div>
        </div>
      </div>

      <section className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 relative z-10">
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Acesso ao Sistema
          </h1>

          <p className="text-slate-500 text-xs mt-1">
            Entre com suas
            credenciais do FieldOps.
          </p>
        </header>

        {sessionExpired && (
          <div
            role="status"
            aria-live="polite"
            className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800"
          >
            <AlertCircle
              size={16}
              className="text-amber-600 shrink-0 mt-0.5"
            />

            <span>
              Sua sessão expirou
              ou foi invalidada.
              Faça login novamente.
            </span>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700"
          >
            <AlertCircle
              size={16}
              className="text-red-600 shrink-0 mt-0.5"
            />

            <span>
              {errorMessage}
            </span>
          </div>
        )}

        <form
          onSubmit={
            handleLogin
          }
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-bold text-slate-600 uppercase tracking-wider"
            >
              E-mail
            </label>

            <div className="relative">
              <Mail
                size={18}
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target
                      .value
                  )
                }
                required
                disabled={
                  isLoading
                }
                placeholder="usuario@empresa.com"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] bg-slate-50/50 focus:bg-white disabled:opacity-60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-bold text-slate-600 uppercase tracking-wider"
            >
              Senha
            </label>

            <div className="relative">
              <Lock
                size={18}
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(
                  event
                ) =>
                  setPassword(
                    event.target
                      .value
                  )
                }
                required
                disabled={
                  isLoading
                }
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] bg-slate-50/50 focus:bg-white disabled:opacity-60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg shadow-sm text-sm font-bold text-white bg-[#0f766e] hover:bg-[#115e59] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#10b981] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Autenticando...
              </>
            ) : (
              <>
                Acessar plataforma

                <ArrowRight
                  size={16}
                />
              </>
            )}
          </button>
        </form>
      </section>

      <footer className="mt-8 text-center text-xs text-slate-400 relative z-10">
        FieldOps • Plataforma de
        Inspeções Técnicas
      </footer>
    </main>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <Loader2
        size={24}
        className="animate-spin text-emerald-400"
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <LoginFallback />
      }
    >
      <LoginContent />
    </Suspense>
  );
}

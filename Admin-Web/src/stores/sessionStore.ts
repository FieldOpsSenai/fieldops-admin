import { create } from 'zustand';

import type { Session } from '@/types';

interface SessionState {
  session: Session | null;
  token: string | null;
  isPending: boolean;
  isInitialized: boolean;

  setSession: (
    session: Session,
    token?: string
  ) => void;

  clearSession: () => void;

  setPending: (
    pending: boolean
  ) => void;

  initializeFromStorage: () => void;
}

const STORAGE_KEY_TOKEN =
  'fieldops_token';

const STORAGE_KEY_USER =
  'fieldops_user';

const AUTH_COOKIE =
  'fieldops_auth';

function setAuthCookie(
  token: string
) {
  if (
    typeof document ===
    'undefined'
  ) {
    return;
  }

  document.cookie =
    `${AUTH_COOKIE}=${token}; ` +
    'path=/; SameSite=Lax';
}

function clearAuthCookie() {
  if (
    typeof document ===
    'undefined'
  ) {
    return;
  }

  document.cookie =
    `${AUTH_COOKIE}=; ` +
    'path=/; max-age=0; SameSite=Lax';
}

function clearStoredSession() {
  if (
    typeof window ===
    'undefined'
  ) {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY_TOKEN
  );

  localStorage.removeItem(
    STORAGE_KEY_USER
  );

  clearAuthCookie();
}

export const useSessionStore =
  create<SessionState>(
    (set) => ({
      session: null,
      token: null,
      isPending: false,
      isInitialized: false,

      setSession: (
        session,
        token
      ) => {
        if (
          typeof window !==
          'undefined'
        ) {
          if (token) {
            localStorage.setItem(
              STORAGE_KEY_TOKEN,
              token
            );

            setAuthCookie(
              token
            );
          }

          localStorage.setItem(
            STORAGE_KEY_USER,
            JSON.stringify(
              session
            )
          );
        }

        set({
          session,
          token:
            token ?? null,
          isInitialized: true,
        });
      },

      clearSession: () => {
        clearStoredSession();

        set({
          session: null,
          token: null,
          isInitialized: true,
        });
      },

      setPending: (
        pending
      ) => {
        set({
          isPending:
            pending,
        });
      },

      initializeFromStorage:
        () => {
          if (
            typeof window ===
            'undefined'
          ) {
            return;
          }

          try {
            const token =
              localStorage.getItem(
                STORAGE_KEY_TOKEN
              );

            const userJson =
              localStorage.getItem(
                STORAGE_KEY_USER
              );

            if (
              token &&
              userJson
            ) {
              const user =
                JSON.parse(
                  userJson
                ) as Session;

              setAuthCookie(
                token
              );

              set({
                session: user,
                token,
                isInitialized:
                  true,
              });

              return;
            }

            clearStoredSession();

            set({
              session: null,
              token: null,
              isInitialized:
                true,
            });
          } catch (
            error: unknown
          ) {
            console.error(
              'Falha ao restaurar sessão.',
              error
            );

            clearStoredSession();

            set({
              session: null,
              token: null,
              isInitialized:
                true,
            });
          }
        },
    })
  );
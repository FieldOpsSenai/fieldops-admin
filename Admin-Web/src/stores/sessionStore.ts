import { create } from "zustand";
import type { Session, Profile } from "@/types";

interface SessionState {
  session: Session | null;
  token: string | null;
  isPending: boolean;
  setSession: (session: Session, token?: string) => void;
  clearSession: () => void;
  setPending: (pending: boolean) => void;
  initializeFromStorage: () => void;
}

const STORAGE_KEY_TOKEN = "fieldops_token";
const STORAGE_KEY_USER = "fieldops_user";
// Cookie name read by Next.js middleware for route protection
const AUTH_COOKIE = "fieldops_auth";

/** Sets a browser cookie accessible to the Next.js edge middleware. */
function setAuthCookie(token: string) {
  if (typeof document !== "undefined") {
    // SameSite=Lax is safe and works with same-origin redirects
    document.cookie = `${AUTH_COOKIE}=${token}; path=/; SameSite=Lax`;
  }
}

/** Removes the auth cookie so the middleware redirects to /login. */
function clearAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  token: null,
  isPending: false,

  setSession: (session: Session, token?: string) => {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem(STORAGE_KEY_TOKEN, token);
        setAuthCookie(token);
      }
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(session));
    }
    set({ session, token: token || null });
  },

  clearSession: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
      clearAuthCookie();
    }
    set({ session: null, token: null });
  },

  setPending: (pending: boolean) => {
    set({ isPending: pending });
  },

  initializeFromStorage: () => {
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem(STORAGE_KEY_TOKEN);
        const userJson = localStorage.getItem(STORAGE_KEY_USER);
        if (token && userJson) {
          const user = JSON.parse(userJson) as Session;
          // Re-sync cookie in case it was lost (e.g. browser cleared cookies)
          setAuthCookie(token);
          set({ session: user, token });
        }
      } catch (err) {
        console.error("Failed to restore session from localStorage", err);
      }
    }
  },
}));

// Initialize immediately if in browser
if (typeof window !== "undefined") {
  useSessionStore.getState().initializeFromStorage();
}

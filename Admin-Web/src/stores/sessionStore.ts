import { create } from 'zustand';
import type { Session } from '@/types';

interface SessionState {
  session: Session | null;
  isPending: boolean;
  isInitialized: boolean;
  setSession: (session: Session) => void;
  clearSession: () => void;
  setPending: (pending: boolean) => void;
  initializeFromStorage: () => Promise<void>;
}

function clearLegacyStorage() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('fieldops_token');
  localStorage.removeItem('fieldops_user');
}

let initialization: Promise<void> | null = null;
let generation = 0;
export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  isPending: false,
  isInitialized: false,
  setSession: (session) => {
    generation++;
    clearLegacyStorage();
    set({ session, isInitialized: true });
  },
  clearSession: () => {
    generation++;
    clearLegacyStorage();
    set({ session: null, isInitialized: true });
  },
  setPending: (isPending) => set({ isPending }),
  initializeFromStorage: async () => {
    if (initialization) return initialization;
    clearLegacyStorage();
    const currentGeneration = generation;
    initialization = (async () => {
      try {
        const response = await fetch('/api/session', { cache: 'no-store' });
        const data = response.ok ? await response.json() : null;
        if (generation === currentGeneration) set({ session: data?.session ?? null, isInitialized: true });
      } catch {
        if (generation === currentGeneration) set({ session: null, isInitialized: true });
      } finally { initialization = null; }
    })();
    return initialization;
  },
}));

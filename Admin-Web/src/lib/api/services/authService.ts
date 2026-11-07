import axios from 'axios';
import { useSessionStore } from '@/stores/sessionStore';
import type { Session } from '@/types';
import { cancelSessionRefresh } from '@/lib/auth/refreshSession';

export interface LoginRequest { email: string; senha: string }

export const authService = {
  async login(credentials: LoginRequest): Promise<Session> {
    const response = await axios.post<{ session: Session }>('/api/session', {
      email: credentials.email.trim(),
      password: credentials.senha,
    });
    useSessionStore.getState().setSession(response.data.session);
    return response.data.session;
  },
  async getMe(): Promise<Session> {
    const response = await axios.get<{ session: Session }>('/api/session');
    return response.data.session;
  },
  async logout(): Promise<void> {
    cancelSessionRefresh();
    try { await axios.delete('/api/session'); }
    finally {
      useSessionStore.getState().clearSession();
      if (typeof window !== 'undefined') window.location.replace('/login');
    }
  },
};

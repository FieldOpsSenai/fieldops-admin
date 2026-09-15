import apiClient from '../axios';
import { useSessionStore } from '@/stores/sessionStore';
import { Profile } from '@/types';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface TokenResponse {
  token: string;
  tipo?: string;
  perfil: Profile;
  nome: string;
  email: string;
  id?: string;
  expiracao?: number;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/login', credentials);
    const data = response.data;
    
    // Save in zustand store and localStorage
    useSessionStore.getState().setSession(
      {
        userId: data.id ?? data.email, // fallback to email if API doesn't return id
        name: data.nome,
        email: data.email,
        profile: data.perfil,
      },
      data.token
    );

    return data;
  },

  async getMe(): Promise<TokenResponse> {
    const response = await apiClient.get<TokenResponse>('/auth/me');
    return response.data;
  },

  logout(): void {
    useSessionStore.getState().clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
};

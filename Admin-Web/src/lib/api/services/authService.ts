import apiClient from '../axios';
import { useSessionStore } from '@/stores/sessionStore';
import { Profile } from '@/types';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface TokenResponse {
  token: string;
  perfil: Profile;
  nome: string;
  email: string;
  id?: string;
  expiracao?: number;
}

interface ApiUserResponse {
  id: number;
  name: string;
  email: string;
  role: 'ADMINISTRATOR' | 'SUPERVISOR' | 'TECHNICIAN';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

interface ApiLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: ApiUserResponse;
}

function mapApiRole(role: ApiUserResponse['role']): Profile {
  switch (role) {
    case 'ADMINISTRATOR':
      return 'ADMINISTRADOR';
    case 'SUPERVISOR':
      return 'SUPERVISOR';
    case 'TECHNICIAN':
      return 'TECNICO';
  }
}

export const authService = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post<ApiLoginResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.senha,
    });
    const apiData = response.data;
    const data: TokenResponse = {
      token: apiData.accessToken,
      perfil: mapApiRole(apiData.user.role),
      nome: apiData.user.name,
      email: apiData.user.email,
      id: String(apiData.user.id),
      expiracao: apiData.expiresIn,
    };
    
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

  async getMe(): Promise<ApiUserResponse> {
    const response = await apiClient.get<ApiUserResponse>('/auth/me');
    return response.data;
  },

  logout(): void {
    useSessionStore.getState().clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
};

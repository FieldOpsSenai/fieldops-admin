import apiClient from '../axios';
import type { Profile } from '@/types';
import { getPageContent } from './apiPage';

export interface UsuarioDTO {
  id: number;
  nome: string;
  email: string;
  perfil: Profile;
  ativo: boolean;
}

export interface UsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  perfil: Profile;
}

export type UsuarioUpdate = Omit<UsuarioRequest, 'senha'> & { senha?: string };

interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMINISTRATOR' | 'SUPERVISOR' | 'TECHNICIAN';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

function fromApiUser(user: ApiUser): UsuarioDTO {
  return {
    id: user.id,
    nome: user.name,
    email: user.email,
    perfil: user.role === 'ADMINISTRATOR'
      ? 'ADMINISTRADOR'
      : user.role === 'SUPERVISOR'
        ? 'SUPERVISOR'
        : 'TECNICO',
    ativo: user.status === 'ACTIVE',
  };
}

function toApiRole(profile: Profile): ApiUser['role'] {
  return profile === 'ADMINISTRADOR'
    ? 'ADMINISTRATOR'
    : profile === 'SUPERVISOR'
      ? 'SUPERVISOR'
      : 'TECHNICIAN';
}

export const usuarioService = {
  async listarTodos(): Promise<UsuarioDTO[]> {
    const response = await apiClient.get<ApiUser[] | { content?: ApiUser[] }>('/users', {
      params: { size: 200 },
    });
    return getPageContent(response.data).map(fromApiUser);
  },

  async listarPorPerfil(perfil: Profile): Promise<UsuarioDTO[]> {
    const response = await apiClient.get<ApiUser[] | { content?: ApiUser[] }>('/users', {
      params: { role: toApiRole(perfil), size: 200 },
    });
    return getPageContent(response.data).map(fromApiUser);
  },

  async cadastrar(data: UsuarioRequest): Promise<UsuarioDTO> {
    const response = await apiClient.post<ApiUser>('/users', {
      name: data.nome,
      email: data.email,
      password: data.senha,
      role: toApiRole(data.perfil),
    });
    return fromApiUser(response.data);
  },

  async inativar(id: number): Promise<void> {
    await apiClient.patch<void>(`/users/${id}/status`, {
      status: 'INACTIVE',
    });
  },

  async atualizar(id: number, data: UsuarioUpdate): Promise<UsuarioDTO> {
    const response = await apiClient.put<ApiUser>(`/users/${id}`, {
      name: data.nome.trim(),
      email: data.email.trim(),
      role: toApiRole(data.perfil),
      ...(data.senha ? { password: data.senha } : {}),
    });
    return fromApiUser(response.data);
  },
};

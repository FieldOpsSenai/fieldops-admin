import apiClient from '../axios';
import type { Profile } from '@/types';
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

export const usuarioService = {
  async listarTecnicosAtivos(): Promise<UsuarioDTO[]> {
    const response = await apiClient.get<UsuarioDTO[]>('/inspecoes/tecnicos-disponiveis');
    return response.data.filter((user) => user.perfil === 'TECNICO' && user.ativo);
  },
  async listarTodos(): Promise<UsuarioDTO[]> {
    return (await apiClient.get<UsuarioDTO[]>('/usuarios')).data;
  },
  async listarPorPerfil(perfil: Profile): Promise<UsuarioDTO[]> {
    return (await apiClient.get<UsuarioDTO[]>(`/usuarios/perfil/${encodeURIComponent(perfil)}`)).data;
  },
  async cadastrar(data: UsuarioRequest): Promise<UsuarioDTO> {
    return (await apiClient.post<UsuarioDTO>('/usuarios', data)).data;
  },
  async inativar(id: number): Promise<void> {
    await apiClient.patch(`/usuarios/${id}/inativar`);
  },
  async atualizar(id: number, data: UsuarioUpdate): Promise<UsuarioDTO> {
    return (await apiClient.put<UsuarioDTO>(`/usuarios/${id}`, {
      nome: data.nome.trim(), email: data.email.trim(), perfil: data.perfil,
      ...(data.senha ? { senha: data.senha } : {}),
    })).data;
  },
};
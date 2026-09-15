import apiClient from '../axios';
import { Profile } from '@/types';

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
  senha?: string;
  perfil: Profile;
}

export const usuarioService = {
  async listarTodos(): Promise<UsuarioDTO[]> {
    const response = await apiClient.get<UsuarioDTO[]>('/usuarios');
    return response.data;
  },

  async listarPorPerfil(perfil: Profile): Promise<UsuarioDTO[]> {
    const response = await apiClient.get<UsuarioDTO[]>(`/usuarios/perfil/${perfil}`);
    return response.data;
  },

  async cadastrar(data: UsuarioRequest): Promise<UsuarioDTO> {
    const response = await apiClient.post<UsuarioDTO>('/usuarios', {
      ...data,
      senha: data.senha || '123456',
    });
    return response.data;
  },
};

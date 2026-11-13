import apiClient from '../axios';
import { collectPages, mapApiPage, type ApiPage, type CadastroQuery } from './apiPage';

export interface ClienteDTO {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  ativo: boolean;
}

export interface ClienteRequest {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
}

export const clienteService = {
  async listarPagina(query: CadastroQuery, signal?: AbortSignal): Promise<ApiPage<ClienteDTO>> {
    if (query.status === 'INACTIVE') throw new Error('A API não permite consultar clientes inativos.');
    const response = await apiClient.get<ApiPage<ClienteDTO>>('/clientes', {
      params: { page: query.page ?? 0, size: query.size ?? 10, termo: query.search || undefined, sort: 'nome,asc' }, signal,
    });
    return mapApiPage(response.data, (client) => client);
  },
  async listar(): Promise<ClienteDTO[]> {
    return collectPages((page) => this.listarPagina({ page, size: 100 }));
  },
  async buscarPorId(id: number): Promise<ClienteDTO> {
    return (await apiClient.get<ClienteDTO>(`/clientes/${id}`)).data;
  },
  async cadastrar(data: ClienteRequest): Promise<ClienteDTO> {
    return (await apiClient.post<ClienteDTO>('/clientes', data)).data;
  },
  async inativar(id: number): Promise<void> {
    await apiClient.delete(`/clientes/${id}`);
  },
  async atualizar(id: number, data: ClienteRequest): Promise<ClienteDTO> {
    return (await apiClient.put<ClienteDTO>(`/clientes/${id}`, data)).data;
  },
};
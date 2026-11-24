import apiClient from '../axios';
import { collectPages, mapApiPage, matchesSearch, paginateList, type ApiPage, type CadastroQuery } from './apiPage';

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
    const response = await apiClient.get<ApiPage<ClienteDTO> | ClienteDTO[]>('/clientes', {
      params: { page: query.page ?? 0, size: query.size ?? 10, termo: query.search || undefined, sort: 'nome,asc' }, signal,
    });
    const { data } = response;
    if (Array.isArray(data)) {
      const clients = data.filter((client) =>
        (query.status !== 'ACTIVE' || client.ativo) &&
        matchesSearch(query.search, client.nome, client.cnpj, client.email));
      return paginateList(clients.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), query);
    }
    return mapApiPage(data, (client) => client);
  },
  async listar(): Promise<ClienteDTO[]> {
    return collectPages((page) => this.listarPagina({ page, size: 100 }));
  },
  async buscarPorId(id: number, signal?: AbortSignal): Promise<ClienteDTO> {
    const endpoint = `/clientes/${id}`;
    return (await (signal ? apiClient.get<ClienteDTO>(endpoint, { signal }) : apiClient.get<ClienteDTO>(endpoint))).data;
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

import apiClient from '../axios';
import { apiSearchTerm, mapApiPage, matchesSearch, paginateList, type ApiPage, type CadastroQuery } from './apiPage';

export interface LocalDTO {
  id: number;
  nome: string;
  endereco: string;
  clienteId: number;
  clienteNome?: string;
  ativo: boolean;
}

export interface LocalRequest {
  nome: string;
  endereco: string;
  clienteId: number;
}

export const localService = {
  async listarPagina(query: CadastroQuery, signal?: AbortSignal): Promise<ApiPage<LocalDTO>> {
    if (query.status === 'INACTIVE') throw new Error('A API não permite consultar locais inativos.');
    const response = await apiClient.get<ApiPage<LocalDTO> | LocalDTO[]>('/locais', {
      params: { page: query.page ?? 0, size: query.size ?? 10, termo: apiSearchTerm(query.search), clienteId: query.clientId, sort: 'nome,asc' }, signal,
    });
    const { data } = response;
    if (Array.isArray(data)) {
      const sites = data.filter((site) =>
        (query.status !== 'ACTIVE' || site.ativo) &&
        (query.clientId === undefined || site.clienteId === query.clientId) &&
        matchesSearch(query.search, site.nome, site.endereco));
      return paginateList(sites.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), query);
    }
    return mapApiPage(data, (site) => site);
  },
  async listarTodos(): Promise<LocalDTO[]> { return (await apiClient.get<LocalDTO[]>('/locais/todos')).data; },
  async listarPorCliente(clienteId: number): Promise<LocalDTO[]> { return (await apiClient.get<LocalDTO[]>(`/locais/cliente/${clienteId}`)).data; },
  async cadastrar(data: LocalRequest): Promise<LocalDTO> { return (await apiClient.post<LocalDTO>('/locais', data)).data; },
  async atualizar(id: number, data: LocalRequest): Promise<LocalDTO> { return (await apiClient.put<LocalDTO>(`/locais/${id}`, data)).data; },
  async inativar(id: number): Promise<void> { await apiClient.delete(`/locais/${id}`); },
};

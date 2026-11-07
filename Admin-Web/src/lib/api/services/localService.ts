import apiClient from '../axios';
import { getPageContent } from './apiPage';

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

interface ApiSite {
  id: number;
  name: string;
  clientId: number;
  clientName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

function fromApiSite(site: ApiSite): LocalDTO {
  const address = [site.address, site.city, site.state, site.zipCode]
    .filter(Boolean)
    .join(', ');

  return {
    id: site.id,
    nome: site.name,
    endereco: address,
    clienteId: site.clientId,
    clienteNome: site.clientName,
    ativo: site.status === 'ACTIVE',
  };
}

export const localService = {
  async listarTodos(): Promise<LocalDTO[]> {
    const response = await apiClient.get<ApiSite[] | { content?: ApiSite[] }>('/sites', {
      params: { size: 200 },
    });
    return getPageContent(response.data).map(fromApiSite);
  },

  async listarPorCliente(clienteId: number): Promise<LocalDTO[]> {
    const response = await apiClient.get<ApiSite[] | { content?: ApiSite[] }>('/sites', {
      params: { clientId: clienteId, size: 200 },
    });
    return getPageContent(response.data).map(fromApiSite);
  },

  async cadastrar(data: LocalRequest): Promise<LocalDTO> {
    const response = await apiClient.post<ApiSite>('/sites', {
      clientId: data.clienteId,
      name: data.nome,
      address: data.endereco,
    });
    return fromApiSite(response.data);
  },
};

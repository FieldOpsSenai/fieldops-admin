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
  description?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

function fromApiSite(site: ApiSite): LocalDTO {
  return {
    id: site.id,
    nome: site.name,
    endereco: site.address ?? '',
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

  async atualizar(id: number, data: LocalRequest): Promise<LocalDTO> {
    const existing = (await apiClient.get<ApiSite>(`/sites/${id}`)).data;
    const response = await apiClient.put<ApiSite>(`/sites/${id}`, {
      clientId: data.clienteId,
      name: data.nome,
      address: data.endereco,
      description: existing.description,
      city: existing.city,
      state: existing.state,
      zipCode: existing.zipCode,
      latitude: existing.latitude,
      longitude: existing.longitude,
      contactName: existing.contactName,
      contactPhone: existing.contactPhone,
    });
    return fromApiSite(response.data);
  },

  async inativar(id: number): Promise<void> {
    await apiClient.patch(`/sites/${id}/status`, { status: 'INACTIVE' });
  },
};

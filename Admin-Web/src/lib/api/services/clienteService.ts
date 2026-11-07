import apiClient from '../axios';
import { getPageContent } from './apiPage';

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

function formatDocument(document: string): string {
  const digits = document.replace(/\D/g, '');
  if (digits.length !== 14) return document;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

interface ApiClient {
  id: number;
  name: string;
  legalName?: string;
  document: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

function fromApiClient(client: ApiClient): ClienteDTO {
  return {
    id: client.id,
    nome: client.name,
    cnpj: client.document,
    telefone: client.phone ?? '',
    email: client.email ?? '',
    ativo: client.status === 'ACTIVE',
  };
}

export const clienteService = {
  async listar(): Promise<ClienteDTO[]> {
    const response = await apiClient.get<ApiClient[] | { content?: ApiClient[] }>('/clients', {
      params: { size: 200 },
    });
    return getPageContent(response.data).map(fromApiClient);
  },

  async buscarPorId(id: number): Promise<ClienteDTO> {
    const response = await apiClient.get<ApiClient>(`/clients/${id}`);
    return fromApiClient(response.data);
  },

  async cadastrar(data: ClienteRequest): Promise<ClienteDTO> {
    const response = await apiClient.post<ApiClient>('/clients', {
      name: data.nome,
      legalName: data.nome,
      document: formatDocument(data.cnpj),
      phone: data.telefone,
      email: data.email,
    });
    return fromApiClient(response.data);
  },

  async inativar(id: number): Promise<void> {
    await apiClient.patch(`/clients/${id}/deactivate`);
  },
};

import apiClient from '../axios';

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
  async listarTodos(): Promise<LocalDTO[]> {
    const response = await apiClient.get<LocalDTO[]>('/locais');
    return response.data;
  },

  async listarPorCliente(clienteId: number): Promise<LocalDTO[]> {
    const response = await apiClient.get<LocalDTO[]>(`/locais/cliente/${clienteId}`);
    return response.data;
  },

  async cadastrar(data: LocalRequest): Promise<LocalDTO> {
    const response = await apiClient.post<LocalDTO>('/locais', data);
    return response.data;
  },
};

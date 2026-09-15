import apiClient from '../axios';

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
  async listar(): Promise<ClienteDTO[]> {
    const response = await apiClient.get<ClienteDTO[]>('/clientes');
    return response.data;
  },

  async buscarPorId(id: number): Promise<ClienteDTO> {
    const response = await apiClient.get<ClienteDTO>(`/clientes/${id}`);
    return response.data;
  },

  async cadastrar(data: ClienteRequest): Promise<ClienteDTO> {
    const response = await apiClient.post<ClienteDTO>('/clientes', data);
    return response.data;
  },

  async inativar(id: number): Promise<void> {
    await apiClient.delete(`/clientes/${id}`);
  },
};

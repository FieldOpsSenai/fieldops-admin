import apiClient from '../axios';

export interface EquipamentoDTO {
  id: number;
  nome: string;
  numeroSerie: string;
  tipo?: string;
  ativo: boolean;
  localId: number;
  localNome?: string;
}

export interface EquipamentoRequest {
  nome: string;
  numeroSerie: string;
  tipo?: string;
  localId: number;
}

export const equipamentoService = {
  async listarTodos(): Promise<EquipamentoDTO[]> {
    const response = await apiClient.get<EquipamentoDTO[]>('/equipamentos');
    return response.data;
  },

  async listarPorLocal(localId: number): Promise<EquipamentoDTO[]> {
    const response = await apiClient.get<EquipamentoDTO[]>(`/equipamentos/local/${localId}`);
    return response.data;
  },

  async cadastrar(data: EquipamentoRequest): Promise<EquipamentoDTO> {
    const response = await apiClient.post<EquipamentoDTO>('/equipamentos', data);
    return response.data;
  },
};

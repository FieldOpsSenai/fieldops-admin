import apiClient from '../axios';

export type InspecaoStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export interface InspecaoDTO {
  id: number;
  descricao: string;
  status: InspecaoStatus;
  dataAgendada: string;
  dataRealizacao?: string | null;
  observacoes?: string | null;
  equipamentoId: number;
  equipamentoNome?: string;
  usuarioId: number;
  usuarioNome?: string;
}

export interface InspecaoRequest {
  descricao: string;
  dataAgendada: string; // ISO string e.g. "2026-08-31T14:30:00"
  observacoes?: string;
  equipamentoId: number;
  usuarioId: number;
}

export interface InspecaoStatusUpdate {
  status: InspecaoStatus;
  observacoes?: string;
}

export const inspecaoService = {
  async listarTodas(): Promise<InspecaoDTO[]> {
    const response = await apiClient.get<InspecaoDTO[]>('/inspecoes');
    return response.data;
  },

  async listarPorUsuario(usuarioId: number): Promise<InspecaoDTO[]> {
    const response = await apiClient.get<InspecaoDTO[]>(`/inspecoes/usuario/${usuarioId}`);
    return response.data;
  },

  async criar(data: InspecaoRequest): Promise<InspecaoDTO> {
    const response = await apiClient.post<InspecaoDTO>('/inspecoes', data);
    return response.data;
  },

  async atualizarStatus(id: number, data: InspecaoStatusUpdate): Promise<InspecaoDTO> {
    const response = await apiClient.patch<InspecaoDTO>(`/inspecoes/${id}/status`, data);
    return response.data;
  },
};

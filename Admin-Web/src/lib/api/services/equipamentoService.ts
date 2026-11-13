import apiClient from '../axios';
import { mapApiPage, type ApiPage, type CadastroQuery } from './apiPage';

export interface EquipamentoDTO {
  id: number;
  nome: string;
  numeroSerie: string;
  tipo?: string;
  ativo: boolean;
  localId: number;
  localNome?: string;
  qrCode?: string;
}

export interface EquipamentoRequest {
  nome: string;
  numeroSerie: string;
  tipo?: string;
  localId: number;
  qrCode?: string;
}

export const equipamentoService = {
  async listarPagina(query: CadastroQuery, signal?: AbortSignal): Promise<ApiPage<EquipamentoDTO>> {
    if (query.status === 'INACTIVE') throw new Error('A API não permite consultar equipamentos inativos.');
    const response = await apiClient.get<ApiPage<EquipamentoDTO>>('/equipamentos', {
      params: { page: query.page ?? 0, size: query.size ?? 10, termo: query.search || undefined, localId: query.siteId, sort: 'nome,asc' }, signal,
    });
    return mapApiPage(response.data, (equipment) => equipment);
  },
  async listarTodos(): Promise<EquipamentoDTO[]> { return (await apiClient.get<EquipamentoDTO[]>('/equipamentos/todos')).data; },
  async listarPorLocal(localId: number): Promise<EquipamentoDTO[]> { return (await apiClient.get<EquipamentoDTO[]>(`/equipamentos/local/${localId}`)).data; },
  async cadastrar(data: EquipamentoRequest): Promise<EquipamentoDTO> { return (await apiClient.post<EquipamentoDTO>('/equipamentos', data)).data; },
  async atualizar(id: number, data: EquipamentoRequest): Promise<EquipamentoDTO> { return (await apiClient.put<EquipamentoDTO>(`/equipamentos/${id}`, data)).data; },
  async inativar(id: number): Promise<void> { await apiClient.delete(`/equipamentos/${id}`); },
  async buscarPorQr(qrCode: string): Promise<EquipamentoDTO> {
    if (!qrCode.trim()) throw new Error('Informe um QR Code válido.');
    return (await apiClient.get<EquipamentoDTO>(`/equipamentos/qrcode/${encodeURIComponent(qrCode.trim())}`)).data;
  },
};
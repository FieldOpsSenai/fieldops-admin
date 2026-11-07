import apiClient from '../axios';
import { getPageContent } from './apiPage';

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

interface ApiEquipment {
  id: number;
  name: string;
  siteId: number;
  siteName?: string;
  serialNumber?: string;
  model?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DECOMMISSIONED';
}

function fromApiEquipment(equipment: ApiEquipment): EquipamentoDTO {
  return {
    id: equipment.id,
    nome: equipment.name,
    numeroSerie: equipment.serialNumber ?? '',
    tipo: equipment.model,
    ativo: equipment.status === 'ACTIVE',
    localId: equipment.siteId,
    localNome: equipment.siteName,
  };
}

export const equipamentoService = {
  async listarTodos(): Promise<EquipamentoDTO[]> {
    const response = await apiClient.get<ApiEquipment[] | { content?: ApiEquipment[] }>('/equipment', {
      params: { size: 200 },
    });
    return getPageContent(response.data).map(fromApiEquipment);
  },

  async listarPorLocal(localId: number): Promise<EquipamentoDTO[]> {
    const response = await apiClient.get<ApiEquipment[] | { content?: ApiEquipment[] }>('/equipment', {
      params: { siteId: localId, size: 200 },
    });
    return getPageContent(response.data).map(fromApiEquipment);
  },

  async cadastrar(data: EquipamentoRequest): Promise<EquipamentoDTO> {
    const response = await apiClient.post<ApiEquipment>('/equipment', {
      siteId: data.localId,
      name: data.nome,
      assetNumber: data.numeroSerie,
      serialNumber: data.numeroSerie,
      manufacturer: 'FieldOps QA',
      model: data.tipo || data.nome,
      qrCode: data.numeroSerie,
      status: 'ACTIVE',
    });
    return fromApiEquipment(response.data);
  },

  async atualizar(id: number, data: EquipamentoRequest): Promise<EquipamentoDTO> {
    const response = await apiClient.put<EquipamentoDTO>(`/equipamentos/${id}`, data);
    return response.data;
  },

  async inativar(id: number): Promise<void> {
    await apiClient.delete(`/equipamentos/${id}`);
  },
};

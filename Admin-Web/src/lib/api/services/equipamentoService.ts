import apiClient from '../axios';
import { getPageContent, mapApiPage, type ApiPage, type CadastroQuery } from './apiPage';

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

interface ApiEquipment {
  id: number;
  name: string;
  siteId: number;
  siteName?: string;
  serialNumber?: string;
  model?: string;
  assetNumber?: string;
  manufacturer?: string;
  description?: string;
  qrCode?: string;
  installedAt?: string;
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
    qrCode: equipment.qrCode,
  };
}

export const equipamentoService = {
  async listarPagina(query: CadastroQuery, signal?: AbortSignal): Promise<ApiPage<EquipamentoDTO>> {
    const response = await apiClient.get<ApiPage<ApiEquipment>>('/equipment', {
      params: { page: query.page ?? 0, size: query.size ?? 10, name: query.search || undefined, status: query.status, siteId: query.siteId, sort: 'name,asc' }, signal,
    });
    return mapApiPage(response.data, fromApiEquipment);
  },
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
      model: data.tipo || data.nome,
      qrCode: data.qrCode || crypto.randomUUID(),
      status: 'ACTIVE',
    });
    return fromApiEquipment(response.data);
  },

  async atualizar(id: number, data: EquipamentoRequest): Promise<EquipamentoDTO> {
    const existing = (await apiClient.get<ApiEquipment>(`/equipment/${id}`)).data;
    const response = await apiClient.put<ApiEquipment>(`/equipment/${id}`, {
      siteId: data.localId,
      name: data.nome,
      serialNumber: data.numeroSerie,
      model: data.tipo,
      assetNumber: existing.assetNumber,
      manufacturer: existing.manufacturer,
      description: existing.description,
      qrCode: existing.qrCode,
      status: existing.status,
      installedAt: existing.installedAt,
    });
    return fromApiEquipment(response.data);
  },

  async inativar(id: number): Promise<void> {
    await apiClient.patch(`/equipment/${id}/status`, { status: 'INACTIVE' });
  },

  async buscarPorQr(qrCode: string): Promise<EquipamentoDTO> {
    if (!qrCode.trim()) throw new Error('Informe um QR Code válido.');
    const response = await apiClient.get<ApiEquipment>(`/equipment/by-qr/${encodeURIComponent(qrCode.trim())}`);
    return fromApiEquipment(response.data);
  },
};

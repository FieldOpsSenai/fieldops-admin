import apiClient from '../axios';
import { getPageContent } from './apiPage';

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
  clienteId?: number;
  localId?: number;
  templateVersionId?: number;
  prioridade?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface ApiInspection {
  id: number;
  title: string;
  status: 'DRAFT' | 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELED';
  dueDate?: string;
  dueTime?: string;
  scheduledDate?: string;
  equipmentName?: string;
  technicianId?: number;
  technicianName?: string;
}

function fromApiInspection(inspection: ApiInspection): InspecaoDTO {
  const status: InspecaoStatus =
    inspection.status === 'DRAFT' || inspection.status === 'ASSIGNED'
      ? 'PENDENTE'
      : inspection.status === 'IN_PROGRESS' || inspection.status === 'UNDER_REVIEW' || inspection.status === 'REJECTED'
        ? 'EM_ANDAMENTO'
        : inspection.status === 'CANCELED'
          ? 'CANCELADA'
          : 'CONCLUIDA';
  const scheduled = inspection.scheduledDate ?? inspection.dueDate ?? '';

  return {
    id: inspection.id,
    descricao: inspection.title,
    status,
    dataAgendada: inspection.dueTime && !scheduled.includes('T')
      ? `${scheduled}T${inspection.dueTime}`
      : scheduled,
    equipamentoId: 0,
    equipamentoNome: inspection.equipmentName,
    usuarioId: inspection.technicianId ?? 0,
    usuarioNome: inspection.technicianName,
  };
}

export interface InspecaoStatusUpdate {
  status: InspecaoStatus;
  observacoes?: string;
}

export const inspecaoService = {
  async listarTodas(): Promise<InspecaoDTO[]> {
    const response = await apiClient.get<ApiInspection[] | { content?: ApiInspection[] }>('/inspections', {
      params: { size: 200 },
    });
    return getPageContent(response.data).map(fromApiInspection);
  },

  async listarPorUsuario(usuarioId: number): Promise<InspecaoDTO[]> {
    return (await this.listarTodas()).filter((inspection) => inspection.usuarioId === usuarioId);
  },

  async criar(data: InspecaoRequest): Promise<InspecaoDTO> {
    if (!data.clienteId || !data.localId || !data.templateVersionId) {
      throw new Error('Cliente, local e versão publicada do modelo são obrigatórios para criar uma inspeção.');
    }

    if (!data.descricao.trim() || data.descricao.trim().length > 300) {
      throw new Error('Informe um título com até 300 caracteres.');
    }
    if ((data.observacoes?.trim().length ?? 0) > 2000) {
      throw new Error('As instruções devem ter até 2000 caracteres.');
    }
    const deadline = new Date(data.dataAgendada);
    if (!Number.isFinite(deadline.getTime()) || deadline.getTime() <= Date.now()) {
      throw new Error('Informe um prazo futuro válido.');
    }

    const dateTime = data.dataAgendada.replace(' ', 'T');
    const [dueDate, dueTime] = dateTime.split('T');
    const response = await apiClient.post<ApiInspection>('/inspections', {
      title: data.descricao.trim(),
      templateVersionId: data.templateVersionId,
      clientId: data.clienteId,
      siteId: data.localId,
      equipmentId: data.equipamentoId,
      technicianId: data.usuarioId,
      priority: data.prioridade ?? 'MEDIUM',
      dueDate,
      dueTime,
      supervisorInstructions: data.observacoes?.trim() || undefined,
    });
    return fromApiInspection(response.data);
  },

  async atualizarStatus(id: number, data: InspecaoStatusUpdate): Promise<InspecaoDTO> {
    if (data.status !== 'CANCELADA') {
      throw new Error('A API atual só permite cancelar inspeções por esta ação.');
    }

    const match = data.observacoes?.match(/\[Cancelamento:\s*([^\]]+)\]/);
    const response = await apiClient.post<ApiInspection>(`/inspections/${id}/cancel`, {
      reason: match?.[1] ?? data.observacoes ?? 'Cancelado pelo administrador',
    });
    return fromApiInspection(response.data);
  },
};

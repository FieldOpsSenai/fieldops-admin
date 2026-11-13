import apiClient from '../axios';
import { apiSearchTerm, collectPages, mapApiPage, type ApiPage } from './apiPage';

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
  statusApi?: ApiInspection['status'];
  canceladoEm?: string;
  canceladoPor?: number;
  motivoCancelamento?: string;
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

export interface ApiInspection {
  id: number;
  title: string;
  status: 'DRAFT' | 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELED';
  dueDate?: string;
  dueTime?: string;
  scheduledDate?: string;
  equipmentName?: string;
  technicianId?: number;
  technicianName?: string;
  clientName?: string;
  siteName?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  progress?: number;
  overdue?: boolean;
  instructions?: string;
}

interface ApiMainInspection {
  id: number; descricao: string; status: 'AGENDADA' | 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  dataAgendada: string; dataLimite?: string; clienteNome?: string; localNome?: string; equipamentoNome?: string;
  usuarioId?: number; usuarioNome?: string; prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'; instrucoes?: string;
}

export interface InspectionQuery {
  page: number; size: number; name?: string; status?: ApiInspection['status'];
  technicianName?: string; clientName?: string; priority?: ApiInspection['priority'];
}
export interface InspectionAuditEvent {
  id: number; actorId: number; action: string; detail?: string; occurredAt: string;
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
    statusApi: inspection.status,
    dataAgendada: inspection.dueTime && !scheduled.includes('T')
      ? `${scheduled}T${inspection.dueTime}`
      : scheduled,
    equipamentoId: 0,
    equipamentoNome: inspection.equipmentName,
    usuarioId: inspection.technicianId ?? 0,
    usuarioNome: inspection.technicianName,
  };
}

export const inspecaoService = {
  async listarPagina(query: InspectionQuery, signal?: AbortSignal): Promise<ApiPage<ApiInspection>> {
    const statuses: Partial<Record<ApiInspection['status'], ApiMainInspection['status']>> = { DRAFT: 'PENDENTE', ASSIGNED: 'AGENDADA', IN_PROGRESS: 'EM_ANDAMENTO', APPROVED: 'CONCLUIDA', CANCELED: 'CANCELADA' };
    const priorities = { LOW: 'BAIXA', MEDIUM: 'MEDIA', HIGH: 'ALTA', CRITICAL: 'URGENTE' } as const;
    const response = await apiClient.get<ApiPage<ApiMainInspection>>('/inspecoes', { params: {
      page: query.page, size: query.size, termo: apiSearchTerm(query.name),
      status: query.status ? statuses[query.status] : undefined,
      usuarioId: query.technicianName ? Number(query.technicianName) : undefined,
      clienteId: query.clientName ? Number(query.clientName) : undefined,
      prioridade: query.priority ? priorities[query.priority] : undefined,
    }, signal });
    const statusMap: Record<ApiMainInspection['status'], ApiInspection['status']> = { PENDENTE: 'DRAFT', AGENDADA: 'ASSIGNED', EM_ANDAMENTO: 'IN_PROGRESS', CONCLUIDA: 'APPROVED', CANCELADA: 'CANCELED' };
    const priorityMap = { BAIXA: 'LOW', MEDIA: 'MEDIUM', ALTA: 'HIGH', URGENTE: 'CRITICAL' } as const;
    return mapApiPage(response.data, (item) => ({ id: item.id, title: item.descricao, status: statusMap[item.status],
      scheduledDate: item.dataAgendada, dueDate: item.dataLimite, clientName: item.clienteNome, siteName: item.localNome,
      equipmentName: item.equipamentoNome, technicianId: item.usuarioId, technicianName: item.usuarioNome,
      priority: item.prioridade ? priorityMap[item.prioridade] : undefined, instructions: item.instrucoes,
      overdue: !!item.dataLimite && !['CONCLUIDA', 'CANCELADA'].includes(item.status) && new Date(item.dataLimite).getTime() < Date.now() }));
  },
  async listarTodas(): Promise<InspecaoDTO[]> {
    return (await collectPages((page) => this.listarPagina({ page, size: 100 }))).map(fromApiInspection);
  },

  async listarPorUsuario(usuarioId: number): Promise<InspecaoDTO[]> {
    return (await this.listarTodas()).filter((inspection) => inspection.usuarioId === usuarioId);
  },

  async criar(data: InspecaoRequest): Promise<InspecaoDTO> {
    if (!data.clienteId || !data.localId || !data.templateVersionId) {
      throw new Error('Cliente, local e versão publicada do modelo são obrigatórios para criar uma inspeção.');
    }
    if (!data.equipamentoId) throw new Error('Selecione um equipamento para a inspeção.');

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
    const priorities = { LOW: 'BAIXA', MEDIUM: 'MEDIA', HIGH: 'ALTA', CRITICAL: 'URGENTE' } as const;
    const response = await apiClient.post<Omit<InspecaoDTO, 'status'> & { status: InspecaoStatus | 'AGENDADA' }>('/inspecoes', {
      descricao: data.descricao.trim(),
      modeloId: data.templateVersionId,
      clienteId: data.clienteId,
      localId: data.localId,
      equipamentoId: data.equipamentoId,
      usuarioId: data.usuarioId,
      prioridade: priorities[data.prioridade ?? 'MEDIUM'],
      dataAgendada: dateTime,
      dataLimite: dateTime,
      instrucoes: data.observacoes?.trim() || undefined,
    });
    return { ...response.data, status: response.data.status === 'AGENDADA' ? 'PENDENTE' : response.data.status };
  },

  async cancelar(id: number, reason: string): Promise<InspecaoDTO> {
    const motivo = reason.trim();
    if (!motivo || motivo.length > 1000) throw new Error('Informe um motivo com até 1000 caracteres.');
    const response = await apiClient.patch<InspecaoDTO>(`/inspecoes/${id}/cancelar`, { motivo });
    return response.data;
  },
  async atualizarPlanejamento(id: number, data: { priority: NonNullable<ApiInspection['priority']>; dueDate: string; instructions: string }): Promise<InspecaoDTO> {
    const priorities = { LOW: 'BAIXA', MEDIUM: 'MEDIA', HIGH: 'ALTA', CRITICAL: 'URGENTE' } as const;
    if (data.dueDate && !Number.isFinite(new Date(data.dueDate).getTime())) throw new Error('Informe um prazo válido.');
    if (data.instructions.length > 2000) throw new Error('As instruções devem ter até 2000 caracteres.');
    return (await apiClient.patch<InspecaoDTO>(`/inspecoes/${id}/planejamento`, {
      prioridade: priorities[data.priority], dataLimite: data.dueDate || null, instrucoes: data.instructions.trim() || null,
    })).data;
  },
};

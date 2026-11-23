import apiClient from '../axios';
import type { InspecaoDTO } from './inspecaoService';

export interface SnapshotItem {
  id: number;
  secaoTitulo: string;
  itemOriginalId: number;
  itemDescricao: string;
  tipoResposta: string;
  ordem: number;
  obrigatorio: boolean;
  critico: boolean;
  evidenciaObrigatoria: boolean;
}

export interface InspectionAnswer {
  id: number;
  inspecaoId: number;
  snapshotItemId: number;
  valor: string | null;
  observacao?: string | null;
}

export interface InspectionEvidence {
  id: number;
  inspecaoId: number;
  snapshotItemId?: number | null;
  nomeArquivo: string;
  tipoConteudo: string;
  dataUpload: string;
}

export interface ReviewDecision {
  supervisorId: number;
  aprovado: boolean;
  motivoReprovacao?: string;
}

function validId(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Identificador inválido.');
}

export const revisaoService = {
  async snapshot(id: number, signal?: AbortSignal): Promise<SnapshotItem[]> {
    validId(id);
    const { data } = await apiClient.get<SnapshotItem[]>(`/inspecoes/${id}/snapshot`, { signal });
    if (!Array.isArray(data)) throw new Error('Checklist retornado em formato inválido.');
    return [...data].sort((a, b) => a.ordem - b.ordem);
  },
  async respostas(id: number, signal?: AbortSignal): Promise<InspectionAnswer[]> {
    validId(id);
    const { data } = await apiClient.get<InspectionAnswer[]>(`/inspecoes/${id}/respostas`, {
      signal,
    });
    if (!Array.isArray(data) || data.some((answer) => answer.inspecaoId !== id))
      throw new Error('Respostas incompatíveis com a inspeção.');
    return data;
  },
  async evidencias(id: number, signal?: AbortSignal): Promise<InspectionEvidence[]> {
    validId(id);
    const { data } = await apiClient.get<InspectionEvidence[]>(`/inspecoes/${id}/fotos`, {
      signal,
    });
    if (!Array.isArray(data) || data.some((photo) => photo.inspecaoId !== id))
      throw new Error('Evidências incompatíveis com a inspeção.');
    return data;
  },
  async revisar(id: number, decision: ReviewDecision): Promise<InspecaoDTO> {
    validId(id);
    validId(decision.supervisorId);
    const reason = decision.motivoReprovacao?.trim() ?? '';
    if (!decision.aprovado && !reason) throw new Error('Informe o motivo da reprovação.');
    // A coluna atual da API é VARCHAR(255).
    if (reason.length > 255) throw new Error('O motivo deve ter até 255 caracteres.');
    const { data } = await apiClient.patch<InspecaoDTO>(`/inspecoes/${id}/revisar`, {
      supervisorId: decision.supervisorId,
      aprovado: decision.aprovado,
      ...(!decision.aprovado ? { motivoReprovacao: reason } : {}),
    });
    const expectedStatus = decision.aprovado ? 'CONCLUIDA' : 'EM_ANDAMENTO';
    if (data.id !== id || data.status !== expectedStatus) {
      throw new Error(
        'A resposta da API não confirmou a decisão esperada. Atualize a inspeção antes de tentar novamente.',
      );
    }
    return data;
  },
};

import type { ApiInspection } from '@/lib/api/services/inspecaoService';

// CONCLUIDA é conclusão da execução, não comprovação de aprovação.
export const inspectionStatusLabels: Record<ApiInspection['status'], string> = {
  DRAFT: 'Pendente',
  ASSIGNED: 'Agendada',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  CANCELED: 'Cancelada',
};

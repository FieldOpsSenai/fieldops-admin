import apiClient from '../axios';
import { getPageContent } from './apiPage';
import type { ResponseType, Template, TemplateItem, TemplateSection, TemplateVersion } from '@/types';
import { validateTemplateItems } from '@/lib/templates/validation';

export interface ModeloInspecaoPublicado {
  versaoId: number;
  modeloId: number;
  titulo: string;
  categoria: string;
  versao: number;
}

interface TemplateSummary {
  id: number;
  title: string;
  category: string;
  version: number;
  status: 'ACTIVE' | 'DRAFT' | 'INACTIVE';
}

interface ApiTemplateItem {
  id: number;
  title: string;
  description?: string;
  responseType: string;
  required: boolean;
  observationRequiredOnFailure: boolean;
  evidenceRequiredOnFailure: boolean;
  optionsJson?: string[];
  displayOrder: number;
}

interface ApiTemplateSection {
  id: number;
  title: string;
  description?: string;
  displayOrder: number;
  items: ApiTemplateItem[];
}

interface ApiTemplateDetail extends TemplateSummary {
  description?: string;
  status: 'ACTIVE' | 'DRAFT' | 'INACTIVE';
  currentVersion?: number;
  createdAt: string;
  updatedAt: string;
  sections: ApiTemplateSection[];
}

function mapResponseType(value: string): ResponseType {
  if (value === 'TEXT_LONG') return 'LONG_TEXT';
  if (value === 'BOOLEAN') return 'YES_NO';
  if (value === 'NUMBER') return 'NUMERIC';
  if (value === 'SINGLE_CHOICE') return 'SINGLE_SELECT';
  if (value === 'CONFORMITY') return 'BOOLEAN';
  if (value === 'DATE') return 'DATE';
  return 'TEXT';
}

function toApiResponseType(value: ResponseType): string {
  if (value === 'LONG_TEXT') return 'TEXT_LONG';
  if (value === 'YES_NO') return 'BOOLEAN';
  if (value === 'NUMERIC') return 'NUMBER';
  if (value === 'SINGLE_SELECT') return 'SINGLE_CHOICE';
  if (value === 'BOOLEAN') return 'CONFORMITY';
  if (value === 'DATE') return 'DATE';
  return 'TEXT_SHORT';
}

function mapTemplateItem(item: ApiTemplateItem): TemplateItem {
  return {
    id: String(item.id),
    label: item.title,
    responseType: mapResponseType(item.responseType),
    options: item.optionsJson?.map((label, index) => ({ id: `${item.id}-${index + 1}`, label, order: index + 1 })),
    required: item.required,
    allowObservation: item.observationRequiredOnFailure,
    requireEvidenceOnNonConformity: item.evidenceRequiredOnFailure,
    order: item.displayOrder,
  };
}

function mapTemplate(template: ApiTemplateDetail, version?: TemplateVersion, versions?: TemplateVersion[]): Template & { description: string; category: string } {
  return {
    id: String(template.id),
    title: template.title,
    description: template.description ?? '',
    category: template.category,
    status: template.status === 'ACTIVE' ? 'PUBLICADO' : 'RASCUNHO',
    version: template.currentVersion ?? template.version,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    publishedAt: version?.publishedAt,
    publishedBy: version?.publishedBy ? `Usuário #${version.publishedBy}` : undefined,
    publishedVersions: versions ?? (version ? [version] : []),
    sections: [...template.sections].sort((a, b) => a.displayOrder - b.displayOrder).map((section): TemplateSection => ({
      id: String(section.id),
      title: section.title,
      order: section.displayOrder,
      items: [...section.items].sort((a, b) => a.displayOrder - b.displayOrder).map(mapTemplateItem),
    })),
  };
}

export const modeloInspecaoService = {
  async criarRascunho(data: { title: string; description: string; category: string }) {
    const response = await apiClient.post<ApiTemplateDetail>('/inspection-templates', data);
    return mapTemplate(response.data);
  },

  async buscarPorId(id: string) {
    const response = await apiClient.get<ApiTemplateDetail>(`/inspection-templates/${id}`);
    return mapTemplate(response.data);
  },

  // Successful creates replace temporary IDs in this working copy. Keep it on a
  // failed save so retrying does not duplicate confirmed sections or items.
  async salvarRascunho(
    id: string,
    data: { title: string; description: string; category: string; sections: TemplateSection[] },
  ) {
    const base = `/inspection-templates/${id}`;
    const current = (await apiClient.get<ApiTemplateDetail>(base)).data;
    if (current.status !== 'DRAFT') throw new Error('Versões publicadas são imutáveis.');
    const errors = validateTemplateItems(data.sections);
    if (errors.length) throw new Error(errors.join(' '));
    for (const section of data.sections) {
      if (!section.title.trim() || section.title.trim().length > 200) {
        throw new Error('Cada seção deve ter um nome com até 200 caracteres.');
      }
      const previous = current.sections.find((entry) => String(entry.id) === section.id);
      if (previous?.items.some((item) => !section.items.some((entry) => entry.id === String(item.id)))) {
        throw new Error('A exclusão de itens já salvos ainda não está disponível. Você pode remover a seção inteira.');
      }
      for (const item of section.items) {
        if (item.responseType === 'MULTI_SELECT') throw new Error('Seleção múltipla ainda não está disponível.');
      }
    }
    await apiClient.put(base, { title: data.title, description: data.description, category: data.category });
    for (const [index, section] of data.sections.entries()) {
      const previous = current.sections.find((entry) => String(entry.id) === section.id);
      const payload = { title: section.title, description: previous?.description, displayOrder: index + 1 };
      if (previous) {
        await apiClient.put(`${base}/sections/${section.id}`, payload);
      } else {
        const created = await apiClient.post<ApiTemplateSection>(`${base}/sections`, payload);
        section.id = String(created.data.id);
      }
      for (const [itemIndex, item] of section.items.entries()) {
        const oldItem = previous?.items.find((entry) => String(entry.id) === item.id);
        const payload = {
          title: item.label,
          description: oldItem?.description,
          responseType: toApiResponseType(item.responseType),
          required: item.required,
          observationRequiredOnFailure: item.allowObservation,
          evidenceRequiredOnFailure: item.requireEvidenceOnNonConformity,
          optionsJson: item.responseType === 'SINGLE_SELECT' ? item.options?.map((option) => option.label.trim()) ?? [] : [],
          displayOrder: itemIndex + 1,
        };
        const path = `${base}/sections/${section.id}/items`;
        if (oldItem) await apiClient.put(`${path}/${item.id}`, payload);
        else {
          const created = await apiClient.post<ApiTemplateItem>(path, payload);
          item.id = String(created.data.id);
        }
      }
    }
    // Remove sections only after all requested additions/updates succeeded.
    for (const section of current.sections) {
      if (!data.sections.some((entry) => entry.id === String(section.id))) {
        await apiClient.delete(`${base}/sections/${section.id}`);
      }
    }
    return this.buscarPorId(id);
  },

  async publicar(id: string) {
    const preview = (await apiClient.get<{ template: ApiTemplateDetail; validForPublication: boolean; issues: string[] }>(
      `/inspection-templates/${id}/preview`,
    )).data;
    if (preview.template.status !== 'DRAFT') throw new Error('Somente rascunhos podem ser publicados.');
    if (!preview.validForPublication) throw new Error(preview.issues.join(' ') || 'A estrutura do modelo não pode ser publicada.');
    const version = await apiClient.post<TemplateVersion>(`/inspection-templates/${id}/publish`);
    // Publication is already confirmed. Do not turn a later read failure into
    // a false publication error that invites a second POST.
    return mapTemplate({ ...preview.template, status: 'ACTIVE', currentVersion: version.data.versionNumber }, version.data);
  },

  async listarTodos(): Promise<Array<Template & { description: string; category: string }>> {
    const response = await apiClient.get<TemplateSummary[] | { content?: TemplateSummary[] }>(
      '/inspection-templates',
      { params: { page: 0, size: 200 } },
    );
    const summaries = getPageContent(response.data).filter((template) => template.status !== 'INACTIVE');
    return Promise.all(summaries.map(async (summary) => {
      const [detailResponse, versionsResponse] = await Promise.all([
        apiClient.get<ApiTemplateDetail>(`/inspection-templates/${summary.id}`),
        apiClient.get<TemplateVersion[]>(`/inspection-templates/${summary.id}/versions`),
      ]);
      const latestVersion = [...versionsResponse.data].sort((a, b) => b.versionNumber - a.versionNumber)[0];
      return mapTemplate(detailResponse.data, latestVersion, versionsResponse.data);
    }));
  },

  async listarPublicados(): Promise<ModeloInspecaoPublicado[]> {
    const response = await apiClient.get<TemplateSummary[] | { content?: TemplateSummary[] }>(
      '/inspection-templates',
      { params: { status: 'ACTIVE', page: 0, size: 200 } },
    );

    const templates = getPageContent(response.data);
    const versions = await Promise.all(
      templates.map(async (template) => {
        const versionResponse = await apiClient.get<TemplateVersion[]>(
          `/inspection-templates/${template.id}/versions`,
        );
        const latest = [...versionResponse.data].sort(
          (left, right) => right.versionNumber - left.versionNumber,
        )[0];

        return latest
          ? {
              versaoId: latest.id,
              modeloId: template.id,
              titulo: template.title,
              categoria: template.category,
              versao: latest.versionNumber,
            }
          : null;
      }),
    );

    return versions.filter((version): version is ModeloInspecaoPublicado => version !== null);
  },
};

import apiClient from '../axios';
import { getPageContent } from './apiPage';
import type { ResponseType, Template, TemplateItem, TemplateSection } from '@/types';

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

interface TemplateVersion {
  id: number;
  versionNumber: number;
  publishedAt?: string;
}

interface ApiTemplateItem {
  id: number;
  title: string;
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
  if (value === 'NUMBER') return 'NUMERIC';
  if (value === 'SINGLE_CHOICE') return 'SINGLE_SELECT';
  if (value === 'BOOLEAN' || value === 'CONFORMITY') return 'BOOLEAN';
  if (value === 'DATE') return 'DATE';
  return 'TEXT';
}

function toApiResponseType(value: ResponseType): string {
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

function mapTemplate(template: ApiTemplateDetail, publishedAt?: string): Template & { description: string; category: string } {
  return {
    id: String(template.id),
    title: template.title,
    description: template.description ?? '',
    category: template.category,
    status: template.status === 'ACTIVE' ? 'PUBLICADO' : 'RASCUNHO',
    version: template.currentVersion ?? template.version,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    publishedAt,
    publishedBy: publishedAt ? 'FieldOps' : undefined,
    sections: template.sections.map((section): TemplateSection => ({
      id: String(section.id),
      title: section.title,
      order: section.displayOrder,
      items: section.items.map(mapTemplateItem),
    })),
  };
}

export const modeloInspecaoService = {
  async criar(
    data: { title: string; description: string; category: string; sections: TemplateSection[] },
    publish: boolean,
  ): Promise<Template & { description: string; category: string }> {
    const created = await apiClient.post<TemplateSummary>('/inspection-templates', {
      title: data.title,
      description: data.description,
      category: data.category,
    });

    for (const [sectionIndex, section] of data.sections.entries()) {
      await apiClient.post<ApiTemplateSection>(
        `/inspection-templates/${created.data.id}/sections`,
        { title: section.title, displayOrder: sectionIndex + 1 },
      );

      const refreshed = await apiClient.get<ApiTemplateDetail>(`/inspection-templates/${created.data.id}`);
      const persistedSection = refreshed.data.sections.find(
        (item) => item.title === section.title && item.displayOrder === sectionIndex + 1,
      );
      if (!persistedSection) {
        throw new Error(`A seção "${section.title}" não foi confirmada pela API.`);
      }

      for (const [itemIndex, item] of section.items.entries()) {
        await apiClient.post(`/inspection-templates/${created.data.id}/sections/${persistedSection.id}/items`, {
          title: item.label,
          responseType: toApiResponseType(item.responseType),
          required: item.required,
          observationRequiredOnFailure: item.allowObservation,
          evidenceRequiredOnFailure: item.requireEvidenceOnNonConformity,
          optionsJson: item.options?.map((option) => option.label) ?? [],
          displayOrder: itemIndex + 1,
        });
      }
    }

    let publishedAt: string | undefined;
    if (publish) {
      const version = await apiClient.post<TemplateVersion>(`/inspection-templates/${created.data.id}/publish`);
      publishedAt = version.data.publishedAt;
    }

    const detail = await apiClient.get<ApiTemplateDetail>(`/inspection-templates/${created.data.id}`);
    return mapTemplate(detail.data, publishedAt);
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
      return mapTemplate(detailResponse.data, latestVersion?.publishedAt);
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

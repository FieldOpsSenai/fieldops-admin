import apiClient from '../axios';
import { apiSearchTerm, collectPages, type ApiPage } from './apiPage';
import { validateTemplateItems } from '@/lib/templates/validation';
import type { ResponseType, Template, TemplateItem, TemplateSection } from '@/types';

export interface ModeloInspecaoPublicado { versaoId: number; modeloId: number; titulo: string; categoria: string; versao: number }
interface ApiItem { id: number; descricao: string; tipoResposta: string; ordem: number; obrigatorio: boolean; critico: boolean; evidenciaObrigatoria: boolean }
interface ApiSection { id: number; titulo: string; ordem: number; itens: ApiItem[] }
interface ApiModel { id: number; titulo: string; categoria: string; versao: number; status: 'RASCUNHO' | 'PUBLICADO'; dataCriacao: string; secoes: ApiSection[] }
type DraftData = { title: string; description: string; category: string; sections: TemplateSection[] };
type MappedModel = Template & { description: string; category: string };
const base = '/modelos-inspecao';

function responseType(value: string): ResponseType {
  const types: Record<string, ResponseType> = { TEXT: 'TEXT', TEXTO: 'TEXT', TEXT_SHORT: 'TEXT', LONG_TEXT: 'LONG_TEXT', TEXT_LONG: 'LONG_TEXT', NUMERIC: 'NUMERIC', NUMBER: 'NUMERIC', NUMERO: 'NUMERIC', DATE: 'DATE', DATA: 'DATE', BOOLEAN: 'YES_NO', CONFORMITY: 'BOOLEAN', YES_NO: 'YES_NO' };
  const mapped = types[value.toUpperCase()];
  if (!mapped) throw new Error(`Tipo de resposta não reconhecido pela interface: ${value}.`);
  return mapped;
}
function mapItem(item: ApiItem): TemplateItem {
  return { id: String(item.id), label: item.descricao, responseType: responseType(item.tipoResposta), required: item.obrigatorio,
    critical: item.critico, allowObservation: false, requireEvidenceOnNonConformity: item.evidenciaObrigatoria, order: item.ordem };
}
function mapModel(model: ApiModel): MappedModel {
  return { id: String(model.id), title: model.titulo, description: '', category: model.categoria, version: model.versao,
    status: model.status, createdAt: model.dataCriacao, updatedAt: '', sections: [...(model.secoes ?? [])].sort((a, b) => a.ordem - b.ordem).map((section) => ({
      id: String(section.id), title: section.titulo, order: section.ordem,
      items: [...(section.itens ?? [])].sort((a, b) => a.ordem - b.ordem).map(mapItem),
    })) };
}
function itemPayload(item: TemplateItem, index: number) {
  return { descricao: item.label.trim(), tipoResposta: item.responseType === 'YES_NO' ? 'BOOLEAN' : item.responseType === 'BOOLEAN' ? 'CONFORMITY' : item.responseType, ordem: index + 1, obrigatorio: item.required,
    critico: item.critical ?? false, evidenciaObrigatoria: item.requireEvidenceOnNonConformity };
}
function validate(data: DraftData) {
  if (data.description.trim()) throw new Error('A API atual não permite salvar descrição do modelo.');
  const errors = validateTemplateItems(data.sections);
  if (errors.length) throw new Error(errors.join(' '));
  for (const section of data.sections) {
    if (!section.title.trim()) throw new Error('Cada seção precisa ter um nome.');
    for (const item of section.items) {
      if (item.responseType === 'SINGLE_SELECT' || item.responseType === 'MULTI_SELECT') throw new Error('A API atual não permite salvar opções de seleção.');
      if (item.allowObservation) throw new Error('A API atual não permite configurar observação obrigatória.');
    }
  }
}
export const modeloInspecaoService = {
  async criarRascunho(data: { title: string; description: string; category: string }): Promise<MappedModel> {
    if (data.description.trim()) throw new Error('A API atual não permite salvar descrição do modelo.');
    return mapModel((await apiClient.post<ApiModel>(base, { titulo: data.title, categoria: data.category })).data);
  },
  async buscarPorId(id: string): Promise<MappedModel> { return mapModel((await apiClient.get<ApiModel>(`${base}/${id}`)).data); },
  async salvarRascunho(id: string, data: DraftData): Promise<MappedModel> {
    validate(data);
    const current = (await apiClient.get<ApiModel>(`${base}/${id}`)).data;
    if (current.status !== 'RASCUNHO') throw new Error('Versões publicadas são imutáveis.');
    await apiClient.put(`${base}/${id}`, { titulo: data.title, categoria: data.category });
    for (const [index, section] of data.sections.entries()) {
      const previous = current.secoes.find((entry) => String(entry.id) === section.id);
      const payload = { titulo: section.title.trim(), ordem: index + 1 };
      if (previous) await apiClient.put(`${base}/secoes/${section.id}`, payload);
      else section.id = String((await apiClient.post<ApiSection>(`${base}/${id}/secoes`, payload)).data.id);
      for (const [itemIndex, item] of section.items.entries()) {
        const oldItem = previous?.itens.find((entry) => String(entry.id) === item.id);
        if (oldItem) await apiClient.put(`${base}/itens/${item.id}`, itemPayload(item, itemIndex));
        else item.id = String((await apiClient.post<ApiItem>(`${base}/secoes/${section.id}/itens`, itemPayload(item, itemIndex))).data.id);
      }
    }
    for (const section of current.secoes) {
      const retained = data.sections.find((entry) => entry.id === String(section.id));
      if (!retained) await apiClient.delete(`${base}/secoes/${section.id}`);
      else for (const item of section.itens) {
        if (!retained.items.some((entry) => entry.id === String(item.id))) await apiClient.delete(`${base}/itens/${item.id}`);
      }
    }
    return this.buscarPorId(id);
  },
  async excluir(id: string): Promise<void> { await apiClient.delete(`${base}/${id}`); },
  async publicar(id: string): Promise<MappedModel> { return mapModel((await apiClient.patch<ApiModel>(`${base}/${id}/publicar`)).data); },
  async novaVersao(id: string): Promise<MappedModel> { return mapModel((await apiClient.post<ApiModel>(`${base}/${id}/nova-versao`)).data); },
  async listarTodos(): Promise<MappedModel[]> {
    const models = await collectPages(async (page) => (await apiClient.get<ApiPage<ApiModel>>(base, { params: { page, size: 100, termo: apiSearchTerm() } })).data);
    return models.map(mapModel);
  },
  async listarPublicados(): Promise<ModeloInspecaoPublicado[]> {
    const models = (await apiClient.get<ApiModel[]>(`${base}/publicados`)).data;
    return models.filter((model) => model.status === 'PUBLICADO').map((model) => ({ versaoId: model.id, modeloId: model.id, titulo: model.titulo, categoria: model.categoria, versao: model.versao }));
  },
};

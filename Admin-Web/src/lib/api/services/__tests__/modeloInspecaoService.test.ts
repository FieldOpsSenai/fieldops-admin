import apiClient from '../../axios';
import { modeloInspecaoService } from '../modeloInspecaoService';
import type { TemplateSection } from '@/types';

jest.mock('../../axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const item = {
  id: 21, title: 'Pressão', responseType: 'NUMBER', description: 'Em bar', required: true,
  observationRequiredOnFailure: false, evidenceRequiredOnFailure: true, optionsJson: [], displayOrder: 1,
};
const detail = {
  id: 1, title: 'Compressor', category: 'Mecânica', description: '', status: 'DRAFT', version: 1,
  createdAt: '2026-11-07', updatedAt: '2026-11-07',
  sections: [{ id: 11, title: 'Motor', description: 'Cuidados', displayOrder: 1, items: [item] }],
};
const sections = (): TemplateSection[] => [{
  id: '11', title: 'Motor revisado', order: 1, items: [{
    id: '21', label: 'Pressão revisada', responseType: 'NUMERIC', required: true,
    allowObservation: false, requireEvidenceOnNonConformity: true, order: 1,
  }],
}];
const draft = () => ({ title: 'Novo título', description: 'Descrição', category: 'Mecânica', sections: sections() });

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(apiClient.get).mockResolvedValue({ data: detail });
  jest.mocked(apiClient.put).mockResolvedValue({ data: {} });
});

it('persists draft metadata, sections and items using their existing IDs', async () => {
  await modeloInspecaoService.salvarRascunho('1', draft());
  expect(apiClient.put).toHaveBeenCalledWith('/inspection-templates/1', {
    title: 'Novo título', description: 'Descrição', category: 'Mecânica',
  });
  expect(apiClient.put).toHaveBeenCalledWith('/inspection-templates/1/sections/11', {
    title: 'Motor revisado', description: 'Cuidados', displayOrder: 1,
  });
  expect(apiClient.put).toHaveBeenCalledWith('/inspection-templates/1/sections/11/items/21', expect.objectContaining({
    title: 'Pressão revisada', description: 'Em bar', responseType: 'NUMBER', required: true,
    evidenceRequiredOnFailure: true,
  }));
  expect(apiClient.post).not.toHaveBeenCalled();
});

it('rejects writes to published templates before any mutation', async () => {
  jest.mocked(apiClient.get).mockResolvedValue({ data: { ...detail, status: 'ACTIVE' } });
  await expect(modeloInspecaoService.salvarRascunho('1', draft())).rejects.toThrow('imutáveis');
  expect(apiClient.put).not.toHaveBeenCalled();
});

it('retains confirmed IDs after a partial save so retry updates instead of duplicating', async () => {
  const data = draft();
  data.sections[0].id = 'local-section';
  data.sections[0].items[0].id = 'local-item';
  jest.mocked(apiClient.get).mockResolvedValue({ data: { ...detail, sections: [] } });
  jest.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 12 } }).mockRejectedValueOnce(new Error('offline'));
  await expect(modeloInspecaoService.salvarRascunho('1', data)).rejects.toThrow('offline');
  expect(data.sections[0].id).toBe('12');
  jest.mocked(apiClient.get).mockResolvedValue({ data: { ...detail, sections: [{ ...detail.sections[0], id: 12, items: [] }] } });
  jest.mocked(apiClient.post).mockResolvedValueOnce({ data: { ...item, id: 22 } });
  await modeloInspecaoService.salvarRascunho('1', data);
  expect(apiClient.post).toHaveBeenCalledTimes(3);
  expect(apiClient.put).toHaveBeenCalledWith('/inspection-templates/1/sections/12', expect.any(Object));
  expect(data.sections[0].items[0].id).toBe('22');
});

it('rejects unsupported persisted item removal before changing metadata', async () => {
  const data = draft();
  data.sections[0].items = [];
  await expect(modeloInspecaoService.salvarRascunho('1', data)).rejects.toThrow('exclusão de itens');
  expect(apiClient.put).not.toHaveBeenCalled();
});

it('preserves long text response types and descriptions on an unrelated edit', async () => {
  const data = draft();
  data.sections[0].items[0].responseType = 'LONG_TEXT';
  jest.mocked(apiClient.get).mockResolvedValue({ data: {
    ...detail, sections: [{ ...detail.sections[0], items: [{ ...item, responseType: 'TEXT_LONG' }] }],
  } });
  await modeloInspecaoService.salvarRascunho('1', data);
  expect(apiClient.put).toHaveBeenLastCalledWith('/inspection-templates/1/sections/11/items/21', expect.objectContaining({ responseType: 'TEXT_LONG' }));
});

it('does not report success when an update fails', async () => {
  jest.mocked(apiClient.put).mockRejectedValueOnce(new Error('Título inválido'));
  await expect(modeloInspecaoService.salvarRascunho('1', draft())).rejects.toThrow('Título inválido');
  expect(apiClient.post).not.toHaveBeenCalled();
  expect(apiClient.delete).not.toHaveBeenCalled();
});

it('loads sections and items in their persisted display order', async () => {
  jest.mocked(apiClient.get).mockResolvedValue({ data: { ...detail, sections: [
    { ...detail.sections[0], id: 12, displayOrder: 2 },
    { ...detail.sections[0], id: 11, displayOrder: 1, items: [{ ...item, id: 22, displayOrder: 2 }, item] },
  ] } });
  const result = await modeloInspecaoService.buscarPorId('1');
  expect(result.sections.map((section) => section.id)).toEqual(['11', '12']);
  expect(result.sections[0].items.map((entry) => entry.id)).toEqual(['21', '22']);
});

it('deletes removed sections only after all remaining edits succeed', async () => {
  jest.mocked(apiClient.get).mockResolvedValue({ data: { ...detail, sections: [
    detail.sections[0], { ...detail.sections[0], id: 12, displayOrder: 2 },
  ] } });
  await modeloInspecaoService.salvarRascunho('1', draft());
  expect(apiClient.delete).toHaveBeenCalledWith('/inspection-templates/1/sections/12');
  expect(jest.mocked(apiClient.delete).mock.invocationCallOrder[0]).toBeGreaterThan(jest.mocked(apiClient.put).mock.invocationCallOrder.at(-1)!);
});

it('rejects blank section names without sending writes', async () => {
  const data = draft(); data.sections[0].title = '  ';
  await expect(modeloInspecaoService.salvarRascunho('1', data)).rejects.toThrow('nome');
  expect(apiClient.put).not.toHaveBeenCalled();
});

it.each([
  ['TEXT', 'TEXT_SHORT'], ['LONG_TEXT', 'TEXT_LONG'], ['YES_NO', 'BOOLEAN'],
  ['BOOLEAN', 'CONFORMITY'], ['NUMERIC', 'NUMBER'], ['DATE', 'DATE'], ['SINGLE_SELECT', 'SINGLE_CHOICE'],
] as const)('persists %s as %s and restores the same type', async (uiType, apiType) => {
  const data = draft();
  data.sections[0].items[0].responseType = uiType;
  data.sections[0].items[0].options = [{ id: 'a', label: 'Sim', order: 1 }, { id: 'b', label: 'Não', order: 2 }];
  jest.mocked(apiClient.get).mockResolvedValue({ data: {
    ...detail, sections: [{ ...detail.sections[0], items: [{ ...item, responseType: apiType }] }],
  } });
  const result = await modeloInspecaoService.salvarRascunho('1', data);
  expect(apiClient.put).toHaveBeenLastCalledWith('/inspection-templates/1/sections/11/items/21', expect.objectContaining({
    responseType: apiType, optionsJson: uiType === 'SINGLE_SELECT' ? ['Sim', 'Não'] : [],
  }));
  expect(result.sections[0].items[0].responseType).toBe(uiType);
});

it.each([['Sim', ' sim '], ['Sim', ''], ['Única']])('rejects invalid choice options %j before writes', async (...labels) => {
  const data = draft();
  data.sections[0].items[0].responseType = 'SINGLE_SELECT';
  data.sections[0].items[0].options = labels.map((label, order) => ({ label, id: String(order), order }));
  await expect(modeloInspecaoService.salvarRascunho('1', data)).rejects.toThrow('opções');
  expect(apiClient.put).not.toHaveBeenCalled();
});

it.each([true, false])('persists and reloads independent evidence rules set to %s', async (enabled) => {
  const data = draft();
  Object.assign(data.sections[0].items[0], { required: enabled, allowObservation: !enabled, requireEvidenceOnNonConformity: enabled });
  jest.mocked(apiClient.get).mockResolvedValue({ data: { ...detail, sections: [{ ...detail.sections[0], items: [{
    ...item, required: enabled, observationRequiredOnFailure: !enabled, evidenceRequiredOnFailure: enabled,
  }] }] } });
  const saved = await modeloInspecaoService.salvarRascunho('1', data);
  expect(apiClient.put).toHaveBeenLastCalledWith('/inspection-templates/1/sections/11/items/21', expect.objectContaining({
    required: enabled, observationRequiredOnFailure: !enabled, evidenceRequiredOnFailure: enabled,
  }));
  expect(saved.sections[0].items[0]).toMatchObject({ required: enabled, allowObservation: !enabled, requireEvidenceOnNonConformity: enabled });
});

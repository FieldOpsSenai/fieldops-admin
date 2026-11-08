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
  data.sections[0].items[0].responseType = 'TEXT';
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

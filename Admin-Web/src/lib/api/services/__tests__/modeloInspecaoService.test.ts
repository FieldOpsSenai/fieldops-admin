import apiClient from '../../axios';
import { modeloInspecaoService } from '../modeloInspecaoService';
import type { TemplateSection } from '@/types';
jest.mock('../../axios', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() } }));
const item = { id: 21, descricao: 'Há vazamento?', tipoResposta: 'BOOLEAN', ordem: 1, obrigatorio: true, critico: true, evidenciaObrigatoria: true };
const model = { id: 1, titulo: 'Compressor', categoria: 'Mecânica', versao: 1, status: 'RASCUNHO', dataCriacao: '2026-11-13T12:00:00', secoes: [{ id: 11, titulo: 'Motor', ordem: 1, itens: [item] }] };
const sections = (): TemplateSection[] => [{ id: '11', title: 'Motor', order: 1, items: [{ id: '21', label: item.descricao, responseType: 'YES_NO', required: true, critical: true, allowObservation: false, requireEvidenceOnNonConformity: true, order: 1 }] }];
const draft = () => ({ title: 'Revisado', description: '', category: 'Mecânica', sections: sections() });
beforeEach(() => { jest.resetAllMocks(); jest.mocked(apiClient.get).mockResolvedValue({ data: model }); jest.mocked(apiClient.put).mockResolvedValue({ data: {} }); });

it('persiste edição e regras sem remover a marcação de item crítico', async () => {
  const result = await modeloInspecaoService.salvarRascunho('1', draft());
  expect(apiClient.put).toHaveBeenCalledWith('/modelos-inspecao/1', { titulo: 'Revisado', categoria: 'Mecânica' });
  expect(apiClient.put).toHaveBeenCalledWith('/modelos-inspecao/itens/21', expect.objectContaining({ tipoResposta: 'BOOLEAN', obrigatorio: true, critico: true, evidenciaObrigatoria: true }));
  expect(result.sections[0].items[0]).toMatchObject({ responseType: 'YES_NO', critical: true });
});
it('recusa alterações em modelo publicado', async () => {
  jest.mocked(apiClient.get).mockResolvedValue({ data: { ...model, status: 'PUBLICADO' } });
  await expect(modeloInspecaoService.salvarRascunho('1', draft())).rejects.toThrow('imutáveis');
  expect(apiClient.put).not.toHaveBeenCalled();
});
it('exclui itens removidos somente após atualizações confirmadas', async () => {
  const data = draft(); data.sections[0].items = [];
  await modeloInspecaoService.salvarRascunho('1', data);
  expect(apiClient.delete).toHaveBeenCalledWith('/modelos-inspecao/itens/21');
  expect(jest.mocked(apiClient.delete).mock.invocationCallOrder[0]).toBeGreaterThan(jest.mocked(apiClient.put).mock.invocationCallOrder.at(-1)!);
});
it('impede salvar descrição ou opções que a API não suporta', async () => {
  await expect(modeloInspecaoService.salvarRascunho('1', { ...draft(), description: 'Não suportado' })).rejects.toThrow('descrição');
  const data = draft(); data.sections[0].items[0].responseType = 'SINGLE_SELECT';
  data.sections[0].items[0].options = [{ id: 'a', label: 'Sim', order: 1 }, { id: 'b', label: 'Não', order: 2 }];
  await expect(modeloInspecaoService.salvarRascunho('1', data)).rejects.toThrow('opções de seleção');
  expect(apiClient.put).not.toHaveBeenCalled();
});
it('publica e exclui nos endpoints da API main', async () => {
  jest.mocked(apiClient.patch).mockResolvedValue({ data: { ...model, status: 'PUBLICADO' } });
  expect((await modeloInspecaoService.publicar('1')).status).toBe('PUBLICADO');
  await modeloInspecaoService.excluir('1');
  expect(apiClient.patch).toHaveBeenCalledWith('/modelos-inspecao/1/publicar');
  expect(apiClient.delete).toHaveBeenCalledWith('/modelos-inspecao/1');
});
it('usa o identificador do modelo publicado ao agendar', async () => {
  jest.mocked(apiClient.get).mockResolvedValue({ data: [{ ...model, status: 'PUBLICADO', versao: 2 }] });
  expect(await modeloInspecaoService.listarPublicados()).toEqual([{ versaoId: 1, modeloId: 1, titulo: 'Compressor', categoria: 'Mecânica', versao: 2 }]);
});
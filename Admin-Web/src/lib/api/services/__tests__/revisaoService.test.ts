import apiClient from '../../axios';
import { revisaoService } from '../revisaoService';

jest.mock('../../axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn() },
}));
beforeEach(() => jest.resetAllMocks());

it('envia reprovação com o contrato português e motivo sem espaços extras', async () => {
  jest.mocked(apiClient.patch).mockResolvedValue({ data: { id: 42, status: 'EM_ANDAMENTO' } });
  await revisaoService.revisar(42, {
    supervisorId: 8,
    aprovado: false,
    motivoReprovacao: ' Corrigir vazamento ',
  });
  expect(apiClient.patch).toHaveBeenCalledWith('/inspecoes/42/revisar', {
    supervisorId: 8,
    aprovado: false,
    motivoReprovacao: 'Corrigir vazamento',
  });
});

it.each(['', '   ', 'a'.repeat(256)])('não envia justificativa inválida', async (reason) => {
  await expect(
    revisaoService.revisar(42, { supervisorId: 8, aprovado: false, motivoReprovacao: reason }),
  ).rejects.toThrow();
  expect(apiClient.patch).not.toHaveBeenCalled();
});

it('não envia motivo de reprovação em uma aprovação', async () => {
  jest.mocked(apiClient.patch).mockResolvedValue({ data: { id: 42, status: 'CONCLUIDA' } });
  await revisaoService.revisar(42, {
    supervisorId: 8,
    aprovado: true,
    motivoReprovacao: 'Motivo antigo',
  });
  expect(apiClient.patch).toHaveBeenCalledWith('/inspecoes/42/revisar', {
    supervisorId: 8,
    aprovado: true,
  });
});

it('não interpreta resposta incompatível como confirmação', async () => {
  jest.mocked(apiClient.patch).mockResolvedValue({ data: { id: 42, status: 'CONCLUIDA' } });
  await expect(
    revisaoService.revisar(42, { supervisorId: 8, aprovado: false, motivoReprovacao: 'Corrigir' }),
  ).rejects.toThrow('não confirmou');
});

it('rejeita dados de outra inspeção', async () => {
  jest.mocked(apiClient.get).mockResolvedValue({ data: [{ id: 1, inspecaoId: 99 }] });
  await expect(revisaoService.respostas(42)).rejects.toThrow('incompatíveis');
  await expect(revisaoService.evidencias(42)).rejects.toThrow('incompatíveis');
});

it('consulta somente os endpoints disponíveis, com cancelamento de requisição', async () => {
  const signal = new AbortController().signal;
  jest.mocked(apiClient.get).mockResolvedValue({ data: [] });
  await revisaoService.snapshot(42, signal);
  await revisaoService.respostas(42, signal);
  await revisaoService.evidencias(42, signal);
  expect(jest.mocked(apiClient.get).mock.calls).toEqual([
    ['/inspecoes/42/snapshot', { signal }],
    ['/inspecoes/42/respostas', { signal }],
    ['/inspecoes/42/fotos', { signal }],
  ]);
});

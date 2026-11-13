import apiClient from '../../axios';
import { inspecaoService, type InspecaoRequest } from '../inspecaoService';

jest.mock('../../axios', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));
const request: InspecaoRequest = {
  descricao: 'Inspeção de teste', clienteId: 1, localId: 2, equipamentoId: 3, usuarioId: 4,
  templateVersionId: 89, dataAgendada: '2030-01-02T14:30:00', prioridade: 'HIGH', observacoes: 'Verificar pressão',
};
beforeEach(() => jest.resetAllMocks());

it('schedules using the selected version ID and the ID confirmed by the API', async () => {
  jest.mocked(apiClient.post).mockResolvedValue({ data: { id: 77, descricao: request.descricao, status: 'AGENDADA' } });
  const result = await inspecaoService.criar(request);
  expect(apiClient.post).toHaveBeenCalledWith('/inspecoes', {
    descricao: request.descricao, modeloId: 89, clienteId: 1, localId: 2, equipamentoId: 3, usuarioId: 4,
    prioridade: 'ALTA', dataAgendada: '2030-01-02T14:30:00', dataLimite: '2030-01-02T14:30:00', instrucoes: 'Verificar pressão',
  });
  expect(result.id).toBe(77);
});

it('does not schedule without a published version', async () => {
  await expect(inspecaoService.criar({ ...request, templateVersionId: undefined })).rejects.toThrow('versão publicada');
  expect(apiClient.post).not.toHaveBeenCalled();
});

it.each([
  [{ dataAgendada: '2000-01-01T12:00:00' }, 'prazo futuro'],
  [{ dataAgendada: 'inválida' }, 'prazo futuro'],
  [{ descricao: ' ' }, 'título'],
  [{ observacoes: 'a'.repeat(2001) }, 'instruções'],
])('rejects invalid scheduling information before contacting the API', async (changes, message) => {
  await expect(inspecaoService.criar({ ...request, ...changes })).rejects.toThrow(message);
  expect(apiClient.post).not.toHaveBeenCalled();
});

it('sends the trimmed cancellation reason and returns the inspection from the API', async () => {
  const result = { id: 77, status: 'CANCELADA' };
  jest.mocked(apiClient.patch).mockResolvedValue({ data: result });
  await expect(inspecaoService.cancelar(77, ' Cliente solicitou cancelamento ')).resolves.toEqual(result);
  expect(apiClient.patch).toHaveBeenCalledWith('/inspecoes/77/cancelar', { motivo: 'Cliente solicitou cancelamento' });
});

it('rejects cancellation without a reason', async () => {
  await expect(inspecaoService.cancelar(77, '  ')).rejects.toThrow('motivo');
  expect(apiClient.patch).not.toHaveBeenCalled();
});

it('consulta paginação e filtros de inspeção usando o contrato da API main', async () => {
  jest.mocked(apiClient.get).mockResolvedValue({ data: { content: [{ id: 7, descricao: 'Inspeção', status: 'AGENDADA', dataAgendada: '2030-01-01T12:00:00', clienteNome: 'Cliente', usuarioNome: 'Técnico', prioridade: 'URGENTE' }], number: 0, size: 10, totalPages: 1, totalElements: 1 } });
  const result = await inspecaoService.listarPagina({ page: 0, size: 10, status: 'ASSIGNED', clientName: '2', technicianName: '3', priority: 'CRITICAL' });
  expect(apiClient.get).toHaveBeenCalledWith('/inspecoes', { params: { page: 0, size: 10, termo: '%', status: 'AGENDADA', usuarioId: 3, clienteId: 2, prioridade: 'URGENTE' }, signal: undefined });
  expect(result.content[0]).toMatchObject({ id: 7, title: 'Inspeção', status: 'ASSIGNED', clientName: 'Cliente', priority: 'CRITICAL' });
});

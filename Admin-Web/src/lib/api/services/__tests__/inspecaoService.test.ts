import apiClient from '../../axios';
import { inspecaoService, type InspecaoRequest } from '../inspecaoService';

jest.mock('../../axios', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
const request: InspecaoRequest = {
  descricao: 'Inspeção de teste', clienteId: 1, localId: 2, equipamentoId: 3, usuarioId: 4,
  templateVersionId: 89, dataAgendada: '2030-01-02T14:30:00', prioridade: 'HIGH', observacoes: 'Verificar pressão',
};
beforeEach(() => jest.resetAllMocks());

it('schedules using the selected version ID and the ID confirmed by the API', async () => {
  jest.mocked(apiClient.post).mockResolvedValue({ data: { id: 77, title: request.descricao, status: 'ASSIGNED' } });
  const result = await inspecaoService.criar(request);
  expect(apiClient.post).toHaveBeenCalledWith('/inspections', {
    title: request.descricao, templateVersionId: 89, clientId: 1, siteId: 2, equipmentId: 3, technicianId: 4,
    priority: 'HIGH', dueDate: '2030-01-02', dueTime: '14:30:00', supervisorInstructions: 'Verificar pressão',
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

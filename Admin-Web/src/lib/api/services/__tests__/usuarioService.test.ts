import apiClient from '../../axios';
import { usuarioService } from '../usuarioService';

jest.mock('../../axios', () => ({ __esModule: true, default: { get: jest.fn() } }));

it('loads all pages of active technicians and rejects other roles or inactive accounts', async () => {
  const technician = { id: 1, name: 'Técnico', email: 'tecnico@example.test', role: 'TECHNICIAN', status: 'ACTIVE' };
  jest.mocked(apiClient.get).mockResolvedValueOnce({ data: {
    content: [technician, { ...technician, id: 2, status: 'INACTIVE' }, { ...technician, id: 3, role: 'SUPERVISOR' }],
    number: 0, size: 3, totalPages: 2, totalElements: 4,
  } }).mockResolvedValueOnce({ data: {
    content: [{ ...technician, id: 4 }], number: 1, size: 3, totalPages: 2, totalElements: 4,
  } });
  expect((await usuarioService.listarTecnicosAtivos()).map((user) => user.id)).toEqual([1, 4]);
  expect(apiClient.get).toHaveBeenLastCalledWith('/users', { params: { role: 'TECHNICIAN', status: 'ACTIVE', page: 1, size: 100 } });
});

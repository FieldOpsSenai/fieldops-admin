import apiClient from '../../axios';
import { usuarioService } from '../usuarioService';

jest.mock('../../axios', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn() } }));
beforeEach(() => jest.resetAllMocks());
const technician = { id: 1, nome: 'Técnico', email: 'tecnico@example.test', perfil: 'TECNICO', ativo: true } as const;

it('consulta técnicos ativos pelo endpoint disponível ao supervisor', async () => {
  jest.mocked(apiClient.get).mockResolvedValue({ data: [technician, { ...technician, id: 2, ativo: false }, { ...technician, id: 3, perfil: 'SUPERVISOR' }] });
  expect(await usuarioService.listarTecnicosAtivos()).toEqual([technician]);
  expect(apiClient.get).toHaveBeenCalledWith('/inspecoes/tecnicos-disponiveis');
});

it('envia os dados de criação e edição conforme o contrato da API main', async () => {
  jest.mocked(apiClient.post).mockResolvedValue({ data: technician });
  jest.mocked(apiClient.put).mockResolvedValue({ data: technician });
  const data = { nome: 'Técnico', email: 'tecnico@example.test', senha: 'senha123', perfil: 'TECNICO' } as const;
  await usuarioService.cadastrar(data);
  expect(apiClient.post).toHaveBeenCalledWith('/usuarios', data);
  await usuarioService.atualizar(1, { nome: ' Técnico ', email: ' tecnico@example.test ', perfil: 'TECNICO' });
  expect(apiClient.put).toHaveBeenCalledWith('/usuarios/1', { nome: 'Técnico', email: 'tecnico@example.test', perfil: 'TECNICO' });
  await usuarioService.inativar(1);
  expect(apiClient.patch).toHaveBeenCalledWith('/usuarios/1/inativar');
});
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import NewInspectionPage from './page';
import { clienteService, localService, equipamentoService, usuarioService, modeloInspecaoService, inspecaoService } from '@/lib/api/services';

const mockPush = jest.fn();
const mockRouter = { push: mockPush, replace: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));
jest.mock('@/components/layout/TopHeader', () => ({ __esModule: true, default: () => null }));
jest.mock('@/stores/sessionStore', () => ({ useSessionStore: () => ({ session: { profile: 'SUPERVISOR' } }) }));
jest.mock('@/lib/api/services', () => ({
  clienteService: { listar: jest.fn() }, localService: { listarPorCliente: jest.fn() },
  equipamentoService: { listarPorLocal: jest.fn() }, usuarioService: { listarPorPerfil: jest.fn() },
  modeloInspecaoService: { listarPublicados: jest.fn() }, inspecaoService: { criar: jest.fn() },
}));
const client = { id: 1, nome: 'Cliente A', ativo: true };
const site = { id: 2, nome: 'Local A', clienteId: 1, ativo: true };
const equipment = { id: 3, nome: 'Equipamento A', localId: 2, ativo: true };
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(clienteService.listar).mockResolvedValue([client] as never);
  jest.mocked(localService.listarPorCliente).mockResolvedValue([site] as never);
  jest.mocked(equipamentoService.listarPorLocal).mockResolvedValue([equipment] as never);
  jest.mocked(usuarioService.listarPorPerfil).mockResolvedValue([{ id: 4, nome: 'Técnico A', email: 'tecnico@example.test', ativo: true, perfil: 'TECNICO' }] as never);
  jest.mocked(modeloInspecaoService.listarPublicados).mockResolvedValue([{ versaoId: 89, modeloId: 8, titulo: 'Modelo publicado', categoria: 'Mecânica', versao: 2 }]);
  jest.mocked(inspecaoService.criar).mockResolvedValue({ id: 77 } as never);
});

async function fillForm() {
  await screen.findByLabelText('Cliente');
  fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: '1' } });
  await screen.findByRole('option', { name: /Local A/ });
  fireEvent.change(screen.getByLabelText('Local'), { target: { value: '2' } });
  await screen.findByRole('option', { name: /Equipamento A/ });
  fireEvent.change(screen.getByLabelText('Equipamento'), { target: { value: '3' } });
  fireEvent.change(screen.getByLabelText('Técnico'), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText('Versão publicada'), { target: { value: '89' } });
  fireEvent.change(screen.getByLabelText('Título da inspeção'), { target: { value: 'Inspeção agendada' } });
}

it('submits a selected published version and navigates using the confirmed inspection ID', async () => {
  render(<NewInspectionPage />);
  await fillForm();
  fireEvent.click(screen.getByRole('button', { name: 'Agendar Inspeção' }));
  await waitFor(() => expect(inspecaoService.criar).toHaveBeenCalledWith(expect.objectContaining({ templateVersionId: 89, clienteId: 1, localId: 2, equipamentoId: 3, usuarioId: 4 })));
  expect(mockPush).toHaveBeenCalledWith('/inspections?created=true&inspectionId=77');
});

it('prevents repeated submission while creation is pending', async () => {
  let finish!: (value: never) => void;
  jest.mocked(inspecaoService.criar).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  render(<NewInspectionPage />);
  await fillForm();
  const button = screen.getByRole('button', { name: 'Agendar Inspeção' });
  fireEvent.click(button); fireEvent.click(button);
  expect(inspecaoService.criar).toHaveBeenCalledTimes(1);
  await act(async () => finish({ id: 77 } as never));
});

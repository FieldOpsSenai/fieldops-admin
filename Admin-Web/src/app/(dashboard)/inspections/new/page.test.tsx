import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import NewInspectionPage from './page';
import { clienteService, localService, equipamentoService, usuarioService, modeloInspecaoService, inspecaoService } from '@/lib/api/services';

const mockPush = jest.fn();
const mockRouter = { push: mockPush, replace: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));
jest.mock('@/components/layout/TopHeader', () => ({ __esModule: true, default: () => null }));
jest.mock('@/stores/sessionStore', () => ({ useSessionStore: () => ({ session: { profile: 'SUPERVISOR' } }) }));
jest.mock('@/lib/api/services', () => ({
  clienteService: { listarPagina: jest.fn() }, localService: { listarPagina: jest.fn() },
  equipamentoService: { listarPagina: jest.fn() }, usuarioService: { listarPorPerfil: jest.fn() },
  modeloInspecaoService: { listarPublicados: jest.fn() }, inspecaoService: { criar: jest.fn() },
}));
const client = { id: 1, nome: 'Cliente A', ativo: true };
const site = { id: 2, nome: 'Local A', clienteId: 1, ativo: true };
const equipment = { id: 3, nome: 'Equipamento A', localId: 2, ativo: true };
function pageOf<T>(content: T[]) { return { content, number: 0, size: 100, totalElements: content.length, totalPages: 1 }; }

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(clienteService.listarPagina).mockResolvedValue(pageOf([client]) as never);
  jest.mocked(localService.listarPagina).mockResolvedValue(pageOf([site]) as never);
  jest.mocked(equipamentoService.listarPagina).mockResolvedValue(pageOf([equipment]) as never);
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

it('ignores late responses from a previously selected client', async () => {
  let resolveOld!: (value: never) => void;
  jest.mocked(clienteService.listarPagina).mockResolvedValue(pageOf([client, { ...client, id: 5, nome: 'Cliente B' }]) as never);
  jest.mocked(localService.listarPagina)
    .mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve; }))
    .mockResolvedValueOnce(pageOf([{ ...site, id: 6, clienteId: 5, nome: 'Local B' }]) as never);
  render(<NewInspectionPage />);
  fireEvent.change(await screen.findByLabelText('Cliente'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: '5' } });
  await screen.findByRole('option', { name: /Local B/ });
  await act(async () => resolveOld(pageOf([site]) as never));
  expect(screen.queryByRole('option', { name: /Local A/ })).not.toBeInTheDocument();
  expect(screen.getByRole('option', { name: /Local B/ })).toBeInTheDocument();
  expect(screen.getByLabelText('Equipamento')).toHaveValue('');
});

it('clears dependent selections when changing the client and filters incompatible equipment', async () => {
  jest.mocked(equipamentoService.listarPagina).mockResolvedValue(pageOf([equipment, { ...equipment, id: 9, localId: 99, nome: 'Outro local' }]) as never);
  render(<NewInspectionPage />);
  await fillForm();
  expect(screen.queryByRole('option', { name: /Outro local/ })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: '' } });
  expect(screen.getByLabelText('Local')).toHaveValue('');
  expect(screen.getByLabelText('Equipamento')).toHaveValue('');
  expect(screen.getByLabelText('Local')).toBeDisabled();
});

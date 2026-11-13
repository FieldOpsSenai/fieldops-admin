import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InspectionsPage from './page';
import { clienteService, inspecaoService, usuarioService } from '@/lib/api/services';

jest.mock('@/components/layout/TopHeader', () => ({ __esModule: true, default: () => null }));
jest.mock('@/lib/api/services', () => ({ clienteService: { listar: jest.fn() }, usuarioService: { listarTecnicosAtivos: jest.fn() }, inspecaoService: { listarPagina: jest.fn(), cancelar: jest.fn(), atualizarPlanejamento: jest.fn() } }));
const inspection = { id: 42, title: 'Verificação', clientName: 'Cliente A', siteName: 'Local A', equipmentName: 'Motor', technicianName: 'Ana', priority: 'HIGH', dueDate: '2030-01-01', status: 'ASSIGNED' };
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(clienteService.listar).mockResolvedValue([{ id: 1, nome: 'Cliente A' }] as never);
  jest.mocked(usuarioService.listarTecnicosAtivos).mockResolvedValue([{ id: 4, nome: 'Ana' }] as never);
  jest.mocked(inspecaoService.listarPagina).mockResolvedValue({ content: [inspection], number: 0, size: 10, totalElements: 22, totalPages: 3 } as never);
});

it('sends combined filters to the API and resets the page', async () => {
  render(<InspectionsPage />);
  await screen.findByText(/#42/);
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
  await waitFor(() => expect(inspecaoService.listarPagina).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }), expect.any(AbortSignal)));
  await screen.findByRole('option', { name: 'Cliente A' });
  fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('Técnico'), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'IN_PROGRESS' } });
  fireEvent.change(screen.getByLabelText('Prioridade'), { target: { value: 'HIGH' } });
  await waitFor(() => expect(inspecaoService.listarPagina).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, clientName: '1', technicianName: '4', status: 'IN_PROGRESS', priority: 'HIGH' }), expect.any(AbortSignal)));
});

it('shows a failed request instead of an empty list', async () => {
  jest.mocked(inspecaoService.listarPagina).mockRejectedValue(new Error('Sem conexão'));
  render(<InspectionsPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Sem conexão');
  expect(screen.queryByText(/Nenhuma inspeção encontrada/)).not.toBeInTheDocument();
});

it('allows filtering by ID when lookup data cannot be loaded', async () => {
  jest.mocked(clienteService.listar).mockRejectedValue(new Error('Indisponível'));
  render(<InspectionsPage />);
  expect(await screen.findByText(/use o ID/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: '5' } });
  await waitFor(() => expect(inspecaoService.listarPagina).toHaveBeenLastCalledWith(expect.objectContaining({ clientName: '5' }), expect.any(AbortSignal)));
});

it('confirms a reason and refreshes after successful cancellation', async () => {
  jest.mocked(inspecaoService.cancelar).mockResolvedValue({ id: 42, status: 'CANCELED' } as never);
  render(<InspectionsPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
  fireEvent.change(screen.getByLabelText('Motivo do cancelamento'), { target: { value: 'Cliente pediu reagendamento' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));
  await waitFor(() => expect(inspecaoService.cancelar).toHaveBeenCalledWith(42, 'Cliente pediu reagendamento'));
  await waitFor(() => expect(inspecaoService.listarPagina).toHaveBeenCalledTimes(2));
});

it('edits priority, deadline and instructions through the API', async () => {
  jest.mocked(inspecaoService.atualizarPlanejamento).mockResolvedValue({ id: 42 } as never);
  render(<InspectionsPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Editar planejamento' }));
  fireEvent.change(screen.getByLabelText('Prazo limite'), { target: { value: '2031-02-01T15:30' } });
  fireEvent.change(screen.getByLabelText('Instruções'), { target: { value: 'Usar EPIs' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar planejamento' }));
  await waitFor(() => expect(inspecaoService.atualizarPlanejamento).toHaveBeenCalledWith(42, { priority: 'HIGH', dueDate: '2031-02-01T15:30', instructions: 'Usar EPIs' }));
});


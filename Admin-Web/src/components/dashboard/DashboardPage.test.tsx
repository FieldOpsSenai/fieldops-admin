import { render, screen, within } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import { clienteService, equipamentoService, inspecaoService } from '@/lib/api/services';

jest.mock('@/components/layout/TopHeader', () => ({ __esModule: true, default: () => null }));
jest.mock('@/lib/api/services', () => ({
  clienteService: { listarPagina: jest.fn() }, equipamentoService: { listarPagina: jest.fn() },
  inspecaoService: { listarPagina: jest.fn() },
}));
const page = (totalElements: number, content: unknown[] = []) => ({ content, totalElements, totalPages: 1, number: 0, size: 1 });
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(clienteService.listarPagina).mockResolvedValue(page(12) as never);
  jest.mocked(equipamentoService.listarPagina).mockResolvedValue(page(35) as never);
  jest.mocked(inspecaoService.listarPagina).mockImplementation(async (query) => {
    if (query.sort) return page(1, [{ id: 9, title: 'Inspeção recente', status: 'ASSIGNED' }]) as never;
    const counts = { DRAFT: 3, ASSIGNED: 4, IN_PROGRESS: 5, APPROVED: 10 };
    return page(query.status ? counts[query.status as keyof typeof counts] : 315) as never;
  });
});

it('uses API totals instead of counting only the first page', async () => {
  render(<DashboardPage />);
  expect(await screen.findByText('315')).toBeInTheDocument();
  const metrics = screen.getByRole('region', { name: 'Métricas' });
  expect(within(metrics).getByText('12')).toBeInTheDocument();
  expect(within(metrics).getByText('10')).toBeInTheDocument();
  expect(within(metrics).getByText('35')).toBeInTheDocument();
  expect(screen.getByText('Inspeção recente')).toBeInTheDocument();
});

it('shows unavailable values and an error when a request fails', async () => {
  jest.mocked(equipamentoService.listarPagina).mockRejectedValue(new Error('offline'));
  render(<DashboardPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar todos os dados');
  const card = screen.getByText('Equipamentos ativos').parentElement!;
  expect(within(card).getByText('—')).toBeInTheDocument();
  expect(within(card).queryByText('0')).not.toBeInTheDocument();
});

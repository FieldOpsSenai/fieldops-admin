import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ClientsHierarchyManager from '../ClientsHierarchyManager';
import { clienteService, localService, equipamentoService } from '@/lib/api/services';

jest.mock('@/components/layout/TopHeader', () => ({ __esModule: true, default: () => null }));
jest.mock('@/lib/api/services', () => ({
  clienteService: { listarPagina: jest.fn(), atualizar: jest.fn() },
  localService: { listarPagina: jest.fn() },
  equipamentoService: { listarPagina: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(window, 'alert').mockImplementation(() => undefined);
  (clienteService.listarPagina as jest.Mock).mockResolvedValue({ content: [
    { id: 1, nome: 'Cliente original', cnpj: '12345678000195', email: 'cliente@example.com', telefone: '11999999999', ativo: true },
  ], number: 0, size: 10, totalElements: 11, totalPages: 2 });
  (localService.listarPagina as jest.Mock).mockResolvedValue({ content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 });
  (equipamentoService.listarPagina as jest.Mock).mockResolvedValue({ content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 });
});
afterEach(() => jest.restoreAllMocks());

it('preserva os dados e mantém o formulário aberto quando a API rejeita a edição', async () => {
  (clienteService.atualizar as jest.Mock).mockRejectedValue(new Error('Atualização indisponível'));
  render(<ClientsHierarchyManager />);
  fireEvent.click(await screen.findByTitle('Editar cliente'));
  fireEvent.change(screen.getByDisplayValue('Cliente original'), { target: { value: 'Nome alterado' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Atualização indisponível');
  expect(screen.getByDisplayValue('Nome alterado')).toBeInTheDocument();
  expect(screen.getByText('Cliente original')).toBeInTheDocument();
  expect(screen.queryByText(/atualizado com sucesso/)).not.toBeInTheDocument();
});

it('informa falha no carregamento em vez de apresentar cadastros vazios como sucesso', async () => {
  (clienteService.listarPagina as jest.Mock).mockRejectedValue(new Error('Offline'));
  render(<ClientsHierarchyManager />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Offline');
  expect(screen.queryByText(/Nenhum registro encontrado/)).not.toBeInTheDocument();
});

it('busca páginas na API e reinicia a página ao combinar pesquisa e status', async () => {
  render(<ClientsHierarchyManager />);
  await screen.findByText('Cliente original');
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
  await waitFor(() => expect(clienteService.listarPagina).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, size: 10 }), expect.any(AbortSignal)));
  fireEvent.change(screen.getByLabelText('Pesquisar cadastros'), { target: { value: 'Alpha' } });
  fireEvent.change(screen.getByLabelText('Filtrar status'), { target: { value: 'ACTIVE' } });
  await waitFor(() => expect(clienteService.listarPagina).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, search: 'Alpha', status: 'ACTIVE' }), expect.any(AbortSignal)));
  fireEvent.change(screen.getByLabelText('Registros por página'), { target: { value: '25' } });
  await waitFor(() => expect(clienteService.listarPagina).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, size: 25, search: 'Alpha', status: 'ACTIVE' }), expect.any(AbortSignal)));
  expect(localService.listarPagina).not.toHaveBeenCalled();
  expect(equipamentoService.listarPagina).not.toHaveBeenCalled();
});

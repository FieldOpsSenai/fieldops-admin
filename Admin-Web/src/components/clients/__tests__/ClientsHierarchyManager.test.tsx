import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ClientsHierarchyManager from '../ClientsHierarchyManager';
import { clienteService, localService, equipamentoService } from '@/lib/api/services';

jest.mock('@/components/layout/TopHeader', () => ({ __esModule: true, default: () => null }));
jest.mock('@/lib/api/services', () => ({
  clienteService: { listar: jest.fn(), atualizar: jest.fn() },
  localService: { listarTodos: jest.fn() },
  equipamentoService: { listarTodos: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(window, 'alert').mockImplementation(() => undefined);
  (clienteService.listar as jest.Mock).mockResolvedValue([
    { id: 1, nome: 'Cliente original', cnpj: '12345678000195', email: 'cliente@example.com', telefone: '11999999999', ativo: true },
  ]);
  (localService.listarTodos as jest.Mock).mockResolvedValue([]);
  (equipamentoService.listarTodos as jest.Mock).mockResolvedValue([]);
});
afterEach(() => jest.restoreAllMocks());

it('preserva os dados e mantém o formulário aberto quando a API rejeita a edição', async () => {
  (clienteService.atualizar as jest.Mock).mockRejectedValue(new Error('Atualização indisponível'));
  render(<ClientsHierarchyManager />);
  fireEvent.click(await screen.findByTitle('Editar cliente'));
  fireEvent.change(screen.getByDisplayValue('Cliente original'), { target: { value: 'Nome alterado' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Falha ao salvar cliente: Atualização indisponível'));
  expect(screen.getByDisplayValue('Nome alterado')).toBeInTheDocument();
  expect(screen.getByText('Cliente original')).toBeInTheDocument();
  expect(screen.queryByText(/atualizado com sucesso/)).not.toBeInTheDocument();
});

it('informa falha parcial no carregamento em vez de apresentar cadastros vazios como sucesso', async () => {
  (localService.listarTodos as jest.Mock).mockRejectedValue(new Error('Offline'));
  render(<ClientsHierarchyManager />);
  expect(await screen.findByText(/Não foi possível carregar todos os cadastros/)).toBeInTheDocument();
  expect(screen.getByText('Cliente original')).toBeInTheDocument();
});

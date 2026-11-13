import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import UsersPage from './page';
import { usuarioService } from '@/lib/api/services';

let mockProfile = 'ADMINISTRADOR';
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/components/layout/TopHeader', () => ({ __esModule: true, default: () => null }));
jest.mock('@/stores/sessionStore', () => ({ useSessionStore: () => ({ session: { profile: mockProfile } }) }));
jest.mock('@/lib/api/services', () => ({ usuarioService: { listarTodos: jest.fn(), atualizar: jest.fn(), cadastrar: jest.fn(), inativar: jest.fn() } }));
const usuario = { id: 2, nome: 'Técnico Silva', email: 'silva@example.com', perfil: 'TECNICO', ativo: true };
beforeEach(() => {
  jest.clearAllMocks(); mockProfile = 'ADMINISTRADOR';
  (usuarioService.listarTodos as jest.Mock).mockResolvedValue([usuario]);
});

it('edita usuário sem exigir uma nova senha', async () => {
  (usuarioService.atualizar as jest.Mock).mockResolvedValue({ ...usuario, nome: 'Silva Atualizado' });
  render(<UsersPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Editar Técnico Silva' }));
  fireEvent.change(screen.getByLabelText('Nome completo *'), { target: { value: 'Silva Atualizado' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  await waitFor(() => expect(usuarioService.atualizar).toHaveBeenCalledWith(2, { nome: 'Silva Atualizado', email: usuario.email, senha: '', perfil: 'TECNICO' }));
  expect(await screen.findByText('Silva Atualizado')).toBeInTheDocument();
});

it('mantém o formulário aberto quando a API rejeita e-mail duplicado', async () => {
  (usuarioService.atualizar as jest.Mock).mockRejectedValue(new Error('E-mail já cadastrado.'));
  render(<UsersPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Editar Técnico Silva' }));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('E-mail já cadastrado.');
  expect(screen.getByLabelText('E-mail *')).toHaveValue(usuario.email);
});

it('redireciona supervisor sem consultar endpoint restrito a administradores', async () => {
  mockProfile = 'SUPERVISOR';
  render(<UsersPage />);
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/forbidden'));
  expect(usuarioService.listarTodos).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Novo usuário' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Editar|Inativar/ })).not.toBeInTheDocument();
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TemplatesPage from './page';
import { modeloInspecaoService } from '@/lib/api/services';
import { deserialize, serialize } from 'node:v8';

beforeAll(() => { global.structuredClone = (value) => deserialize(serialize(value)); });

jest.mock('@/components/layout/TopHeader', () => ({ __esModule: true, default: () => null }));
jest.mock('@/lib/api/services', () => ({ modeloInspecaoService: {
  listarTodos: jest.fn(), criarRascunho: jest.fn(), salvarRascunho: jest.fn(), publicar: jest.fn(),
} }));
const template = {
  id: '1', title: 'Modelo salvo', description: '', category: 'Mecânica & Fluidos', status: 'RASCUNHO',
  version: 1, createdAt: '2026-11-07', updatedAt: '2026-11-07', sections: [],
};
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(modeloInspecaoService.listarTodos).mockResolvedValue([template] as never);
});

it('saves an existing draft through the API and displays its confirmed title', async () => {
  jest.mocked(modeloInspecaoService.salvarRascunho).mockResolvedValue({ ...template, title: 'Título editado' } as never);
  render(<TemplatesPage />);
  fireEvent.click(await screen.findByTitle('Editar rascunho'));
  fireEvent.change(screen.getByLabelText('Título do modelo'), { target: { value: 'Título editado' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
  await waitFor(() => expect(modeloInspecaoService.salvarRascunho).toHaveBeenCalledWith('1', expect.objectContaining({ title: 'Título editado' })));
  expect(await screen.findByRole('heading', { name: 'Título editado' })).toBeInTheDocument();
});

it('keeps user input and the editor open after a rejected save', async () => {
  jest.mocked(modeloInspecaoService.salvarRascunho).mockRejectedValue(new Error('Sem conexão'));
  render(<TemplatesPage />);
  fireEvent.click(await screen.findByTitle('Editar rascunho'));
  fireEvent.change(screen.getByLabelText('Título do modelo'), { target: { value: 'Alteração pendente' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Sem conexão');
  expect(screen.getByLabelText('Título do modelo')).toHaveValue('Alteração pendente');
  expect(screen.getByRole('heading', { name: 'Modelo salvo' })).toBeInTheDocument();
});

it('copies into an unsaved editor and keeps the original intact', async () => {
  render(<TemplatesPage />);
  fireEvent.click(await screen.findByTitle('Duplicar como rascunho'));
  expect(screen.getByLabelText('Título do modelo')).toHaveValue('Modelo salvo (Cópia)');
  expect(modeloInspecaoService.criarRascunho).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.queryByText('Modelo salvo (Cópia)')).not.toBeInTheDocument();
});

it('offers retry after a loading failure without showing demo records', async () => {
  jest.mocked(modeloInspecaoService.listarTodos).mockRejectedValueOnce(new Error('offline'));
  render(<TemplatesPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByRole('heading', { name: 'Modelo salvo' })).toBeInTheDocument();
  expect(modeloInspecaoService.listarTodos).toHaveBeenCalledTimes(2);
});

it('moves sections with their items and saves the new order', async () => {
  const original = { ...template, sections: [
    { id: '10', title: 'Primeira', order: 1, items: [] },
    { id: '11', title: 'Segunda', order: 2, items: [] },
  ] };
  jest.mocked(modeloInspecaoService.listarTodos).mockResolvedValue([original] as never);
  jest.mocked(modeloInspecaoService.salvarRascunho).mockResolvedValue(original as never);
  render(<TemplatesPage />);
  fireEvent.click(await screen.findByTitle('Editar rascunho'));
  expect(screen.getByRole('button', { name: 'Subir seção 1' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Subir seção 2' }));
  expect(screen.getByLabelText('Nome da seção 1')).toHaveValue('Segunda');
  fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
  await waitFor(() => expect(modeloInspecaoService.salvarRascunho).toHaveBeenCalledWith('1', expect.objectContaining({ sections: [
    { ...original.sections[1], order: 1 }, { ...original.sections[0], order: 2 },
  ] })));
});

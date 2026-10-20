import apiClient from '../../axios';
import { clienteService } from '../clienteService';
import { localService } from '../localService';
import { equipamentoService } from '../equipamentoService';

jest.mock('../../axios', () => {
  return {
    __esModule: true,
    default: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    },
  };
});

describe('Hierarchy Services (Cliente, Local, Equipamento)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('clienteService', () => {
    it('deve listar clientes', async () => {
      const mockClientes = [
        {
          id: 1,
          nome: 'Empresa Alpha',
          cnpj: '12345678000100',
          telefone: '11999998888',
          email: 'alpha@test.com',
          ativo: true,
        },
      ];
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockClientes });

      const result = await clienteService.listar();
      expect(apiClient.get).toHaveBeenCalledWith('/clientes');
      expect(result).toEqual(mockClientes);
    });

    it('deve cadastrar um cliente', async () => {
      const payload = {
        nome: 'Empresa Beta',
        cnpj: '98765432000199',
        telefone: '11988887777',
        email: 'beta@test.com',
      };
      const created = { id: 2, ...payload, ativo: true };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: created });

      const result = await clienteService.cadastrar(payload);
      expect(apiClient.post).toHaveBeenCalledWith('/clientes', payload);
      expect(result).toEqual(created);
    });

    it('deve atualizar um cliente', async () => {
      const payload = {
        nome: 'Empresa Beta Atualizada',
        cnpj: '98765432000199',
        telefone: '11988887777',
        email: 'beta2@test.com',
      };
      const updated = { id: 2, ...payload, ativo: true };
      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: updated });

      const result = await clienteService.atualizar(2, payload);
      expect(apiClient.put).toHaveBeenCalledWith('/clientes/2', payload);
      expect(result).toEqual(updated);
    });
  });

  describe('localService', () => {
    it('deve listar locais por cliente', async () => {
      const mockLocais = [
        { id: 10, nome: 'Galpão 1', endereco: 'Rua A', clienteId: 1, ativo: true },
      ];
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockLocais });

      const result = await localService.listarPorCliente(1);
      expect(apiClient.get).toHaveBeenCalledWith('/locais/cliente/1');
      expect(result).toEqual(mockLocais);
    });

    it('deve cadastrar um local vinculado ao cliente', async () => {
      const payload = {
        nome: 'Galpão 2',
        endereco: 'Rua B, 100',
        clienteId: 1,
      };
      const created = { id: 11, ...payload, ativo: true };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: created });

      const result = await localService.cadastrar(payload);
      expect(apiClient.post).toHaveBeenCalledWith('/locais', payload);
      expect(result).toEqual(created);
    });
  });

  describe('equipamentoService', () => {
    it('deve listar equipamentos por local', async () => {
      const mockEquipamentos = [
        { id: 100, nome: 'Torno CNC', numeroSerie: 'TRN-001', localId: 10, ativo: true },
      ];
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockEquipamentos });

      const result = await equipamentoService.listarPorLocal(10);
      expect(apiClient.get).toHaveBeenCalledWith('/equipamentos/local/10');
      expect(result).toEqual(mockEquipamentos);
    });

    it('deve cadastrar equipamento vinculado ao local', async () => {
      const payload = {
        nome: 'Compressor 50HP',
        numeroSerie: 'CMP-50',
        tipo: 'Compressor',
        localId: 10,
      };
      const created = { id: 101, ...payload, ativo: true };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: created });

      const result = await equipamentoService.cadastrar(payload);
      expect(apiClient.post).toHaveBeenCalledWith('/equipamentos', payload);
      expect(result).toEqual(created);
    });
  });
});

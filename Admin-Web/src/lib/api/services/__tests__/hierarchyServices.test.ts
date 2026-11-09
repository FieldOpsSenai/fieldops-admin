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
      patch: jest.fn(),
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
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { content: [{ id: 1, name: 'Empresa Alpha', document: '12345678000100', phone: '11999998888', email: 'alpha@test.com', status: 'ACTIVE' }] },
      });

      const result = await clienteService.listar();
      expect(apiClient.get).toHaveBeenCalledWith('/clients', { params: { size: 200 } });
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
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { id: 2, name: payload.nome, document: payload.cnpj, phone: payload.telefone, email: payload.email, status: 'ACTIVE' },
      });

      const result = await clienteService.cadastrar(payload);
      expect(apiClient.post).toHaveBeenCalledWith('/clients', {
        name: payload.nome, legalName: payload.nome, document: '98.765.432/0001-99', phone: payload.telefone, email: payload.email,
      });
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
      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: {
        id: 2, name: payload.nome, document: payload.cnpj, phone: payload.telefone, email: payload.email, status: 'ACTIVE',
      } });

      const result = await clienteService.atualizar(2, payload);
      expect(apiClient.put).toHaveBeenCalledWith('/clients/2', {
        name: payload.nome, legalName: payload.nome, document: '98.765.432/0001-99', phone: payload.telefone, email: payload.email,
      });
      expect(result).toEqual(updated);
    });
  });

  describe('localService', () => {
    it('atualiza o local sem descartar metadados não editados no formulário', async () => {
      const site = { id: 10, name: 'Unidade', clientId: 1, address: 'Rua A', city: 'São Paulo', state: 'SP', status: 'ACTIVE' };
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: site });
      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: { ...site, name: 'Unidade nova' } });
      await localService.atualizar(10, { nome: 'Unidade nova', endereco: 'Rua A', clienteId: 1 });
      expect(apiClient.put).toHaveBeenCalledWith('/sites/10', expect.objectContaining({ name: 'Unidade nova', clientId: 1, city: 'São Paulo', state: 'SP' }));
    });

    it('inativa pelo endpoint de status e preserva vínculos históricos', async () => {
      await localService.inativar(10);
      expect(apiClient.patch).toHaveBeenCalledWith('/sites/10/status', { status: 'INACTIVE' });
      expect(apiClient.delete).not.toHaveBeenCalled();
    });
    it('deve listar locais por cliente', async () => {
      const mockLocais = [
        { id: 10, nome: 'Galpão 1', endereco: 'Rua A', clienteId: 1, ativo: true },
      ];
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { content: [{ id: 10, name: 'Galpão 1', address: 'Rua A', clientId: 1, status: 'ACTIVE' }] },
      });

      const result = await localService.listarPorCliente(1);
      expect(apiClient.get).toHaveBeenCalledWith('/sites', { params: { clientId: 1, size: 200 } });
      expect(result).toEqual(mockLocais);
    });

    it('deve cadastrar um local vinculado ao cliente', async () => {
      const payload = {
        nome: 'Galpão 2',
        endereco: 'Rua B, 100',
        clienteId: 1,
      };
      const created = { id: 11, ...payload, ativo: true };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { id: 11, name: payload.nome, address: payload.endereco, clientId: payload.clienteId, status: 'ACTIVE' },
      });

      const result = await localService.cadastrar(payload);
      expect(apiClient.post).toHaveBeenCalledWith('/sites', { clientId: payload.clienteId, name: payload.nome, address: payload.endereco });
      expect(result).toEqual(created);
    });
  });

  describe('equipamentoService', () => {
    it('preserva QR e metadados ao editar o equipamento', async () => {
      const equipment = { id: 100, name: 'Compressor', siteId: 10, qrCode: 'QR-100', manufacturer: 'Fabricante', assetNumber: 'PAT-1', status: 'ACTIVE' };
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: equipment });
      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: { ...equipment, name: 'Compressor novo' } });
      const result = await equipamentoService.atualizar(100, { nome: 'Compressor novo', numeroSerie: 'S-2', localId: 10 });
      expect(apiClient.put).toHaveBeenCalledWith('/equipment/100', expect.objectContaining({ name: 'Compressor novo', qrCode: 'QR-100', manufacturer: 'Fabricante', assetNumber: 'PAT-1' }));
      expect(result.qrCode).toBe('QR-100');
    });

    it('inativa equipamento pela mudança de status', async () => {
      await equipamentoService.inativar(100);
      expect(apiClient.patch).toHaveBeenCalledWith('/equipment/100/status', { status: 'INACTIVE' });
    });
    it('deve listar equipamentos por local', async () => {
      const mockEquipamentos = [
        { id: 100, nome: 'Torno CNC', numeroSerie: 'TRN-001', localId: 10, ativo: true },
      ];
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: [{ id: 100, name: 'Torno CNC', serialNumber: 'TRN-001', siteId: 10, status: 'ACTIVE' }],
      });

      const result = await equipamentoService.listarPorLocal(10);
      expect(apiClient.get).toHaveBeenCalledWith('/equipment', { params: { siteId: 10, size: 200 } });
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
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { id: 101, name: payload.nome, serialNumber: payload.numeroSerie, model: payload.tipo, siteId: payload.localId, status: 'ACTIVE' },
      });

      const result = await equipamentoService.cadastrar(payload);
      expect(apiClient.post).toHaveBeenCalledWith('/equipment', {
        siteId: payload.localId, name: payload.nome, assetNumber: payload.numeroSerie, serialNumber: payload.numeroSerie,
        model: payload.tipo, qrCode: payload.numeroSerie, status: 'ACTIVE',
      });
      expect(result).toEqual(created);
    });
  });
});

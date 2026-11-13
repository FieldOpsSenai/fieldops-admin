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
    const client = { id: 1, nome: 'Empresa', cnpj: '12345678000100', telefone: '11999998888', email: 'empresa@test.com', ativo: true };
    it('consulta páginas pelo contrato da API main', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { content: [client], number: 0, size: 10, totalPages: 1, totalElements: 1 } });
      const page = await clienteService.listarPagina({ search: 'Empresa', page: 0, size: 10 });
      expect(page.content).toEqual([client]);
      expect(apiClient.get).toHaveBeenCalledWith('/clientes', { params: { page: 0, size: 10, termo: 'Empresa', sort: 'nome,asc' }, signal: undefined });
    });
    it('cria, edita e inativa pelo contrato da API main', async () => {
      const { id, ativo, ...payload } = client; void id; void ativo;
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: client });
      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: client });
      await clienteService.cadastrar(payload); await clienteService.atualizar(1, payload); await clienteService.inativar(1);
      expect(apiClient.post).toHaveBeenCalledWith('/clientes', payload);
      expect(apiClient.put).toHaveBeenCalledWith('/clientes/1', payload);
      expect(apiClient.delete).toHaveBeenCalledWith('/clientes/1');
    });
    it('não simula consulta de clientes inativos indisponível na API', async () => {
      await expect(clienteService.listarPagina({ status: 'INACTIVE' })).rejects.toThrow('não permite');
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });
  describe('localService', () => {
    const site = { id: 10, nome: 'Galpão', endereco: 'Rua A', clienteId: 1, ativo: true };
    it('pesquisa locais com vínculo e paginação na API main', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { content: [site], number: 0, size: 10, totalPages: 1, totalElements: 1 } });
      expect((await localService.listarPagina({ search: 'Galpão', clientId: 1 })).content).toEqual([site]);
      expect(apiClient.get).toHaveBeenCalledWith('/locais', { params: { page: 0, size: 10, termo: 'Galpão', clienteId: 1, sort: 'nome,asc' }, signal: undefined });
    });
    it('cria, edita e inativa locais pela API main', async () => {
      const payload = { nome: site.nome, endereco: site.endereco, clienteId: site.clienteId };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: site });
      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: site });
      await localService.cadastrar(payload); await localService.atualizar(10, payload); await localService.inativar(10);
      expect(apiClient.post).toHaveBeenCalledWith('/locais', payload);
      expect(apiClient.put).toHaveBeenCalledWith('/locais/10', payload);
      expect(apiClient.delete).toHaveBeenCalledWith('/locais/10');
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
        qrCode: 'equipment-unique-101',
      };
      const created = { id: 101, ...payload, ativo: true };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { id: 101, name: payload.nome, serialNumber: payload.numeroSerie, model: payload.tipo, siteId: payload.localId, qrCode: payload.qrCode, status: 'ACTIVE' },
      });

      const result = await equipamentoService.cadastrar(payload);
      expect(apiClient.post).toHaveBeenCalledWith('/equipment', {
        siteId: payload.localId, name: payload.nome, assetNumber: payload.numeroSerie, serialNumber: payload.numeroSerie,
        model: payload.tipo, qrCode: payload.qrCode, status: 'ACTIVE',
      });
      expect(result).toEqual(created);
    });
  });
});

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
    const equipment = { id: 100, nome: 'Compressor', numeroSerie: 'S-1', localId: 10, qrCode: 'QR-100', ativo: true };
    it('consulta equipamentos e QR pelo contrato atual', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { content: [equipment], number: 0, size: 10, totalPages: 1, totalElements: 1 } }).mockResolvedValueOnce({ data: equipment });
      expect((await equipamentoService.listarPagina({ siteId: 10 })).content).toEqual([equipment]);
      expect(apiClient.get).toHaveBeenCalledWith('/equipamentos', { params: { page: 0, size: 10, termo: undefined, localId: 10, sort: 'nome,asc' }, signal: undefined });
      expect(await equipamentoService.buscarPorQr('QR-100')).toEqual(equipment);
      expect(apiClient.get).toHaveBeenLastCalledWith('/equipamentos/qrcode/QR-100');
    });
    it('cria, edita sem substituir o QR e inativa pela API', async () => {
      const payload = { nome: 'Compressor', numeroSerie: 'S-1', localId: 10 };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: equipment });
      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: equipment });
      expect((await equipamentoService.cadastrar(payload)).qrCode).toBe('QR-100');
      expect((await equipamentoService.atualizar(100, payload)).qrCode).toBe('QR-100');
      await equipamentoService.inativar(100);
      expect(apiClient.post).toHaveBeenCalledWith('/equipamentos', payload);
      expect(apiClient.put).toHaveBeenCalledWith('/equipamentos/100', payload);
      expect(apiClient.delete).toHaveBeenCalledWith('/equipamentos/100');
    });
  });
});
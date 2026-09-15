'use client';

import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { 
  Plus, 
  Building2, 
  MapPin, 
  Wrench, 
  Users, 
  Search, 
  Filter, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  Trash2, 
  Shield, 
  RefreshCw 
} from 'lucide-react';
import { 
  clienteService, 
  localService, 
  equipamentoService, 
  usuarioService,
  ClienteDTO,
  LocalDTO,
  EquipamentoDTO,
  UsuarioDTO
} from '@/lib/api/services';
import { Profile } from '@/types';

type ActiveTab = 'CLIENTES' | 'LOCAIS' | 'EQUIPAMENTOS' | 'USUARIOS';

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('CLIENTES');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Entities Data
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [locais, setLocais] = useState<LocalDTO[]>([]);
  const [equipamentos, setEquipamentos] = useState<EquipamentoDTO[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  // Cliente Form
  const [clienteNome, setClienteNome] = useState('');
  const [clienteCnpj, setClienteCnpj] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');

  // Local Form
  const [localNome, setLocalNome] = useState('');
  const [localEndereco, setLocalEndereco] = useState('');
  const [localClienteId, setLocalClienteId] = useState('');

  // Equipamento Form
  const [equipNome, setEquipNome] = useState('');
  const [equipNumeroSerie, setEquipNumeroSerie] = useState('');
  const [equipTipo, setEquipTipo] = useState('');
  const [equipLocalId, setEquipLocalId] = useState('');

  // Usuario Form
  const [userNome, setUserNome] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userSenha, setUserSenha] = useState('123456');
  const [userPerfil, setUserPerfil] = useState<Profile>('TECNICO');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [cRes, lRes, eRes, uRes] = await Promise.allSettled([
        clienteService.listar(),
        localService.listarTodos(),
        equipamentoService.listarTodos(),
        usuarioService.listarTodos(),
      ]);

      if (cRes.status === 'fulfilled') setClientes(cRes.value);
      if (lRes.status === 'fulfilled') setLocais(lRes.value);
      if (eRes.status === 'fulfilled') setEquipamentos(eRes.value);
      if (uRes.status === 'fulfilled') setUsuarios(uRes.value);
    } catch (err: any) {
      console.error('Error fetching master data:', err);
      setErrorMessage('Erro ao carregar dados mestres da API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Open Modal for active tab
  const handleOpenModal = () => {
    setClienteNome('');
    setClienteCnpj('');
    setClienteTelefone('');
    setClienteEmail('');

    setLocalNome('');
    setLocalEndereco('');
    setLocalClienteId(clientes.length > 0 ? String(clientes[0].id) : '');

    setEquipNome('');
    setEquipNumeroSerie('');
    setEquipTipo('');
    setEquipLocalId(locais.length > 0 ? String(locais[0].id) : '');

    setUserNome('');
    setUserEmail('');
    setUserSenha('123456');
    setUserPerfil('TECNICO');

    setIsModalOpen(true);
  };

  // Submit modal form
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (activeTab === 'CLIENTES') {
        const created = await clienteService.cadastrar({
          nome: clienteNome.trim(),
          cnpj: clienteCnpj.trim(),
          telefone: clienteTelefone.trim(),
          email: clienteEmail.trim(),
        });
        setClientes([created, ...clientes]);
        showToast(`Cliente "${created.nome}" cadastrado com sucesso!`);
      } else if (activeTab === 'LOCAIS') {
        if (!localClienteId) {
          alert('Por favor, selecione o cliente.');
          return;
        }
        const created = await localService.cadastrar({
          nome: localNome.trim(),
          endereco: localEndereco.trim(),
          clienteId: Number(localClienteId),
        });
        setLocais([created, ...locais]);
        showToast(`Local "${created.nome}" cadastrado com sucesso!`);
      } else if (activeTab === 'EQUIPAMENTOS') {
        if (!equipLocalId) {
          alert('Por favor, selecione o local da instalação.');
          return;
        }
        const created = await equipamentoService.cadastrar({
          nome: equipNome.trim(),
          numeroSerie: equipNumeroSerie.trim(),
          tipo: equipTipo.trim() || undefined,
          localId: Number(equipLocalId),
        });
        setEquipamentos([created, ...equipamentos]);
        showToast(`Equipamento "${created.nome}" cadastrado com sucesso!`);
      } else if (activeTab === 'USUARIOS') {
        const created = await usuarioService.cadastrar({
          nome: userNome.trim(),
          email: userEmail.trim(),
          senha: userSenha,
          perfil: userPerfil,
        });
        setUsuarios([created, ...usuarios]);
        showToast(`Usuário "${created.nome}" criado com sucesso!`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error creating record:', err);
      const msg = err.response?.data?.mensagem || err.response?.data || err.message;
      alert(`Falha ao cadastrar: ${typeof msg === 'string' ? msg : 'Verifique os dados'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inactivate client
  const handleInativarCliente = async (id: number, nome: string) => {
    if (confirm(`Deseja realmente inativar o cliente "${nome}"?`)) {
      try {
        await clienteService.inativar(id);
        setClientes((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ativo: false } : c))
        );
        showToast(`Cliente "${nome}" inativado.`);
      } catch (err) {
        alert('Erro ao inativar cliente.');
      }
    }
  };

  return (
    <>
      <TopHeader 
        title="Dados Mestres (Master Data)"
        context={
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">FieldOps Desktop</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800">Master Data & Configurações</span>
          </div>
        }
      />
      
      <div className="p-8 max-w-7xl mx-auto space-y-6">

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-lg shadow-xl border border-slate-700 animate-in fade-in">
            <CheckCircle2 size={20} className="text-[#10b981]" />
            <span className="text-sm font-medium">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-3 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dados Mestres</h1>
            <p className="text-slate-500 text-sm mt-1">
              Gerencie entidades estruturais da plataforma persistidas no banco de dados via API REST.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-xs transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
              title="Atualizar dados"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin text-[#0f766e]' : ''} />
              <span className="hidden md:inline">Recarregar</span>
            </button>

            <button 
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg shadow-xs font-bold text-sm transition-colors cursor-pointer"
            >
              <Plus size={18} />
              Novo {activeTab === 'CLIENTES' ? 'Cliente' : activeTab === 'LOCAIS' ? 'Local' : activeTab === 'EQUIPAMENTOS' ? 'Equipamento' : 'Usuário'}
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="border-b border-slate-200 flex gap-2 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('CLIENTES'); setSearchTerm(''); }}
            className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'CLIENTES'
                ? 'text-[#0f766e] border-[#0f766e]'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Building2 size={16} />
            Clientes ({clientes.length})
          </button>

          <button
            onClick={() => { setActiveTab('LOCAIS'); setSearchTerm(''); }}
            className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'LOCAIS'
                ? 'text-[#0f766e] border-[#0f766e]'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <MapPin size={16} />
            Locais / Unidades ({locais.length})
          </button>

          <button
            onClick={() => { setActiveTab('EQUIPAMENTOS'); setSearchTerm(''); }}
            className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'EQUIPAMENTOS'
                ? 'text-[#0f766e] border-[#0f766e]'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Wrench size={16} />
            Equipamentos ({equipamentos.length})
          </button>

          <button
            onClick={() => { setActiveTab('USUARIOS'); setSearchTerm(''); }}
            className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'USUARIOS'
                ? 'text-[#0f766e] border-[#0f766e]'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Users size={16} />
            Usuários & Técnicos ({usuarios.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Filtrar ${activeTab.toLowerCase()} por nome ou detalhes...`}
            className="block w-full pl-9 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] bg-white shadow-2xs"
          />
        </div>

        {/* Dynamic Table based on Active Tab */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin text-[#0f766e]" />
              <span className="text-sm font-medium">Carregando dados da API...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              
              {/* TAB 1: CLIENTES */}
              {activeTab === 'CLIENTES' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-3.5">ID</th>
                      <th className="px-6 py-3.5">Nome da Empresa</th>
                      <th className="px-6 py-3.5">CNPJ</th>
                      <th className="px-6 py-3.5">Contato / E-mail</th>
                      <th className="px-6 py-3.5">Telefone</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {clientes
                      .filter((c) => c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj.includes(searchTerm))
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">#{c.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{c.nome}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-600">{c.cnpj}</td>
                          <td className="px-6 py-4 text-slate-600">{c.email}</td>
                          <td className="px-6 py-4 text-slate-600">{c.telefone}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${c.ativo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {c.ativo ? 'ATIVO' : 'INATIVO'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {c.ativo && (
                              <button
                                onClick={() => handleInativarCliente(c.id, c.nome)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                                title="Inativar Cliente"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* TAB 2: LOCAIS */}
              {activeTab === 'LOCAIS' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-3.5">ID</th>
                      <th className="px-6 py-3.5">Nome da Unidade</th>
                      <th className="px-6 py-3.5">Endereço</th>
                      <th className="px-6 py-3.5">Cliente Vinculado</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {locais
                      .filter((l) => l.nome.toLowerCase().includes(searchTerm.toLowerCase()) || l.endereco.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">#{l.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                            <MapPin size={15} className="text-[#0f766e]" />
                            {l.nome}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{l.endereco}</td>
                          <td className="px-6 py-4 text-slate-800 font-semibold">{l.clienteNome || `Cliente #${l.clienteId}`}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ATIVO
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* TAB 3: EQUIPAMENTOS */}
              {activeTab === 'EQUIPAMENTOS' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-3.5">ID</th>
                      <th className="px-6 py-3.5">Nome do Maquinário</th>
                      <th className="px-6 py-3.5">Número de Série</th>
                      <th className="px-6 py-3.5">Tipo / Categoria</th>
                      <th className="px-6 py-3.5">Local / Planta</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {equipamentos
                      .filter((eq) => eq.nome.toLowerCase().includes(searchTerm.toLowerCase()) || eq.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((eq) => (
                        <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">#{eq.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                            <Wrench size={15} className="text-[#0f766e]" />
                            {eq.nome}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded w-fit">{eq.numeroSerie}</td>
                          <td className="px-6 py-4 text-slate-600">{eq.tipo || 'Geral'}</td>
                          <td className="px-6 py-4 text-slate-800 font-semibold">{eq.localNome || `Local #${eq.localId}`}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ATIVO
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* TAB 4: USUARIOS */}
              {activeTab === 'USUARIOS' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-3.5">ID</th>
                      <th className="px-6 py-3.5">Nome do Usuário</th>
                      <th className="px-6 py-3.5">E-mail</th>
                      <th className="px-6 py-3.5">Perfil de Acesso</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {usuarios
                      .filter((u) => u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">#{u.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-teal-100 text-[#0f766e] text-xs font-bold flex items-center justify-center">
                              {u.nome.charAt(0)}
                            </div>
                            {u.nome}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${
                              u.perfil === 'ADMINISTRADOR' 
                                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                : u.perfil === 'SUPERVISOR'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-teal-50 text-[#0f766e] border-teal-200'
                            }`}>
                              {u.perfil}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ATIVO
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* CREATE RECORD MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Cadastrar {activeTab === 'CLIENTES' ? 'Novo Cliente' : activeTab === 'LOCAIS' ? 'Novo Local' : activeTab === 'EQUIPAMENTOS' ? 'Novo Equipamento' : 'Novo Usuário'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Os dados serão gravados imediatamente no backend Java.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              
              {/* FORM: CLIENTE */}
              {activeTab === 'CLIENTES' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Razão Social / Nome Fantasia *</label>
                    <input 
                      type="text" 
                      required
                      value={clienteNome} 
                      onChange={(e) => setClienteNome(e.target.value)} 
                      placeholder="Ex: Usina Siderúrgica Central"
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ (14 dígitos) *</label>
                    <input 
                      type="text" 
                      required
                      value={clienteCnpj} 
                      onChange={(e) => setClienteCnpj(e.target.value)} 
                      placeholder="12345678000195"
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / Ramal *</label>
                    <input 
                      type="text" 
                      required
                      value={clienteTelefone} 
                      onChange={(e) => setClienteTelefone(e.target.value)} 
                      placeholder="11999998888"
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">E-mail de Contato *</label>
                    <input 
                      type="email" 
                      required
                      value={clienteEmail} 
                      onChange={(e) => setClienteEmail(e.target.value)} 
                      placeholder="contato@siderurgica.com.br"
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                    />
                  </div>
                </>
              )}

              {/* FORM: LOCAL */}
              {activeTab === 'LOCAIS' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cliente Vinculado *</label>
                    <select
                      value={localClienteId}
                      onChange={(e) => setLocalClienteId(e.target.value)}
                      required
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-[#10b981]"
                    >
                      <option value="">Selecione o cliente...</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Unidade / Setor *</label>
                    <input 
                      type="text" 
                      required
                      value={localNome} 
                      onChange={(e) => setLocalNome(e.target.value)} 
                      placeholder="Ex: Galpão B - Usinagem"
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Endereço Completo *</label>
                    <input 
                      type="text" 
                      required
                      value={localEndereco} 
                      onChange={(e) => setLocalEndereco(e.target.value)} 
                      placeholder="Av. Industrial, 400 - Distrito Norte"
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                    />
                  </div>
                </>
              )}

              {/* FORM: EQUIPAMENTO */}
              {activeTab === 'EQUIPAMENTOS' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Local de Instalação *</label>
                    <select
                      value={equipLocalId}
                      onChange={(e) => setEquipLocalId(e.target.value)}
                      required
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-[#10b981]"
                    >
                      <option value="">Selecione o local...</option>
                      {locais.map((l) => (
                        <option key={l.id} value={l.id}>{l.nome} ({l.clienteNome || 'Cliente'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome / Identificação do Equipamento *</label>
                    <input 
                      type="text" 
                      required
                      value={equipNome} 
                      onChange={(e) => setEquipNome(e.target.value)} 
                      placeholder="Ex: Compressor Parafuso 50HP"
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Número de Série / Tag *</label>
                    <input 
                      type="text" 
                      required
                      value={equipNumeroSerie} 
                      onChange={(e) => setEquipNumeroSerie(e.target.value)} 
                      placeholder="CMP-998877"
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Máquina (Opcional)</label>
                    <input 
                      type="text" 
                      value={equipTipo} 
                      onChange={(e) => setEquipTipo(e.target.value)} 
                      placeholder="Compressor / Caldeira / Transformador"
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                    />
                  </div>
                </>
              )}

              {/* FORM: USUARIO */}
              {activeTab === 'USUARIOS' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                    <input 
                      type="text" 
                      required
                      value={userNome} 
                      onChange={(e) => setUserNome(e.target.value)} 
                      placeholder="Ex: João Técnico Silva"
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Corporativo *</label>
                    <input 
                      type="email" 
                      required
                      value={userEmail} 
                      onChange={(e) => setUserEmail(e.target.value)} 
                      placeholder="joao.silva@fieldops.com"
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Senha de Acesso *</label>
                    <input 
                      type="password" 
                      required
                      value={userSenha} 
                      onChange={(e) => setUserSenha(e.target.value)} 
                      placeholder="Mínimo 6 caracteres"
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Perfil de Acesso *</label>
                    <select
                      value={userPerfil}
                      onChange={(e) => setUserPerfil(e.target.value as Profile)}
                      className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-[#10b981]"
                    >
                      <option value="TECNICO">TECNICO (Pode executar inspeções em campo)</option>
                      <option value="SUPERVISOR">SUPERVISOR (Aprova vistorias e gerencia técnicos)</option>
                      <option value="ADMINISTRADOR">ADMINISTRADOR (Acesso total)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar no Banco'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}

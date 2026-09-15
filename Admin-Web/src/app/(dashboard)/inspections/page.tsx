'use client';

import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { 
  Plus, 
  Filter, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Check, 
  X, 
  MoreVertical, 
  ChevronRight, 
  Loader2, 
  Calendar, 
  User, 
  CheckSquare,
  Wrench,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { inspecaoService, usuarioService, InspecaoDTO, UsuarioDTO, InspecaoStatus } from '@/lib/api/services';

export default function InspectionsPage() {
  const [inspecoes, setInspecoes] = useState<InspecaoDTO[]>([]);
  const [tecnicos, setTecnicos] = useState<UsuarioDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODAS');
  const [tecnicoFilter, setTecnicoFilter] = useState<string>('TODOS');

  // Status Change Modal
  const [selectedInspecaoForStatus, setSelectedInspecaoForStatus] = useState<InspecaoDTO | null>(null);
  const [newStatus, setNewStatus] = useState<InspecaoStatus>('CONCLUIDA');
  const [statusObs, setStatusObs] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const [inspecoesData, usuariosData] = await Promise.allSettled([
        inspecaoService.listarTodas(),
        usuarioService.listarTodos(),
      ]);

      if (inspecoesData.status === 'fulfilled') {
        setInspecoes(inspecoesData.value);
      } else {
        console.error('Error fetching inspections:', inspecoesData.reason);
        setErrorMessage('Não foi possível carregar as inspeções da API Java. Verifique se o backend está ativo.');
      }

      if (usuariosData.status === 'fulfilled') {
        setTecnicos(usuariosData.value);
      }
    } catch (err: any) {
      console.error('Error in loadData:', err);
      setErrorMessage('Erro ao carregar dados do servidor.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Inspections
  const filteredInspecoes = inspecoes.filter((insp) => {
    const matchesSearch = 
      insp.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insp.equipamentoNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insp.usuarioNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(insp.id).includes(searchTerm);

    const matchesStatus = statusFilter === 'TODAS' || insp.status === statusFilter;
    const matchesTecnico = tecnicoFilter === 'TODOS' || String(insp.usuarioId) === tecnicoFilter;

    return matchesSearch && matchesStatus && matchesTecnico;
  });

  // Handle status update -> PATCH /api/v1/inspecoes/{id}/status
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInspecaoForStatus) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await inspecaoService.atualizarStatus(selectedInspecaoForStatus.id, {
        status: newStatus,
        observacoes: statusObs.trim() || undefined,
      });

      setInspecoes((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );

      showToast(`Status da inspeção #${updated.id} atualizado para ${updated.status}.`);
      setSelectedInspecaoForStatus(null);
      setStatusObs('');
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('Falha ao atualizar status da inspeção.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <>
      <TopHeader 
        title="Inspeções em Campo"
        context={
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">FieldOps Desktop</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800">Ordens de Inspeção</span>
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
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <CheckSquare className="text-[#0f766e]" size={32} />
              Inspeções & Vistorias
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Acompanhe ordens de serviço geradas e sincronizadas em tempo real com o backend Spring Boot.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-xs transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
              title="Atualizar dados da API"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-[#0f766e]' : ''} />
              <span className="hidden md:inline">Atualizar</span>
            </button>

            <Link 
              href="/scheduling" 
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg shadow-xs font-bold text-sm transition-colors cursor-pointer"
            >
              <Plus size={18} />
              Nova Inspeção
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-sm text-amber-800">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Aviso de Comunicação com o Servidor</p>
              <p className="text-xs text-amber-700 mt-0.5">{errorMessage}</p>
            </div>
            <button 
              onClick={() => loadData()}
              className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-bold hover:bg-amber-700"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-1 items-center gap-3 min-w-[280px]">
            {/* Search Input */}
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </div>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ID, descrição, equipamento ou técnico..." 
                className="block w-full pl-9 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
              />
            </div>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]"
            >
              <option value="TODAS">Todos os Status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="CANCELADA">Cancelada</option>
            </select>

            {/* Technician Select */}
            <select
              value={tecnicoFilter}
              onChange={(e) => setTecnicoFilter(e.target.value)}
              className="py-2 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981] hidden sm:block"
            >
              <option value="TODOS">Todos os Técnicos</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Total: <span className="text-slate-900 font-bold">{filteredInspecoes.length}</span> ordens
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin text-[#0f766e]" />
              <span className="text-sm font-medium">Carregando inspeções da API Java...</span>
            </div>
          ) : filteredInspecoes.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CheckSquare size={44} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">Nenhuma inspeção encontrada</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                Não há ordens de serviço correspondentes aos filtros ou nenhuma inspeção foi cadastrada no banco de dados.
              </p>
              <Link 
                href="/scheduling"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f766e] text-white rounded-lg text-xs font-bold hover:bg-[#115e59]"
              >
                <Plus size={14} />
                Agendar Primeira Inspeção
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">ID</th>
                    <th className="px-6 py-3.5">Descrição da Inspeção</th>
                    <th className="px-6 py-3.5">Equipamento</th>
                    <th className="px-6 py-3.5">Técnico Responsável</th>
                    <th className="px-6 py-3.5">Data Agendada</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredInspecoes.map((insp) => {
                    const isConcluida = insp.status === 'CONCLUIDA';
                    const isPendente = insp.status === 'PENDENTE';
                    const isCancelada = insp.status === 'CANCELADA';

                    // Format date
                    let formattedDate = insp.dataAgendada;
                    try {
                      formattedDate = new Date(insp.dataAgendada).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    } catch (e) {}

                    return (
                      <tr key={insp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-slate-600">
                          #{insp.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{insp.descricao}</div>
                          {insp.observacoes && (
                            <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{insp.observacoes}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium text-xs">
                            <Wrench size={14} className="text-[#0f766e]" />
                            <span>{insp.equipamentoNome || `Equipamento #${insp.equipamentoId}`}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                              {insp.usuarioNome ? insp.usuarioNome.charAt(0).toUpperCase() : 'T'}
                            </div>
                            <span className="text-slate-700 text-xs font-medium">
                              {insp.usuarioNome || `Usuário #${insp.usuarioId}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                          {formattedDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${
                              isConcluida 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : isCancelada 
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isConcluida ? 'bg-emerald-600' : isCancelada ? 'bg-red-600' : 'bg-blue-600'}`}></span>
                            {insp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              setSelectedInspecaoForStatus(insp);
                              setNewStatus(insp.status === 'PENDENTE' ? 'CONCLUIDA' : 'PENDENTE');
                              setStatusObs(insp.observacoes || '');
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-colors cursor-pointer"
                          >
                            Alterar Status
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* STATUS UPDATE MODAL */}
      {/* ========================================================================= */}
      {selectedInspecaoForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Atualizar Status da Inspeção</h3>
                <p className="text-xs text-slate-500">Ordem #{selectedInspecaoForStatus.id} - {selectedInspecaoForStatus.descricao}</p>
              </div>
              <button 
                onClick={() => setSelectedInspecaoForStatus(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Novo Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as InspecaoStatus)}
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                >
                  <option value="PENDENTE">PENDENTE</option>
                  <option value="CONCLUIDA">CONCLUIDA (Registra data de realização)</option>
                  <option value="CANCELADA">CANCELADA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Observações de Conclusão / Apontamento</label>
                <textarea
                  rows={3}
                  value={statusObs}
                  onChange={(e) => setStatusObs(e.target.value)}
                  placeholder="Ex: Inspeção finalizada com sucesso. Testes operacionais aprovados."
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981] resize-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedInspecaoForStatus(null)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isUpdatingStatus ? 'Gravando...' : 'Salvar Alteração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

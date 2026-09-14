'use client';

import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { 
  Download, 
  Plus, 
  CheckSquare, 
  Clock, 
  ClipboardCheck, 
  AlertTriangle, 
  Building2, 
  Wrench, 
  Users, 
  ChevronRight, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { 
  inspecaoService, 
  clienteService, 
  equipamentoService, 
  usuarioService,
  InspecaoDTO,
  ClienteDTO,
  EquipamentoDTO,
  UsuarioDTO
} from '@/lib/api/services';

export default function DashboardPage() {
  const [inspecoes, setInspecoes] = useState<InspecaoDTO[]>([]);
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [equipamentos, setEquipamentos] = useState<EquipamentoDTO[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [iRes, cRes, eRes, uRes] = await Promise.allSettled([
        inspecaoService.listarTodas(),
        clienteService.listar(),
        equipamentoService.listarTodos(),
        usuarioService.listarTodos(),
      ]);

      if (iRes.status === 'fulfilled') setInspecoes(iRes.value);
      if (cRes.status === 'fulfilled') setClientes(cRes.value);
      if (eRes.status === 'fulfilled') setEquipamentos(eRes.value);
      if (uRes.status === 'fulfilled') setUsuarios(uRes.value);
    } catch (err) {
      console.error('Error loading dashboard live metrics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalInspecoes = inspecoes.length;
  const concluidasCount = inspecoes.filter((i) => i.status === 'CONCLUIDA').length;
  const pendentesCount = inspecoes.filter((i) => i.status === 'PENDENTE' || i.status === 'EM_ANDAMENTO').length;
  const totalEquipamentos = equipamentos.length;
  const totalClientes = clientes.length;

  const recentInspections = [...inspecoes].reverse().slice(0, 5);

  return (
    <>
      <TopHeader title="FieldOps Desktop" />
      
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Painel Operacional</h1>
            <p className="text-slate-500 text-sm">
              Visão geral de métricas, status das ordens de serviço e ativos em campo conectados à API Java.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => loadDashboardData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-xs hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#0f766e]' : ''} />
              <span>Sincronizar</span>
            </button>

            <Link 
              href="/scheduling" 
              className="flex items-center gap-2 px-4 py-2 bg-[#0f766e] text-white rounded-lg shadow-xs hover:bg-[#115e59] font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Nova Inspeção
            </Link>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Total Inspections */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Inspeções</h3>
              <div className="text-[#0f766e] bg-teal-50 p-2 rounded-lg"><CheckSquare size={18} /></div>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">{totalInspecoes}</span>
              <span className="text-xs font-semibold text-emerald-600">No banco de dados</span>
            </div>
          </div>

          {/* Card 2: Pending Inspections */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ordens Pendentes</h3>
              <div className="text-amber-500 bg-amber-50 p-2 rounded-lg"><Clock size={18} /></div>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">{pendentesCount}</span>
              <span className="text-xs font-semibold text-amber-600">Aguardando execução</span>
            </div>
          </div>

          {/* Card 3: Completed */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Concluídas</h3>
              <div className="text-emerald-600 bg-emerald-50 p-2 rounded-lg"><ClipboardCheck size={18} /></div>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">{concluidasCount}</span>
              <span className="text-xs font-semibold text-emerald-600">Realizadas em campo</span>
            </div>
          </div>

          {/* Card 4: Equipment & Clients */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ativos Monitorados</h3>
              <div className="text-indigo-600 bg-indigo-50 p-2 rounded-lg"><Wrench size={18} /></div>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">{totalEquipamentos}</span>
              <span className="text-xs font-semibold text-indigo-600">Em {totalClientes} cliente(s)</span>
            </div>
          </div>

        </div>

        {/* Lower Section (Table & Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Inspections Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare size={18} className="text-[#0f766e]" />
                Inspeções Recentes
              </h2>
              <Link href="/inspections" className="text-xs font-bold text-[#0f766e] hover:underline">
                Ver Todas as Ordens →
              </Link>
            </div>

            <div className="overflow-x-auto flex-1">
              {isLoading ? (
                <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2 text-xs">
                  <Loader2 size={16} className="animate-spin text-[#0f766e]" />
                  <span>Sincronizando com a API...</span>
                </div>
              ) : recentInspections.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p className="text-xs">Nenhuma inspeção cadastrada no momento.</p>
                  <Link href="/scheduling" className="mt-2 inline-block text-xs font-bold text-[#0f766e] hover:underline">
                    + Agendar agora
                  </Link>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Descrição / Ativo</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Data</th>
                      <th className="px-6 py-3">Técnico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {recentInspections.map((insp) => {
                      const isCompleted = insp.status === 'CONCLUIDA';
                      const isCancelled = insp.status === 'CANCELADA';

                      return (
                        <tr key={insp.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-3.5 whitespace-nowrap font-mono text-xs font-bold text-slate-600">
                            #{insp.id}
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="font-bold text-slate-900 text-xs">{insp.descricao}</div>
                            <div className="text-[11px] text-slate-500">{insp.equipamentoNome || `Equipamento #${insp.equipamentoId}`}</div>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span 
                              className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                                isCompleted 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : isCancelled
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {insp.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-600">
                            {new Date(insp.dataAgendada).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-700 font-medium">
                            {insp.usuarioNome || `Usuário #${insp.usuarioId}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Quick Access / Master Data Summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Building2 size={18} className="text-[#0f766e]" />
                Ecossistema FieldOps
              </h2>
              <p className="text-xs text-slate-500 mb-5">Acesso rápido aos módulos principais da plataforma.</p>

              <div className="space-y-3">
                <Link 
                  href="/settings" 
                  className="p-3 bg-slate-50 hover:bg-teal-50/50 border border-slate-200 rounded-lg flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={18} className="text-[#0f766e]" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-[#0f766e]">Clientes & Locais</div>
                      <div className="text-[11px] text-slate-500">{totalClientes} cadastrados</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-[#0f766e]" />
                </Link>

                <Link 
                  href="/settings" 
                  className="p-3 bg-slate-50 hover:bg-teal-50/50 border border-slate-200 rounded-lg flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Wrench size={18} className="text-[#0f766e]" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-[#0f766e]">Parque de Equipamentos</div>
                      <div className="text-[11px] text-slate-500">{totalEquipamentos} ativos monitorados</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-[#0f766e]" />
                </Link>

                <Link 
                  href="/templates" 
                  className="p-3 bg-slate-50 hover:bg-teal-50/50 border border-slate-200 rounded-lg flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <ClipboardCheck size={18} className="text-[#0f766e]" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-[#0f766e]">Modelos de Inspeção</div>
                      <div className="text-[11px] text-slate-500">Checklists padronizados</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-[#0f766e]" />
                </Link>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
              <span>Status da API Java:</span>
              <span className="text-emerald-600 font-bold">Porta 8080 Conectada</span>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}

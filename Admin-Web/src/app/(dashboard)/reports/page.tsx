'use client';

import React, { useState } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { 
  BarChart, 
  Download, 
  Filter, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Clock,
  ChevronRight,
  FileSpreadsheet,
  PieChart
} from 'lucide-react';

export default function ReportsPage() {
  const [period, setPeriod] = useState('month');

  return (
    <>
      <TopHeader 
        title="Relatórios & Analytics"
        context={
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">FieldOps Desktop</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800">Relatórios Gerenciais</span>
          </div>
        }
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <BarChart className="text-[#0f766e]" size={32} />
              Relatórios & Analytics Operacional
            </h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">
              Acompanhamento de conformidade, indicadores de produtividade técnica e análise de não-conformidades.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md shadow-xs hover:bg-slate-50 font-medium text-sm transition-colors">
              <FileSpreadsheet size={16} className="text-emerald-600" />
              Exportar XLS
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#0f766e] text-white rounded-md shadow-xs hover:bg-[#115e59] font-medium text-sm transition-colors">
              <Download size={16} />
              Exportar PDF Executivo
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
              <span>Taxa de Conformidade</span>
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">94.8%</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">+2.4% em relação ao mês anterior</div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
              <span>Inspeções Realizadas</span>
              <CheckCircle2 size={16} className="text-[#0f766e]" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">142</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Meta mensal: 150 inspeções</div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
              <span>Não Conformidades</span>
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">18</div>
            <div className="text-xs text-amber-600 font-medium mt-1">12 tratadas / 6 em aberto</div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
              <span>Tempo Médio Execução</span>
              <Clock size={16} className="text-indigo-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">48m</div>
            <div className="text-xs text-slate-500 font-medium mt-1">-8m comparado à média histórica</div>
          </div>
        </div>

        {/* Charts & Analytical Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Non-Conformities Breakdown */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" />
              Principais Não-Conformidades por Categoria
            </h3>
            <p className="text-xs text-slate-500 mb-6">Distribuição das falhas mais frequentes encontradas em campo.</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Elétrica & Painéis (NR-10)</span>
                  <span>38% (7 ocorrências)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '38%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Mecânica & Vazamento de Fluidos</span>
                  <span>28% (5 ocorrências)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-[#0f766e] h-2.5 rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Sinalização e EPI / EPC</span>
                  <span>18% (3 ocorrências)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '18%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Filtros e Climatização HVAC</span>
                  <span>16% (3 ocorrências)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '16%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Technician Productivity Leaderboard */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
              <Users size={18} className="text-[#0f766e]" />
              Produtividade da Equipe Técnica
            </h3>
            <p className="text-xs text-slate-500 mb-6">Acompanhamento de volume e agilidade das vistorias concluídas.</p>

            <div className="divide-y divide-slate-100">
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-[#0f766e] font-bold text-xs flex items-center justify-center">
                    CS
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Carlos Silva</div>
                    <div className="text-xs text-slate-500">42 inspeções • 98% no prazo</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Destaque
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    SJ
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Sarah Jenkins</div>
                    <div className="text-xs text-slate-500">38 inspeções • 95% no prazo</div>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  Normal
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    RO
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Rodrigo Oliveira</div>
                    <div className="text-xs text-slate-500">34 inspeções • 91% no prazo</div>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  Normal
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

'use client';

import React from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  ExternalLink, 
  ChevronRight, 
  Headphones,
  CheckCircle2
} from 'lucide-react';

export default function SupportPage() {
  return (
    <>
      <TopHeader 
        title="Suporte & Central de Ajuda"
        context={
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">FieldOps Desktop</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800">Suporte Técnico</span>
          </div>
        }
      />

      <div className="p-8 max-w-5xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <HelpCircle className="text-[#0f766e]" size={32} />
            Central de Ajuda & Documentação
          </h1>
          <p className="text-slate-500 mt-1">
            Recursos, documentação de integração com o app mobile e canais de suporte técnico do FieldOps.
          </p>
        </div>

        {/* Support Options Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="p-3 bg-teal-50 text-[#0f766e] rounded-lg w-fit mb-4">
              <BookOpen size={24} />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Documentação da API</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Consulte os endpoints REST, contratos JSON de inspeções, clientes e equipamentos.
            </p>
            <a 
              href="http://localhost:8080/swagger-ui.html" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0f766e] hover:underline"
            >
              Acessar Swagger UI
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg w-fit mb-4">
              <MessageSquare size={24} />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Guia do Aplicativo Mobile</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Instruções para sincronização offline, captura de fotos e coleta de assinaturas digitais em campo.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
              Ver Tutorial de Operação
            </span>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg w-fit mb-4">
              <Headphones size={24} />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Atendimento Técnico</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Precisa de ajuda imediata ou identificou um problema operacional? Fale com nosso time de suporte.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600">
              suporte@fieldops.com.br
            </span>
          </div>
        </div>

        {/* System Health / Operational Status */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            Status dos Serviços FieldOps
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
              <span className="text-slate-700 font-medium">Backend REST API</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">Online (8080)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
              <span className="text-slate-700 font-medium">Banco de Dados PostgreSQL</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">Conectado</span>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
              <span className="text-slate-700 font-medium">Serviço de Sincronismo</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">Ativo</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

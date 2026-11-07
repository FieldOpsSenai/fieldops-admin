'use client';

import {
  BarChart3,
  Construction,
} from 'lucide-react';

import TopHeader from '@/components/layout/TopHeader';

export default function ReportsPage() {
  return (
    <>
      <TopHeader title="Relatórios" />

      <main className="p-8 max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Construction size={26} />
          </div>

          <h1 className="text-xl font-bold text-slate-900 mt-4">
            Relatórios em preparação
          </h1>

          <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
            Indicadores e relatórios serão disponibilizados
            quando os dados necessários estiverem expostos
            pela API do FieldOps.
          </p>

          <div className="inline-flex items-center gap-2 mt-5 text-xs font-semibold text-slate-500">
            <BarChart3 size={14} />
            Funcionalidade P1
          </div>
        </div>
      </main>
    </>
  );
}

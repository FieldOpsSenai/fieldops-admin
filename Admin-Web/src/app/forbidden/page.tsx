'use client';

import {
  ArrowLeft,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

import { authService } from '@/lib/api/services';

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">

        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <ShieldAlert size={28} />
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          Acesso não autorizado
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Seu perfil não possui acesso à interface administrativa
          do FieldOps. Esta área é destinada a administradores e
          supervisores.
        </p>

        <p className="mt-2 text-xs text-slate-500">
          Técnicos devem utilizar o aplicativo de campo para executar
          as inspeções atribuídas.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          <button
            type="button"
            onClick={() => authService.logout()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#115e59]"
          >
            <LogOut size={16} />
            Sair
          </button>

        </div>
      </section>
    </main>
  );
}
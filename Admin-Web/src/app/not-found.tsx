import Link from 'next/link';

import {
  ArrowLeft,
  MapPinned,
  SearchX,
} from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <section className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-xl bg-teal-50 text-[#0f766e] flex items-center justify-center">
          <SearchX size={27} />
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <MapPinned size={14} />
          FieldOps
        </div>

        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          Página não encontrada
        </h1>

        <p className="mt-3 text-sm text-slate-600 leading-6">
          O endereço informado não
          existe ou a página foi
          movida para outra rota do
          sistema.
        </p>

        <Link
          href="/dashboard"
          className="mt-7 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-sm font-bold transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar ao Dashboard
        </Link>
      </section>
    </main>
  );
}
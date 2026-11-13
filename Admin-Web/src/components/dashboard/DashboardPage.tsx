'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopHeader from '@/components/layout/TopHeader';
import { clienteService, equipamentoService, inspecaoService, type ApiInspection } from '@/lib/api/services';

type Snapshot = { inspections: number | null; pending: number | null; completed: number | null; equipment: number | null; clients: number | null; recent: ApiInspection[] | null };
const empty: Snapshot = { inspections: null, pending: null, completed: null, equipment: null, clients: null, recent: null };
const labels: Record<ApiInspection['status'], string> = { DRAFT: 'Pendente', ASSIGNED: 'Agendada', IN_PROGRESS: 'Em andamento', APPROVED: 'Concluída', CANCELED: 'Cancelada', SUBMITTED: 'Enviada', UNDER_REVIEW: 'Em revisão', REJECTED: 'Rejeitada' };

export default function DashboardPage() {
  const [data, setData] = useState<Snapshot>(empty);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const count = (status?: ApiInspection['status']) => inspecaoService.listarPagina({ page: 0, size: 1, status }, controller.signal).then((page) => page.totalElements);
    void Promise.allSettled([
      count(),
      Promise.all([count('DRAFT'), count('ASSIGNED'), count('IN_PROGRESS')]).then((values) => values.reduce((sum, value) => sum + value, 0)),
      count('APPROVED'),
      equipamentoService.listarPagina({ page: 0, size: 1, status: 'ACTIVE' }, controller.signal).then((page) => page.totalElements),
      clienteService.listarPagina({ page: 0, size: 1, status: 'ACTIVE' }, controller.signal).then((page) => page.totalElements),
      inspecaoService.listarPagina({ page: 0, size: 5, sort: 'id,desc' }, controller.signal).then((page) => page.content),
    ]).then(([inspections, pending, completed, equipment, clients, recent]) => {
      if (!active) return;
      setData({ inspections: inspections.status === 'fulfilled' ? inspections.value : null,
        pending: pending.status === 'fulfilled' ? pending.value : null,
        completed: completed.status === 'fulfilled' ? completed.value : null,
        equipment: equipment.status === 'fulfilled' ? equipment.value : null,
        clients: clients.status === 'fulfilled' ? clients.value : null,
        recent: recent.status === 'fulfilled' ? recent.value : null });
      setHasError([inspections, pending, completed, equipment, clients, recent].some((result) => result.status === 'rejected'));
      setLoading(false);
    });
    return () => { active = false; controller.abort(); };
  }, [revision]);
  const metrics = [
    { title: 'Total de inspeções', value: data.inspections }, { title: 'Inspeções pendentes', value: data.pending },
    { title: 'Inspeções concluídas', value: data.completed }, { title: 'Equipamentos ativos', value: data.equipment },
  ];
  return <><TopHeader title="Painel operacional" /><main className="mx-auto max-w-7xl space-y-6 p-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold text-slate-900">Painel operacional</h1><p className="text-sm text-slate-500">Acompanhe as inspeções e os cadastros ativos.</p></div><div className="flex gap-3"><button type="button" disabled={loading} onClick={() => { setLoading(true); setRevision((value) => value + 1); }} className="rounded-lg border px-4 py-2 text-sm">Atualizar</button><Link href="/inspections/new" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Nova inspeção</Link></div></header>
    {hasError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Não foi possível carregar todos os dados. Valores indisponíveis aparecem como —. Tente atualizar.</div>}
    <section aria-label="Métricas" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map((metric) => <div key={metric.title} className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-xs font-bold uppercase text-slate-500">{metric.title}</h2><p className="mt-3 text-3xl font-bold text-slate-900">{loading ? '…' : metric.value ?? '—'}</p></div>)}</section>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b p-5"><h2 className="font-bold">Últimos registros de inspeção</h2><Link href="/inspections" className="text-sm text-teal-700 underline">Ver todas</Link></div>
      {loading ? <p role="status" className="p-5">Carregando dados…</p> : data.recent === null ? <p className="p-5 text-slate-500">Inspeções indisponíveis.</p> : data.recent.length === 0 ? <p className="p-5 text-slate-500">Nenhuma inspeção cadastrada.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr>{['ID', 'Descrição', 'Cliente', 'Técnico', 'Estado'].map((column) => <th className="p-3" key={column}>{column}</th>)}</tr></thead><tbody>{data.recent.map((item) => <tr key={item.id} className="border-t"><td className="p-3">#{item.id}</td><td className="p-3">{item.title}</td><td className="p-3">{item.clientName || '—'}</td><td className="p-3">{item.technicianName || '—'}</td><td className="p-3">{labels[item.status] ?? item.status}</td></tr>)}</tbody></table></div>}
    </section>
    <p className="text-sm text-slate-600">Clientes ativos: {loading ? '…' : data.clients ?? '—'}</p>
  </main></>;
}
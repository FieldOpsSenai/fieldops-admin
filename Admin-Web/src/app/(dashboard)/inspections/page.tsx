'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopHeader from '@/components/layout/TopHeader';
import Pagination from '@/components/shared/Pagination';
import { getApiErrorMessage } from '@/lib/api/errorMessage';
import { inspecaoService, type ApiInspection, type InspectionQuery } from '@/lib/api/services';
import type { ApiPage } from '@/lib/api/services/apiPage';

const statuses: Record<ApiInspection['status'], string> = {
  DRAFT: 'Pendente', ASSIGNED: 'Agendada', IN_PROGRESS: 'Em andamento', SUBMITTED: 'Enviada',
  UNDER_REVIEW: 'Em revisão', APPROVED: 'Concluída', REJECTED: 'Rejeitada', CANCELED: 'Cancelada',
};
const priorities: Record<NonNullable<ApiInspection['priority']>, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', CRITICAL: 'Urgente',
};
type Filters = { name: string; status: string; technicianName: string; clientName: string; priority: string };
const initialFilters: Filters = { name: '', status: '', technicianName: '', clientName: '', priority: '' };

export default function InspectionsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [result, setResult] = useState<ApiPage<ApiInspection> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<ApiInspection | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setError('');
      const query: InspectionQuery = { page, size, name: filters.name.trim() || undefined,
        status: (filters.status || undefined) as InspectionQuery['status'], technicianName: filters.technicianName.trim() || undefined,
        clientName: filters.clientName.trim() || undefined, priority: (filters.priority || undefined) as InspectionQuery['priority'] };
      void inspecaoService.listarPagina(query, controller.signal).then((data) => {
        if (!controller.signal.aborted) setResult(data);
      }).catch((failure: unknown) => {
        if (!controller.signal.aborted) { setResult(null); setError(getApiErrorMessage(failure, 'Não foi possível carregar as inspeções.')); }
      }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [filters, page, size, reload]);

  function updateFilter(key: keyof Filters, value: string) { setPage(0); setFilters((current) => ({ ...current, [key]: value })); }
  async function cancelInspection(event: React.FormEvent) {
    event.preventDefault();
    if (!cancelTarget || saving) return;
    setSaving(true); setActionError('');
    try {
      await inspecaoService.cancelar(cancelTarget.id, reason);
      setCancelTarget(null); setReason(''); setReload((value) => value + 1);
    } catch (failure) { setActionError(getApiErrorMessage(failure, 'Não foi possível cancelar a inspeção.')); }
    finally { setSaving(false); }
  }
  const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
  return <><TopHeader title="Inspeções" /><main className="mx-auto max-w-7xl space-y-6 p-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold text-slate-900">Inspeções</h1><p className="text-sm text-slate-500">Acompanhe as atividades planejadas e seu andamento.</p></div><Link href="/inspections/new" className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">Nova inspeção</Link></header>
    <section aria-label="Filtros de inspeções" className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="text-xs font-bold">Pesquisa<input className={input} value={filters.name} onChange={(e) => updateFilter('name', e.target.value)} /></label>
      <label className="text-xs font-bold">Estado<select className={input} value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}><option value="">Todos</option>{Object.entries(statuses).filter(([key]) => !['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'].includes(key)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="text-xs font-bold">Técnico (ID)<input type="number" min="1" className={input} value={filters.technicianName} onChange={(e) => updateFilter('technicianName', e.target.value)} /></label>
      <label className="text-xs font-bold">Cliente (ID)<input type="number" min="1" className={input} value={filters.clientName} onChange={(e) => updateFilter('clientName', e.target.value)} /></label>
      <label className="text-xs font-bold">Prioridade<select className={input} value={filters.priority} onChange={(e) => updateFilter('priority', e.target.value)}><option value="">Todas</option>{Object.entries(priorities).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </section>
    {actionError && !cancelTarget && <p role="alert" className="rounded bg-red-50 p-3 text-red-700">{actionError}</p>}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {loading && <p role="status" className="p-5">Carregando inspeções…</p>}
      {error && <div role="alert" className="p-5 text-red-700">{error} <button className="underline" onClick={() => setReload((value) => value + 1)}>Tentar novamente</button></div>}
      {!loading && !error && result?.content.length === 0 && <p className="p-5 text-slate-500">Nenhuma inspeção encontrada para os filtros informados.</p>}
      {!loading && !error && !!result?.content.length && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{['Inspeção', 'Cliente / local', 'Equipamento', 'Técnico', 'Prioridade / prazo', 'Estado', 'Ações'].map((heading) => <th className="p-3" key={heading}>{heading}</th>)}</tr></thead><tbody>{result.content.map((item) => <tr className="border-t" key={item.id}><td className="p-3 font-semibold">#{item.id} · {item.title}</td><td className="p-3">{item.clientName ?? '—'}<br />{item.siteName ?? '—'}</td><td className="p-3">{item.equipmentName ?? '—'}</td><td className="p-3">{item.technicianName ?? '—'}</td><td className="p-3">{item.priority ? priorities[item.priority] : '—'}<br />{item.dueDate ?? '—'}{item.overdue ? ' · Atrasada' : ''}</td><td className="p-3">{statuses[item.status] ?? item.status}</td><td className="p-3">{!['APPROVED', 'CANCELED', 'SUBMITTED', 'UNDER_REVIEW'].includes(item.status) && <button type="button" className="text-red-700 underline" onClick={() => { setCancelTarget(item); setReason(''); setActionError(''); }}>Cancelar</button>}</td></tr>)}</tbody></table></div>}
      {result && !error && <Pagination page={page} size={size} total={result.totalElements} pages={result.totalPages} loading={loading} onPage={setPage} onSize={(value) => { setPage(0); setSize(value); }} />}
    </section>
    {cancelTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><form onSubmit={cancelInspection} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6"><h2 className="text-xl font-bold">Cancelar inspeção #{cancelTarget.id}</h2><p className="text-sm text-slate-600">Confirme o cancelamento e informe a justificativa. A API não disponibiliza consulta do histórico de cancelamentos.</p>{actionError && <p role="alert" className="text-red-700">{actionError}</p>}<label className="block text-sm font-semibold">Motivo do cancelamento<textarea className={input} value={reason} onChange={(e) => setReason(e.target.value)} minLength={10} maxLength={1000} required rows={4} /></label><div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={() => setCancelTarget(null)}>Voltar</button><button type="submit" disabled={saving} className="rounded-lg bg-red-700 px-4 py-2 text-white">{saving ? 'Cancelando…' : 'Confirmar cancelamento'}</button></div></form></div>}
  </main></>;
}

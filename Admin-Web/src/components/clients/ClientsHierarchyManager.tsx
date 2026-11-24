'use client';

import { useEffect, useState } from 'react';
import { Building2, MapPin, Wrench, Plus, RefreshCw, Loader2, X, ChevronRight } from 'lucide-react';
import TopHeader from '@/components/layout/TopHeader';
import Pagination from '@/components/shared/Pagination';
import EquipmentQrCode from './EquipmentQrCode';
import EquipmentQrLookup from './EquipmentQrLookup';
import { clienteService, localService, equipamentoService, type ClienteDTO, type LocalDTO, type EquipamentoDTO } from '@/lib/api/services';
import { type ApiPage, type CadastroQuery } from '@/lib/api/services/apiPage';
import { getApiErrorMessage } from '@/lib/api/errorMessage';

export type StepType = 1 | 2 | 3;
type Entity = ClienteDTO | LocalDTO | EquipamentoDTO;
type Query = CadastroQuery & { step: StepType; page: number; size: number };
type FormValues = { nome: string; cnpj: string; telefone: string; email: string; endereco: string; numeroSerie: string; tipo: string; parentId: string };
const labels = { 1: 'Clientes', 2: 'Locais', 3: 'Equipamentos' };
const singular = { 1: 'cliente', 2: 'local', 3: 'equipamento' };
const emptyForm: FormValues = { nome: '', cnpj: '', telefone: '', email: '', endereco: '', numeroSerie: '', tipo: '', parentId: '' };
const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600';
const buttonClass = 'rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50';
async function loadPage(query: Query, signal?: AbortSignal): Promise<ApiPage<Entity>> {
  if (query.step === 1) return clienteService.listarPagina(query, signal);
  if (query.step === 2) return localService.listarPagina(query, signal);
  return equipamentoService.listarPagina(query, signal);
}

function ParentSelect({ step, value, onChange }: { step: 1 | 2; value: string; onChange: (value: string) => void }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: ApiPage<Entity>; error?: string }>();
  const key = JSON.stringify({ step, search, page });
  useEffect(() => {
    const controller = new AbortController();
    const query = JSON.parse(key) as Query;
    const timer = setTimeout(() => {
      void loadPage({ ...query, size: 10, status: 'ACTIVE' }, controller.signal).then(
        (data) => { if (!controller.signal.aborted) setResult({ key, data }); },
        (error) => { if (!controller.signal.aborted) setResult({ key, error: getApiErrorMessage(error) }); },
      );
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key]);
  const data = result?.key === key ? result.data : undefined;
  const options = data?.content ?? [];
  return <fieldset className="space-y-2 rounded-lg border border-slate-200 p-3">
    <legend className="px-1 text-sm font-semibold">{step === 1 ? 'Cliente vinculado' : 'Local de instalação'} *</legend>
    <input aria-label="Pesquisar vínculo" placeholder={step === 1 ? 'Pesquisar cliente ativo' : 'Pesquisar local ativo'} value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className={inputClass} />
    <select aria-label={step === 1 ? 'Cliente vinculado' : 'Local de instalação'} required value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      <option value="">Selecione…</option>
      {value && !options.some((item) => String(item.id) === value) && <option value={value}>Vínculo atual #{value}</option>}
      {options.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
    </select>
    {result?.key === key && result.error && <p role="alert" className="text-sm text-red-700">{result.error}</p>}
    <div className="flex justify-between text-xs"><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Anteriores</button><span>{data ? data.totalElements + ' disponíveis' : 'Carregando…'}</span><button type="button" disabled={!data || page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Mais opções</button></div>
  </fieldset>;
}

export default function ClientsHierarchyManager({ initialStep = 1 }: { initialStep?: StepType }) {
  const [query, setQuery] = useState<Query>({ step: initialStep, page: 0, size: 10, search: '' });
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: ApiPage<Entity>; error?: string }>();
  const [selected, setSelected] = useState<Entity | null>(null);
  const [client, setClient] = useState<ClienteDTO | null>(null);
  const [site, setSite] = useState<LocalDTO | null>(null);
  const [modal, setModal] = useState<{ entity?: Entity } | null>(null);
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const requestKey = JSON.stringify({ ...query, revision });

  useEffect(() => {
    const controller = new AbortController();
    const params = JSON.parse(requestKey) as Query;
    const timer = setTimeout(() => {
      void loadPage(params, controller.signal).then((data) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, data });
      }).catch((error) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, error: getApiErrorMessage(error, 'Não foi possível carregar os cadastros.') });
      });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [requestKey]);

  const loading = result?.key !== requestKey;
  const data = !loading ? result?.data : undefined;
  const error = !loading ? result?.error : undefined;
  const rows = data?.content ?? [];
  const step = query.step;
  const Icon = step === 1 ? Building2 : step === 2 ? MapPin : Wrench;
  const updateQuery = (patch: Partial<Query>) => setQuery((current) => ({ ...current, ...patch, page: patch.page ?? 0 }));
  const goTo = (next: StepType) => {
    setClient(null); setSite(null); setSelected(null); setNotice('');
    setQuery({ step: next, page: 0, size: query.size, search: '' });
  };
  const openForm = (entity?: Entity) => {
    setFormError('');
    setValues({
      ...emptyForm, nome: entity?.nome ?? '',
      ...(step === 1 && entity ? { cnpj: (entity as ClienteDTO).cnpj, telefone: (entity as ClienteDTO).telefone, email: (entity as ClienteDTO).email } : {}),
      ...(step === 2 ? { endereco: (entity as LocalDTO | undefined)?.endereco ?? '', parentId: String((entity as LocalDTO | undefined)?.clienteId ?? client?.id ?? '') } : {}),
      ...(step === 3 ? { numeroSerie: (entity as EquipamentoDTO | undefined)?.numeroSerie ?? '', tipo: (entity as EquipamentoDTO | undefined)?.tipo ?? '', parentId: String((entity as EquipamentoDTO | undefined)?.localId ?? site?.id ?? '') } : {}),
    });
    setModal({ entity });
  };
  const change = (field: keyof FormValues, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const refresh = () => setRevision((current) => current + 1);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!values.nome.trim()) { setFormError('Informe o nome.'); return; }
    if (step === 1 && values.cnpj.replace(/\D/g, '').length !== 14) { setFormError('Informe um CNPJ com 14 dígitos.'); return; }
    if (step !== 1 && !values.parentId) { setFormError('Selecione o vínculo obrigatório.'); return; }
    setSaving(true); setFormError(''); setNotice('');
    try {
      let saved: Entity;
      if (step === 1) {
        const payload = { nome: values.nome.trim(), cnpj: values.cnpj.trim(), telefone: values.telefone.trim(), email: values.email.trim() };
        saved = modal?.entity ? await clienteService.atualizar(modal.entity.id, payload) : await clienteService.cadastrar(payload);
      } else if (step === 2) {
        const payload = { nome: values.nome.trim(), endereco: values.endereco.trim(), clienteId: Number(values.parentId) };
        saved = modal?.entity ? await localService.atualizar(modal.entity.id, payload) : await localService.cadastrar(payload);
      } else {
        const payload = { nome: values.nome.trim(), numeroSerie: values.numeroSerie.trim(), tipo: values.tipo.trim(), localId: Number(values.parentId) };
        saved = modal?.entity ? await equipamentoService.atualizar(modal.entity.id, payload) : await equipamentoService.cadastrar(payload);
      }
      setSelected(saved); setModal(null);
      setNotice('Registro ' + (modal?.entity ? 'atualizado' : 'cadastrado') + ' com sucesso.');
      refresh();
    } catch (cause) { setFormError(getApiErrorMessage(cause)); }
    finally { setSaving(false); }
  };
  const inactivate = async (entity: Entity) => {
    if (!window.confirm('Inativar "' + entity.nome + '"? Os vínculos históricos serão preservados.')) return;
    setSaving(true); setNotice('');
    try {
      if (step === 1) await clienteService.inativar(entity.id);
      else if (step === 2) await localService.inativar(entity.id);
      else await equipamentoService.inativar(entity.id);
      if (selected?.id === entity.id) setSelected({ ...entity, ativo: false });
      setNotice('Registro inativado com sucesso.'); refresh();
    } catch (cause) { setNotice(getApiErrorMessage(cause)); }
    finally { setSaving(false); }
  };

  return <>
    <TopHeader title="Clientes & Ativos" />
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900"><Icon className="text-teal-700" />{labels[step]}</h1><p className="mt-1 text-sm text-slate-500">Cadastros e vínculos da operação FieldOps.</p></div>
        <div className="flex gap-2"><button type="button" aria-label="Atualizar cadastros" disabled={loading} onClick={refresh} className="rounded-lg border border-slate-200 bg-white px-3 py-2"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button><button type="button" onClick={() => openForm()} className={buttonClass}><Plus className="mr-1 inline" size={16} />Cadastrar {singular[step]}</button></div>
      </header>
      <nav aria-label="Etapas dos cadastros" className="flex gap-2">{([1, 2, 3] as StepType[]).map((item) => <button type="button" key={item} onClick={() => goTo(item)} aria-current={step === item ? 'page' : undefined} className={'flex-1 rounded-xl border p-3 text-sm font-semibold ' + (step === item ? 'border-teal-700 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white text-slate-500')}>{item}. {labels[item]}</button>)}</nav>
      {(client || site) && <div className="flex flex-wrap items-center gap-2 rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-800"><Building2 size={16} />{client?.nome}{site && <><ChevronRight size={14} />{site.nome}</>}<button type="button" onClick={() => goTo(step)} className="ml-auto underline">Limpar vínculo</button></div>}
      {notice && <div role="status" className="flex justify-between gap-4 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">{notice}<button aria-label="Fechar mensagem" onClick={() => setNotice('')}><X size={16} /></button></div>}
      <section className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="min-w-48 flex-1 text-xs font-semibold text-slate-600">Pesquisar<input aria-label="Pesquisar cadastros" placeholder={step === 1 ? 'Nome, documento ou e-mail' : 'Nome'} value={query.search ?? ''} onChange={(e) => updateQuery({ search: e.target.value })} className={inputClass} /></label>
        <label className="text-xs font-semibold text-slate-600">Status<select aria-label="Filtrar status" value={query.status ?? ''} onChange={(e) => updateQuery({ status: (e.target.value || undefined) as CadastroQuery['status'] })} className={inputClass}><option value="">Todos disponíveis</option><option value="ACTIVE">Ativos</option></select></label>
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {loading ? <div role="status" className="flex items-center justify-center gap-2 p-12 text-slate-500"><Loader2 className="animate-spin" size={20} />Carregando cadastros…</div>
            : error ? <div role="alert" className="p-8 text-sm text-red-700">{error}<button onClick={refresh} className="ml-3 underline">Tentar novamente</button></div>
            : rows.length === 0 ? <p className="p-12 text-center text-slate-500">Nenhum registro encontrado. Altere a pesquisa ou os filtros.</p>
            : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Nome</th><th className="p-4">{step === 1 ? 'Contato' : step === 2 ? 'Cliente' : 'Local'}</th><th className="p-4">Status</th><th className="p-4 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((item) => <tr key={item.id} className={selected?.id === item.id ? 'bg-teal-50/50' : 'hover:bg-slate-50'}>
              <td className="p-4"><button type="button" onClick={() => setSelected(item)} className="text-left font-semibold text-slate-900">{item.nome}</button><div className="mt-1 text-xs text-slate-400">#{item.id}</div></td>
              <td className="p-4 text-slate-600">{step === 1 ? (item as ClienteDTO).email : step === 2 ? ((item as LocalDTO).clienteNome || '#' + (item as LocalDTO).clienteId) : ((item as EquipamentoDTO).localNome || '#' + (item as EquipamentoDTO).localId)}</td>
              <td className="p-4"><span className={'rounded-full px-2 py-1 text-xs font-semibold ' + (item.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{item.ativo ? 'Ativo' : 'Inativo'}</span></td>
              <td className="p-4"><div className="flex justify-end gap-2"><button title={'Editar ' + singular[step]} onClick={() => openForm(item)} className="text-xs font-semibold text-teal-700">Editar</button>{item.ativo && <button disabled={saving} onClick={() => void inactivate(item)} className="text-xs text-red-700">Inativar</button>}{step < 3 && <button className="rounded bg-teal-700 px-2 py-1 text-xs text-white" onClick={() => {
                setSelected(null);
                if (step === 1) { setClient(item as ClienteDTO); setSite(null); setQuery({ step: 2, page: 0, size: query.size, clientId: item.id, search: '' }); }
                else { setSite(item as LocalDTO); setQuery({ step: 3, page: 0, size: query.size, siteId: item.id, search: '' }); }
              }}>{step === 1 ? 'Locais' : 'Equipamentos'}</button>}</div></td>
            </tr>)}</tbody></table></div>}
          <Pagination page={query.page} size={query.size} total={data?.totalElements ?? 0} pages={data?.totalPages ?? 0} loading={loading} onPage={(page) => updateQuery({ page })} onSize={(size) => updateQuery({ size })} />
        </section>
        <aside className="space-y-4">
          {step === 3 && <EquipmentQrLookup onSelect={setSelected} />}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-bold text-slate-800">Detalhes</h2>
            {!selected ? <p className="text-sm text-slate-500">Selecione um registro na lista para consultar seus dados.</p> : <>
              <h3 className="font-semibold text-slate-900">{selected.nome}</h3><p className="mt-1 text-xs text-slate-500">#{selected.id} · {selected.ativo ? 'Ativo' : 'Inativo'}</p>
              <dl className="my-4 space-y-3 break-words text-sm">
                {step === 1 && <><dt className="text-xs text-slate-500">CNPJ</dt><dd>{(selected as ClienteDTO).cnpj}</dd><dt className="text-xs text-slate-500">Contato</dt><dd>{(selected as ClienteDTO).email}<br />{(selected as ClienteDTO).telefone}</dd></>}
                {step === 2 && <><dt className="text-xs text-slate-500">Endereço</dt><dd>{(selected as LocalDTO).endereco || 'Não informado'}</dd><dt className="text-xs text-slate-500">Cliente</dt><dd>{(selected as LocalDTO).clienteNome || '#' + (selected as LocalDTO).clienteId}</dd></>}
                {step === 3 && <><dt className="text-xs text-slate-500">Número de série</dt><dd>{(selected as EquipamentoDTO).numeroSerie}</dd><dt className="text-xs text-slate-500">Tipo</dt><dd>{(selected as EquipamentoDTO).tipo || 'Não informado'}</dd><dt className="text-xs text-slate-500">Local</dt><dd>{(selected as EquipamentoDTO).localNome || '#' + (selected as EquipamentoDTO).localId}</dd></>}
              </dl><button onClick={() => openForm(selected)} className={buttonClass}>Editar registro</button>
            </>}
          </section>
          {step === 3 && selected && <EquipmentQrCode value={(selected as EquipamentoDTO).qrCode} name={selected.nome} />}
        </aside>
      </div>
    </main>
    {modal && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4"><section role="dialog" aria-modal="true" aria-labelledby="entity-form-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
      <header className="mb-5 flex justify-between gap-3"><h2 id="entity-form-title" className="text-lg font-bold text-slate-900">{modal.entity ? 'Editar' : 'Cadastrar'} {singular[step]}</h2><button disabled={saving} aria-label="Fechar formulário" onClick={() => setModal(null)}><X size={20} /></button></header>
      <form onSubmit={save} className="space-y-4">
        {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
        <label className="block text-sm font-semibold text-slate-700">Nome *<input required autoFocus maxLength={200} value={values.nome} onChange={(e) => change('nome', e.target.value)} className={inputClass} /></label>
        {step === 1 && <>
          <label className="block text-sm font-semibold text-slate-700">CNPJ *<input required maxLength={18} value={values.cnpj} onChange={(e) => change('cnpj', e.target.value)} className={inputClass} /></label>
          <label className="block text-sm font-semibold text-slate-700">Telefone<input maxLength={20} value={values.telefone} onChange={(e) => change('telefone', e.target.value)} className={inputClass} /></label>
          <label className="block text-sm font-semibold text-slate-700">E-mail<input type="email" maxLength={100} value={values.email} onChange={(e) => change('email', e.target.value)} className={inputClass} /></label>
        </>}
        {step === 2 && <label className="block text-sm font-semibold text-slate-700">Endereço *<input required maxLength={255} value={values.endereco} onChange={(e) => change('endereco', e.target.value)} className={inputClass} /></label>}
        {step === 3 && <>
          <label className="block text-sm font-semibold text-slate-700">Número de série *<input required maxLength={100} value={values.numeroSerie} onChange={(e) => change('numeroSerie', e.target.value)} className={inputClass} /></label>
          <label className="block text-sm font-semibold text-slate-700">Tipo / Modelo<input maxLength={100} value={values.tipo} onChange={(e) => change('tipo', e.target.value)} className={inputClass} /></label>
        </>}
        {step !== 1 && <ParentSelect step={step === 2 ? 1 : 2} value={values.parentId} onChange={(value) => change('parentId', value)} />}
        <footer className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={saving} onClick={() => setModal(null)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button><button disabled={saving} className={buttonClass}>{saving ? 'Salvando…' : modal.entity ? 'Salvar Alterações' : 'Cadastrar'}</button></footer>
      </form>
    </section></div>}
  </>;
}

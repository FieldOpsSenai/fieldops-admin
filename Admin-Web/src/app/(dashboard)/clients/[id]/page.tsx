'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  ChevronRight,
  Loader2,
  MapPin,
  Plus,
  Wrench,
} from 'lucide-react';

import TopHeader from '@/components/layout/TopHeader';
import {
  clienteService,
  equipamentoService,
  localService,
  type ClienteDTO,
  type EquipamentoDTO,
  type LocalDTO,
} from '@/lib/api/services';

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.length !== 14) return value;

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const clientId = Number(params.id);
  const [client, setClient] = useState<ClienteDTO | null>(null);
  const [sites, setSites] = useState<LocalDTO[]>([]);
  const [equipment, setEquipment] = useState<EquipamentoDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(clientId) || clientId <= 0) {
      return;
    }

    let active = true;

    const loadClientStructure = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [clientResult, sitesResult] = await Promise.all([
          clienteService.buscarPorId(clientId),
          localService.listarPorCliente(clientId),
        ]);

        if (!active) return;

        setClient(clientResult);
        setSites(sitesResult);
        setEquipmentLoading(true);

        const equipmentResult = await equipamentoService.listarTodos();
        if (active) {
          const siteIds = new Set(sitesResult.map((site) => site.id));
          setEquipment(equipmentResult.filter((item) => siteIds.has(item.localId)));
        }
      } catch (error: unknown) {
        console.error('Erro ao carregar estrutura do cliente:', error);
        if (active) {
          setErrorMessage('Não foi possível carregar os dados deste cliente. Atualize a página e tente novamente.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
          setEquipmentLoading(false);
        }
      }
    };

    void loadClientStructure();
    return () => {
      active = false;
    };
  }, [clientId]);

  const equipmentBySite = useMemo(() => {
    return new Map(
      sites.map((site) => [
        site.id,
        equipment.filter((item) => item.localId === site.id),
      ])
    );
  }, [equipment, sites]);

  return (
    <>
      <TopHeader
        title={client?.nome ?? 'Cliente'}
        context={
          <div className="flex items-center gap-2 text-sm">
            <Link href="/clients" className="text-slate-500 hover:text-slate-700">Clientes</Link>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800">Estrutura do cliente</span>
          </div>
        }
      />

      <main className="mx-auto max-w-7xl space-y-6 p-8">
        <Link href="/clients" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700">
          <ArrowLeft size={16} /> Voltar para clientes
        </Link>

        {((!Number.isInteger(clientId) || clientId <= 0) || errorMessage) && (
          <div role="alert" className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {!Number.isInteger(clientId) || clientId <= 0
              ? 'O identificador do cliente é inválido.'
              : errorMessage}
          </div>
        )}

        {Number.isInteger(clientId) && clientId > 0 && isLoading ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-12 text-slate-500">
            <Loader2 size={22} className="animate-spin text-teal-700" /> Carregando cliente e locais...
          </div>
        ) : Number.isInteger(clientId) && clientId > 0 && client ? (
          <>
            <section className="flex flex-col justify-between gap-4 rounded-xl border border-teal-200 bg-teal-50 p-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-teal-700">
                  <Building2 size={23} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Cliente</p>
                  <h1 className="text-xl font-bold text-slate-900">{client.nome}</h1>
                  <p className="mt-1 text-sm text-slate-600">CNPJ {formatCnpj(client.cnpj)} · {client.email}</p>
                </div>
              </div>
              <Link
                href={`/sites?clientId=${client.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800"
              >
                <Plus size={16} /> Adicionar local
              </Link>
            </section>

            <section className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Locais e equipamentos</h2>
                <p className="mt-1 text-sm text-slate-500">Veja os locais deste cliente e os equipamentos cadastrados em cada um.</p>
              </div>
              <span className="text-sm font-semibold text-slate-600">{sites.length} {sites.length === 1 ? 'local' : 'locais'}</span>
            </section>

            {sites.length === 0 ? (
              <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <MapPin size={34} className="mx-auto text-slate-300" />
                <h3 className="mt-3 font-bold text-slate-800">Nenhum local cadastrado</h3>
                <p className="mt-1 text-sm text-slate-500">Adicione o primeiro local para começar a organizar os equipamentos deste cliente.</p>
                <Link href={`/sites?clientId=${client.id}`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800">
                  <Plus size={16} /> Adicionar local
                </Link>
              </section>
            ) : (
              <section className="space-y-4">
                {sites.map((site) => {
                  const siteEquipment = equipmentBySite.get(site.id) ?? [];

                  return (
                    <article key={site.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <header className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><MapPin size={19} /></div>
                          <div>
                            <h3 className="font-bold text-slate-900">{site.nome}</h3>
                            <p className="mt-1 text-sm text-slate-500">{site.endereco || 'Endereço não informado'}</p>
                          </div>
                        </div>
                        <Link href={`/equipment?siteId=${site.id}`} className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:self-auto">
                          <Plus size={14} /> Adicionar equipamento
                        </Link>
                      </header>

                      <div className="p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700"><Wrench size={16} /> Equipamentos</h4>
                          {!equipmentLoading && <span className="text-xs text-slate-500">{siteEquipment.length} {siteEquipment.length === 1 ? 'equipamento' : 'equipamentos'}</span>}
                        </div>
                        {equipmentLoading ? (
                          <p className="text-sm text-slate-500">Carregando equipamentos...</p>
                        ) : siteEquipment.length === 0 ? (
                          <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">Nenhum equipamento cadastrado neste local.</p>
                        ) : (
                          <ul className="divide-y divide-slate-100">
                            {siteEquipment.map((item) => (
                              <li key={item.id} className="flex flex-col justify-between gap-1 py-3 first:pt-1 sm:flex-row sm:items-center">
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">{item.nome}</p>
                                  <p className="mt-0.5 text-xs text-slate-500">Série: {item.numeroSerie || 'Não informada'}{item.tipo ? ` · ${item.tipo}` : ''}</p>
                                </div>
                                <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${item.ativo ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
                                  {item.ativo ? 'ATIVO' : 'INATIVO'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        ) : null}
      </main>
    </>
  );
}

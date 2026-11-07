'use client';

import React, {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Wrench,
  X,
} from 'lucide-react';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import TopHeader from '@/components/layout/TopHeader';

import {
  clienteService,
  localService,
  type ClienteDTO,
  type LocalDTO,
} from '@/lib/api/services';

type StatusFilter =
  | 'TODOS'
  | 'ATIVOS'
  | 'INATIVOS';

function SitesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialClientId =
    searchParams.get('clientId') || 'TODOS';

  const [locais, setLocais] = useState<LocalDTO[]>([]);
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);

  const [selectedClientId, setSelectedClientId] =
    useState(initialClientId);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('TODOS');

  const [searchTerm, setSearchTerm] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  // Modal
  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');

  const [formClientId, setFormClientId] =
    useState('');

  const [formError, setFormError] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      try {
        const clientsPromise =
          clienteService.listar();

        const sitesPromise =
          initialClientId !== 'TODOS'
            ? localService.listarPorCliente(
                Number(initialClientId)
              )
            : localService.listarTodos();

        const [clientsResult, sitesResult] =
          await Promise.allSettled([
            clientsPromise,
            sitesPromise,
          ]);

        if (!active) {
          return;
        }

        if (
          clientsResult.status === 'fulfilled'
        ) {
          setClientes(clientsResult.value);
        }

        if (
          sitesResult.status === 'fulfilled'
        ) {
          setLocais(sitesResult.value);
        } else {
          console.error(
            'Erro ao carregar locais:',
            sitesResult.reason
          );

          setErrorMessage(
            'Não foi possível carregar os locais da API.'
          );
        }
      } catch (error: unknown) {
        console.error(
          'Erro ao carregar dados de locais:',
          error
        );

        if (active) {
          setErrorMessage(
            'Não foi possível carregar os dados.'
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      active = false;
    };
  }, [initialClientId]);

  const selectedClient = useMemo(() => {
    if (selectedClientId === 'TODOS') {
      return null;
    }

    return (
      clientes.find(
        (cliente) =>
          String(cliente.id) === selectedClientId
      ) || null
    );
  }, [clientes, selectedClientId]);

  const filteredSites = useMemo(() => {
    const term =
      searchTerm.trim().toLowerCase();

    return locais.filter((local) => {
      const matchesSearch =
        !term ||
        local.nome
          .toLowerCase()
          .includes(term) ||
        local.endereco
          .toLowerCase()
          .includes(term) ||
        local.clienteNome
          ?.toLowerCase()
          .includes(term) ||
        String(local.id).includes(term);

      const matchesStatus =
        statusFilter === 'TODOS' ||
        (statusFilter === 'ATIVOS' &&
          local.ativo) ||
        (statusFilter === 'INATIVOS' &&
          !local.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [
    locais,
    searchTerm,
    statusFilter,
  ]);

  const totalAtivos =
    locais.filter((local) => local.ativo)
      .length;

  const totalInativos =
    locais.filter((local) => !local.ativo)
      .length;

  const showSuccess = (message: string) => {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const loadSites = async (
    clientId: string
  ) => {
    if (clientId === 'TODOS') {
      return localService.listarTodos();
    }

    return localService.listarPorCliente(
      Number(clientId)
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const data =
        await loadSites(selectedClientId);

      setLocais(data);
    } catch (error: unknown) {
      console.error(
        'Erro ao atualizar locais:',
        error
      );

      setErrorMessage(
        'Não foi possível atualizar os locais.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClientFilterChange = async (
    clientId: string
  ) => {
    setSelectedClientId(clientId);
    setErrorMessage(null);

    if (clientId === 'TODOS') {
      router.replace('/sites');
    } else {
      router.replace(
        `/sites?clientId=${clientId}`
      );
    }

    setIsRefreshing(true);

    try {
      const data =
        await loadSites(clientId);

      setLocais(data);
    } catch (error: unknown) {
      console.error(
        'Erro ao filtrar locais:',
        error
      );

      setErrorMessage(
        'Não foi possível carregar os locais deste cliente.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const openCreateModal = () => {
    setNome('');
    setEndereco('');
    setFormError(null);

    if (
      selectedClientId !== 'TODOS'
    ) {
      setFormClientId(
        selectedClientId
      );
    } else {
      const firstActiveClient =
        clientes.find(
          (cliente) => cliente.ativo
        );

      setFormClientId(
        firstActiveClient
          ? String(firstActiveClient.id)
          : ''
      );
    }

    setIsCreateOpen(true);
  };

  const handleCreateSite = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setFormError(null);

    if (!formClientId) {
      setFormError(
        'Selecione o cliente responsável pelo local.'
      );
      return;
    }

    if (!nome.trim()) {
      setFormError(
        'Informe o nome do local.'
      );
      return;
    }

    if (!endereco.trim()) {
      setFormError(
        'Informe o endereço do local.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const created =
        await localService.cadastrar({
          nome: nome.trim(),
          endereco: endereco.trim(),
          clienteId:
            Number(formClientId),
        });

      const parentClient =
        clientes.find(
          (cliente) =>
            cliente.id ===
            Number(formClientId)
        );

      const normalizedCreated: LocalDTO = {
        ...created,
        clienteNome:
          created.clienteNome ||
          parentClient?.nome,
      };

      const shouldShowCreated =
        selectedClientId === 'TODOS' ||
        selectedClientId ===
          formClientId;

      if (shouldShowCreated) {
        setLocais((current) => [
          normalizedCreated,
          ...current,
        ]);
      }

      setIsCreateOpen(false);

      showSuccess(
        `Local "${created.nome}" cadastrado com sucesso.`
      );
    } catch (error: unknown) {
      console.error(
        'Erro ao cadastrar local:',
        error
      );

      setFormError(
        'Não foi possível cadastrar o local. Verifique os dados e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <TopHeader
        title="Locais"
        context={
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">
              Administração
            </span>

            <ChevronRight
              size={14}
              className="text-slate-400"
            />

            <span className="font-semibold text-slate-800">
              Locais / Unidades
            </span>
          </div>
        }
      />

      <main className="p-8 max-w-7xl mx-auto space-y-6">
        {successMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-lg shadow-xl">
            <CheckCircle2
              size={20}
              className="text-emerald-400"
            />

            <span className="text-sm font-medium">
              {successMessage}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage(null)
              }
              className="ml-3 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <MapPin
                size={30}
                className="text-[#0f766e]"
              />

              Locais / Unidades
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Gerencie unidades, plantas e locais
              vinculados aos clientes.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  isRefreshing
                    ? 'animate-spin'
                    : ''
                }
              />

              Atualizar
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-sm font-bold"
            >
              <Plus size={17} />
              Novo local
            </button>
          </div>
        </section>

        {/* Context from client */}
        {selectedClient && (
          <section className="border border-teal-200 bg-teal-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-lg bg-white border border-teal-200 flex items-center justify-center text-[#0f766e]">
                <Building2 size={18} />
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Cliente selecionado
                </div>

                <div className="font-bold text-slate-900">
                  {selectedClient.nome}
                </div>
              </div>
            </div>

            <Link
              href="/clients"
              className="text-xs font-bold text-[#0f766e] hover:underline"
            >
              Voltar para clientes
            </Link>
          </section>
        )}

        {/* Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title={
              selectedClient
                ? 'Locais do cliente'
                : 'Total de locais'
            }
            value={locais.length}
          />

          <StatCard
            title="Locais ativos"
            value={totalAtivos}
          />

          <StatCard
            title="Locais inativos"
            value={totalInativos}
          />
        </section>

        {errorMessage && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex gap-3 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="shrink-0 mt-0.5"
            />

            <div className="flex-1">
              <div className="font-bold">
                Erro ao processar a operação
              </div>

              <div className="mt-0.5">
                {errorMessage}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setErrorMessage(null)
              }
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Filters */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Buscar por local, endereço, cliente ou ID..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
            />
          </div>

          <select
            value={selectedClientId}
            disabled={isRefreshing}
            onChange={(event) =>
              void handleClientFilterChange(
                event.target.value
              )
            }
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 disabled:opacity-60"
          >
            <option value="TODOS">
              Todos os clientes
            </option>

            {clientes.map((cliente) => (
              <option
                key={cliente.id}
                value={cliente.id}
              >
                {cliente.nome}
                {!cliente.ativo
                  ? ' (Inativo)'
                  : ''}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as StatusFilter
              )
            }
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-700"
          >
            <option value="TODOS">
              Todos os status
            </option>

            <option value="ATIVOS">
              Ativos
            </option>

            <option value="INATIVOS">
              Inativos
            </option>
          </select>
        </section>

        {/* Table */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center gap-3 text-slate-500">
              <Loader2
                size={30}
                className="animate-spin text-[#0f766e]"
              />

              <span className="text-sm">
                Carregando locais...
              </span>
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="p-12 text-center">
              <MapPin
                size={42}
                className="mx-auto mb-3 text-slate-300"
              />

              <h2 className="font-bold text-slate-800">
                Nenhum local encontrado
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Cadastre uma unidade ou altere os
                filtros da pesquisa.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">
                      Local
                    </th>

                    <th className="px-6 py-4">
                      Endereço
                    </th>

                    <th className="px-6 py-4">
                      Cliente
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      ID
                    </th>

                    <th className="px-6 py-4 text-right">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSites.map(
                    (local) => (
                      <tr
                        key={local.id}
                        className="hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0f766e] flex items-center justify-center">
                              <MapPin
                                size={17}
                              />
                            </div>

                            <div>
                              <div className="font-bold text-sm text-slate-900">
                                {local.nome}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600 max-w-sm">
                          {local.endereco}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Building2
                              size={14}
                              className="text-slate-400"
                            />

                            {local.clienteNome ||
                              `Cliente #${local.clienteId}`}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={
                              local.ativo
                                ? 'px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold'
                                : 'px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold'
                            }
                          >
                            {local.ativo
                              ? 'ATIVO'
                              : 'INATIVO'}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          #{local.id}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <Link
                              href={`/equipment?siteId=${local.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Wrench
                                size={14}
                              />

                              Equipamentos

                              <ExternalLink
                                size={12}
                              />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* API limitations */}
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertCircle
              size={18}
              className="text-amber-600 shrink-0 mt-0.5"
            />

            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Operações dependentes da API
              </h3>

              <p className="text-xs leading-5 text-amber-800 mt-1">
                A API atual permite listar e
                cadastrar locais, inclusive
                filtrando por cliente. Ainda não
                existem operações de edição ou
                inativação no serviço atual, por
                isso essas ações não são simuladas
                pelo frontend.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Create */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-slate-900">
                  Novo local
                </h2>

                <p className="text-xs text-slate-500">
                  Cadastre uma unidade vinculada a
                  um cliente.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsCreateOpen(false)
                }
                className="p-2 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCreateSite}
              className="p-6 space-y-4"
            >
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex gap-2">
                  <AlertCircle
                    size={17}
                    className="shrink-0 mt-0.5"
                  />

                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cliente *
                </label>

                <select
                  required
                  value={formClientId}
                  onChange={(event) =>
                    setFormClientId(
                      event.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                >
                  <option value="">
                    Selecione...
                  </option>

                  {clientes
                    .filter(
                      (cliente) =>
                        cliente.ativo
                    )
                    .map((cliente) => (
                      <option
                        key={cliente.id}
                        value={cliente.id}
                      >
                        {cliente.nome}
                      </option>
                    ))}
                </select>

                <p className="text-[11px] text-slate-400 mt-1">
                  Apenas clientes ativos aparecem
                  para novos cadastros.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da unidade *
                </label>

                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(event) =>
                    setNome(
                      event.target.value
                    )
                  }
                  placeholder="Ex: Unidade Sorocaba"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Endereço *
                </label>

                <textarea
                  required
                  rows={3}
                  value={endereco}
                  onChange={(event) =>
                    setEndereco(
                      event.target.value
                    )
                  }
                  placeholder="Rua, número, bairro, cidade..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setIsCreateOpen(false)
                  }
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-sm font-bold disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />

                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus size={15} />

                      Cadastrar local
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {title}
      </div>

      <div className="text-2xl font-black text-slate-900 mt-2">
        {value}
      </div>
    </div>
  );
}

function SitesFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
        <Loader2
          size={20}
          className="animate-spin text-[#0f766e]"
        />

        Carregando locais...
      </div>
    </div>
  );
}

export default function SitesPage() {
  return (
    <Suspense fallback={<SitesFallback />}>
      <SitesContent />
    </Suspense>
  );
}
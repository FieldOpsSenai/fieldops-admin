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
  CheckCircle2,
  ChevronRight,

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
  equipamentoService,
  localService,
  type EquipamentoDTO,
  type LocalDTO,
} from '@/lib/api/services';

type StatusFilter =
  | 'TODOS'
  | 'ATIVOS'
  | 'INATIVOS';

function EquipmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const siteIdFromUrl =
    searchParams.get('siteId');

  const initialSiteId =
    siteIdFromUrl &&
    /^\d+$/.test(siteIdFromUrl)
      ? siteIdFromUrl
      : 'TODOS';

  const [equipamentos, setEquipamentos] =
    useState<EquipamentoDTO[]>([]);

  const [locais, setLocais] =
    useState<LocalDTO[]>([]);

  const [selectedSiteId, setSelectedSiteId] =
    useState(initialSiteId);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('TODOS');

  const [searchTerm, setSearchTerm] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [formSiteId, setFormSiteId] =
    useState('');

  const [nome, setNome] =
    useState('');

  const [numeroSerie, setNumeroSerie] =
    useState('');

  const [tipo, setTipo] =
    useState('');

  const [formError, setFormError] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      try {
        const locaisPromise =
          localService.listarTodos();

        const equipamentosPromise =
          initialSiteId === 'TODOS'
            ? equipamentoService.listarTodos()
            : equipamentoService.listarPorLocal(
                Number(initialSiteId)
              );

        const [
          locaisResult,
          equipamentosResult,
        ] = await Promise.allSettled([
          locaisPromise,
          equipamentosPromise,
        ]);

        if (!active) {
          return;
        }

        if (
          locaisResult.status === 'fulfilled'
        ) {
          setLocais(locaisResult.value);
        }

        if (
          equipamentosResult.status ===
          'fulfilled'
        ) {
          setEquipamentos(
            equipamentosResult.value
          );
        } else {
          console.error(
            'Erro ao carregar equipamentos:',
            equipamentosResult.reason
          );

          setErrorMessage(
            'Não foi possível carregar os equipamentos da API.'
          );
        }
      } catch (error: unknown) {
        console.error(
          'Erro ao carregar dados de equipamentos:',
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
  }, [initialSiteId]);

  const selectedSite = useMemo(() => {
    if (selectedSiteId === 'TODOS') {
      return null;
    }

    return (
      locais.find(
        (local) =>
          String(local.id) ===
          selectedSiteId
      ) || null
    );
  }, [
    locais,
    selectedSiteId,
  ]);

  const filteredEquipment = useMemo(() => {
    const term =
      searchTerm.trim().toLowerCase();

    return equipamentos.filter(
      (equipamento) => {
        const matchesSearch =
          !term ||
          equipamento.nome
            .toLowerCase()
            .includes(term) ||
          equipamento.numeroSerie
            .toLowerCase()
            .includes(term) ||
          equipamento.tipo
            ?.toLowerCase()
            .includes(term) ||
          equipamento.localNome
            ?.toLowerCase()
            .includes(term) ||
          String(equipamento.id)
            .includes(term);

        const matchesStatus =
          statusFilter === 'TODOS' ||
          (
            statusFilter === 'ATIVOS' &&
            equipamento.ativo
          ) ||
          (
            statusFilter === 'INATIVOS' &&
            !equipamento.ativo
          );

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    equipamentos,
    searchTerm,
    statusFilter,
  ]);

  const totalAtivos =
    equipamentos.filter(
      (equipamento) =>
        equipamento.ativo
    ).length;

  const totalInativos =
    equipamentos.filter(
      (equipamento) =>
        !equipamento.ativo
    ).length;

  const showSuccess = (
    message: string
  ) => {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const loadEquipment = async (
    siteId: string
  ) => {
    if (siteId === 'TODOS') {
      return equipamentoService.listarTodos();
    }

    return equipamentoService.listarPorLocal(
      Number(siteId)
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const data =
        await loadEquipment(
          selectedSiteId
        );

      setEquipamentos(data);
    } catch (error: unknown) {
      console.error(
        'Erro ao atualizar equipamentos:',
        error
      );

      setErrorMessage(
        'Não foi possível atualizar os equipamentos.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSiteFilterChange =
    async (
      siteId: string
    ) => {
      setSelectedSiteId(siteId);
      setErrorMessage(null);

      if (siteId === 'TODOS') {
        router.replace('/equipment');
      } else {
        router.replace(
          `/equipment?siteId=${siteId}`
        );
      }

      setIsRefreshing(true);

      try {
        const data =
          await loadEquipment(siteId);

        setEquipamentos(data);
      } catch (error: unknown) {
        console.error(
          'Erro ao filtrar equipamentos:',
          error
        );

        setErrorMessage(
          'Não foi possível carregar os equipamentos deste local.'
        );
      } finally {
        setIsRefreshing(false);
      }
    };

  const openCreateModal = () => {
    setNome('');
    setNumeroSerie('');
    setTipo('');
    setFormError(null);

    const selectedLocal =
      selectedSiteId !== 'TODOS'
        ? locais.find(
            (local) =>
              String(local.id) ===
              selectedSiteId
          )
        : null;

    if (
      selectedLocal &&
      selectedLocal.ativo
    ) {
      setFormSiteId(
        String(selectedLocal.id)
      );
    } else {
      const firstActiveSite =
        locais.find(
          (local) => local.ativo
        );

      setFormSiteId(
        firstActiveSite
          ? String(firstActiveSite.id)
          : ''
      );
    }

    setIsCreateOpen(true);
  };

  const handleCreateEquipment =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      setFormError(null);

      if (!formSiteId) {
        setFormError(
          'Selecione o local do equipamento.'
        );

        return;
      }

      if (!nome.trim()) {
        setFormError(
          'Informe o nome do equipamento.'
        );

        return;
      }

      if (!numeroSerie.trim()) {
        setFormError(
          'Informe o número de série ou identificação do equipamento.'
        );

        return;
      }

      setIsSubmitting(true);

      try {
        const created =
          await equipamentoService.cadastrar({
            nome: nome.trim(),
            numeroSerie:
              numeroSerie.trim(),
            tipo:
              tipo.trim() ||
              undefined,
            localId:
              Number(formSiteId),
          });

        const parentSite =
          locais.find(
            (local) =>
              local.id ===
              Number(formSiteId)
          );

        const normalizedCreated:
          EquipamentoDTO = {
            ...created,

            localNome:
              created.localNome ||
              parentSite?.nome,
          };

        const shouldShow =
          selectedSiteId === 'TODOS' ||
          selectedSiteId ===
            formSiteId;

        if (shouldShow) {
          setEquipamentos(
            (current) => [
              normalizedCreated,
              ...current,
            ]
          );
        }

        setIsCreateOpen(false);

        showSuccess(
          `Equipamento "${created.nome}" cadastrado com sucesso.`
        );
      } catch (error: unknown) {
        console.error(
          'Erro ao cadastrar equipamento:',
          error
        );

        setFormError(
          'Não foi possível cadastrar o equipamento. Verifique os dados e tente novamente.'
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <>
      <TopHeader
        title="Equipamentos"
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
              Equipamentos
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
                setSuccessMessage(
                  null
                )
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
              <Wrench
                size={30}
                className="text-[#0f766e]"
              />

              Equipamentos
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Gerencie os equipamentos
              instalados nos locais atendidos.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={
                isRefreshing
              }
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
              onClick={
                openCreateModal
              }
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-sm font-bold"
            >
              <Plus size={17} />
              Novo equipamento
            </button>
          </div>
        </section>

        {/* Selected site */}
        {selectedSite && (
          <section className="border border-teal-200 bg-teal-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-lg bg-white border border-teal-200 flex items-center justify-center text-[#0f766e]">
                <MapPin
                  size={18}
                />
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Local selecionado
                </div>

                <div className="font-bold text-slate-900">
                  {
                    selectedSite.nome
                  }
                </div>

                <div className="text-xs text-slate-500">
                  {
                    selectedSite.clienteNome
                      ? `${selectedSite.clienteNome} • `
                      : ''
                  }

                  {
                    selectedSite.endereco
                  }
                </div>
              </div>
            </div>

            <Link
              href={
                selectedSite.clienteId
                  ? `/sites?clientId=${selectedSite.clienteId}`
                  : '/sites'
              }
              className="text-xs font-bold text-[#0f766e] hover:underline"
            >
              Voltar para locais
            </Link>
          </section>
        )}

        {/* Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title={
              selectedSite
                ? 'Equipamentos do local'
                : 'Total de equipamentos'
            }
            value={
              equipamentos.length
            }
          />

          <StatCard
            title="Equipamentos ativos"
            value={totalAtivos}
          />

          <StatCard
            title="Equipamentos inativos"
            value={totalInativos}
          />
        </section>

        {/* Error */}
        {errorMessage && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex gap-3 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="shrink-0 mt-0.5"
            />

            <div className="flex-1">
              <div className="font-bold">
                Erro ao processar
                operação
              </div>

              <div className="mt-0.5">
                {errorMessage}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setErrorMessage(
                  null
                )
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
              value={
                searchTerm
              }
              onChange={(
                event
              ) =>
                setSearchTerm(
                  event.target
                    .value
                )
              }
              placeholder="Buscar por nome, série, tipo, local ou ID..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
            />
          </div>

          <select
            value={
              selectedSiteId
            }
            disabled={
              isRefreshing
            }
            onChange={(
              event
            ) =>
              void handleSiteFilterChange(
                event.target
                  .value
              )
            }
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 disabled:opacity-60"
          >
            <option value="TODOS">
              Todos os locais
            </option>

            {locais.map(
              (local) => (
                <option
                  key={local.id}
                  value={
                    local.id
                  }
                >
                  {local.nome}
                  {local.clienteNome
                    ? ` — ${local.clienteNome}`
                    : ''}

                  {!local.ativo
                    ? ' (Inativo)'
                    : ''}
                </option>
              )
            )}
          </select>

          <select
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
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
                Carregando
                equipamentos...
              </span>
            </div>
          ) : filteredEquipment.length ===
            0 ? (
            <div className="p-12 text-center">
              <Wrench
                size={42}
                className="mx-auto mb-3 text-slate-300"
              />

              <h2 className="font-bold text-slate-800">
                Nenhum equipamento
                encontrado
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Cadastre um
                equipamento ou altere
                os filtros.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">
                      Equipamento
                    </th>

                    <th className="px-6 py-4">
                      Série / Tag
                    </th>

                    <th className="px-6 py-4">
                      Tipo
                    </th>

                    <th className="px-6 py-4">
                      Local
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      ID
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredEquipment.map(
                    (
                      equipamento
                    ) => (
                      <tr
                        key={
                          equipamento.id
                        }
                        className="hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0f766e] flex items-center justify-center">
                              <Wrench
                                size={
                                  17
                                }
                              />
                            </div>

                            <div>
                              <div className="font-bold text-sm text-slate-900">
                                {
                                  equipamento.nome
                                }
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-mono text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700">
                            {
                              equipamento.numeroSerie
                            }
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {equipamento.tipo ||
                            'Não informado'}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <MapPin
                              size={
                                14
                              }
                              className="text-slate-400"
                            />

                            {equipamento.localNome ||
                              `Local #${equipamento.localId}`}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={
                              equipamento.ativo
                                ? 'px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold'
                                : 'px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold'
                            }
                          >
                            {equipamento.ativo
                              ? 'ATIVO'
                              : 'INATIVO'}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          #
                          {
                            equipamento.id
                          }
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
                Funcionalidades dependentes
                da API
              </h3>

              <p className="text-xs leading-5 text-amber-800 mt-1">
                O serviço atual permite
                listar e cadastrar
                equipamentos, incluindo
                consulta por local. Edição,
                inativação e QR Code ainda
                não fazem parte do contrato
                utilizado pelo Admin-Web e
                não são simulados no
                frontend.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Create modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-slate-900">
                  Novo equipamento
                </h2>

                <p className="text-xs text-slate-500">
                  Vincule o equipamento
                  ao local onde ele está
                  instalado.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsCreateOpen(
                    false
                  )
                }
                className="p-2 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={
                handleCreateEquipment
              }
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
                  Local de instalação *
                </label>

                <select
                  required
                  value={
                    formSiteId
                  }
                  onChange={(
                    event
                  ) =>
                    setFormSiteId(
                      event.target
                        .value
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                >
                  <option value="">
                    Selecione...
                  </option>

                  {locais
                    .filter(
                      (local) =>
                        local.ativo
                    )
                    .map(
                      (local) => (
                        <option
                          key={
                            local.id
                          }
                          value={
                            local.id
                          }
                        >
                          {
                            local.nome
                          }

                          {local.clienteNome
                            ? ` — ${local.clienteNome}`
                            : ''}
                        </option>
                      )
                    )}
                </select>

                <p className="text-[11px] text-slate-400 mt-1">
                  Apenas locais ativos
                  podem receber novos
                  equipamentos.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome / identificação *
                </label>

                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(
                    event
                  ) =>
                    setNome(
                      event.target
                        .value
                    )
                  }
                  placeholder="Ex: Compressor 01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de série / Tag *
                </label>

                <input
                  type="text"
                  required
                  value={
                    numeroSerie
                  }
                  onChange={(
                    event
                  ) =>
                    setNumeroSerie(
                      event.target
                        .value
                    )
                  }
                  placeholder="Ex: CMP-001-2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo / Categoria
                </label>

                <input
                  type="text"
                  value={tipo}
                  onChange={(
                    event
                  ) =>
                    setTipo(
                      event.target
                        .value
                    )
                  }
                  placeholder="Ex: Compressor, Caldeira, Motor..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setIsCreateOpen(
                      false
                    )
                  }
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmitting
                  }
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-sm font-bold disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        size={
                          15
                        }
                        className="animate-spin"
                      />

                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus
                        size={
                          15
                        }
                      />

                      Cadastrar equipamento
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

function EquipmentFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
        <Loader2
          size={20}
          className="animate-spin text-[#0f766e]"
        />

        Carregando equipamentos...
      </div>
    </div>
  );
}

export default function EquipmentPage() {
  return (
    <Suspense
      fallback={<EquipmentFallback />}
    >
      <EquipmentContent />
    </Suspense>
  );
}
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

import {
  AlertCircle,
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';

import TopHeader from '@/components/layout/TopHeader';

import {
  inspecaoService,
  usuarioService,
  type InspecaoDTO,
  type InspecaoStatus,
  type UsuarioDTO,
} from '@/lib/api/services';

type StatusFilter =
  | 'TODOS'
  | InspecaoStatus;

function getApiErrorMessage(
  error: unknown
) {
  if (axios.isAxiosError(error)) {
    const data =
      error.response?.data as
        | {
            mensagem?: string;
            message?: string;
          }
        | string
        | undefined;

    if (typeof data === 'string') {
      return data;
    }

    return (
      data?.mensagem ||
      data?.message ||
      error.message
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return undefined;
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return '—';
  }

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnly
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', dateOnly
    ? { dateStyle: 'short' }
    : { dateStyle: 'short', timeStyle: 'short' }
  ).format(date);
}

function isInspectionOverdue(
  inspection: InspecaoDTO
) {
  if (
    inspection.status !==
      'PENDENTE' &&
    inspection.status !==
      'EM_ANDAMENTO'
  ) {
    return false;
  }

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(inspection.dataAgendada);
  const scheduledDate = dateOnly
    ? new Date(`${inspection.dataAgendada}T23:59:59`)
    : new Date(inspection.dataAgendada);

  if (
    Number.isNaN(
      scheduledDate.getTime()
    )
  ) {
    return false;
  }

  return (
    scheduledDate.getTime() <
    Date.now()
  );
}

export default function InspectionsPage() {
  const [
    inspecoes,
    setInspecoes,
  ] = useState<
    InspecaoDTO[]
  >([]);

  const [
    tecnicos,
    setTecnicos,
  ] = useState<
    UsuarioDTO[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string | null
    >(null);

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<
      string | null
    >(null);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      'TODOS'
    );

  const [
    tecnicoFilter,
    setTecnicoFilter,
  ] = useState(
    'TODOS'
  );

  const [
    overdueOnly,
    setOverdueOnly,
  ] = useState(false);

  const [
    inspectionToCancel,
    setInspectionToCancel,
  ] =
    useState<InspecaoDTO | null>(
      null
    );

  const [
    cancellationReason,
    setCancellationReason,
  ] = useState('');

  const [
    cancelError,
    setCancelError,
  ] =
    useState<
      string | null
    >(null);

  const [
    isCancelling,
    setIsCancelling,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    const loadInitialData =
      async () => {
        const [
          inspectionsResult,
          usersResult,
        ] =
          await Promise.allSettled(
            [
              inspecaoService.listarTodas(),
              usuarioService.listarTodos(),
            ]
          );

        if (!active) {
          return;
        }

        if (
          inspectionsResult.status ===
          'fulfilled'
        ) {
          setInspecoes(
            inspectionsResult.value
          );
        } else {
          console.error(
            'Erro ao carregar inspeções:',
            inspectionsResult.reason
          );

          setErrorMessage(
            'Não foi possível carregar as inspeções da API.'
          );
        }

        if (
          usersResult.status ===
          'fulfilled'
        ) {
          setTecnicos(
            usersResult.value.filter(
              (usuario) =>
                usuario.perfil ===
                'TECNICO'
            )
          );
        }

        setIsLoading(false);
      };

    void loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  const filteredInspections =
    useMemo(() => {
      const term =
        searchTerm
          .trim()
          .toLowerCase();

      return inspecoes.filter(
        (inspection) => {
          const matchesSearch =
            !term ||
            inspection.descricao
              ?.toLowerCase()
              .includes(term) ||
            inspection.equipamentoNome
              ?.toLowerCase()
              .includes(term) ||
            inspection.usuarioNome
              ?.toLowerCase()
              .includes(term) ||
            String(
              inspection.id
            ).includes(term);

          const matchesStatus =
            statusFilter ===
              'TODOS' ||
            inspection.status ===
              statusFilter;

          const matchesTechnician =
            tecnicoFilter ===
              'TODOS' ||
            String(
              inspection.usuarioId
            ) ===
              tecnicoFilter;

          const matchesOverdue =
            !overdueOnly ||
            isInspectionOverdue(
              inspection
            );

          return (
            matchesSearch &&
            matchesStatus &&
            matchesTechnician &&
            matchesOverdue
          );
        }
      );
    }, [
      inspecoes,
      searchTerm,
      statusFilter,
      tecnicoFilter,
      overdueOnly,
    ]);

  const pendingCount =
    inspecoes.filter(
      (inspection) =>
        inspection.status ===
        'PENDENTE'
    ).length;

  const inProgressCount =
    inspecoes.filter(
      (inspection) =>
        inspection.status ===
        'EM_ANDAMENTO'
    ).length;

  const completedCount =
    inspecoes.filter(
      (inspection) =>
        inspection.status ===
        'CONCLUIDA'
    ).length;

  const overdueCount =
    inspecoes.filter(
      isInspectionOverdue
    ).length;

  const showSuccess = (
    message: string
  ) => {
    setSuccessMessage(
      message
    );

    window.setTimeout(
      () => {
        setSuccessMessage(
          null
        );
      },
      4000
    );
  };

  const handleRefresh =
    async () => {
      setIsRefreshing(
        true
      );

      setErrorMessage(
        null
      );

      try {
        const [
          inspectionsResult,
          usersResult,
        ] =
          await Promise.allSettled(
            [
              inspecaoService.listarTodas(),
              usuarioService.listarTodos(),
            ]
          );

        if (
          inspectionsResult.status ===
          'fulfilled'
        ) {
          setInspecoes(
            inspectionsResult.value
          );
        } else {
          setErrorMessage(
            'Não foi possível atualizar as inspeções.'
          );
        }

        if (
          usersResult.status ===
          'fulfilled'
        ) {
          setTecnicos(
            usersResult.value.filter(
              (usuario) =>
                usuario.perfil ===
                'TECNICO'
            )
          );
        }
      } finally {
        setIsRefreshing(
          false
        );
      }
    };

  const openCancellation =
    (
      inspection: InspecaoDTO
    ) => {
      if (
        inspection.status ===
          'CONCLUIDA' ||
        inspection.status ===
          'CANCELADA'
      ) {
        return;
      }

      setInspectionToCancel(
        inspection
      );

      setCancellationReason(
        ''
      );

      setCancelError(
        null
      );
    };

  const handleCancelInspection =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      if (
        !inspectionToCancel
      ) {
        return;
      }

      const reason =
        cancellationReason.trim();

      if (reason.length < 10 || reason.length > 1000) {
        setCancelError(
          'Informe um motivo entre 10 e 1000 caracteres.'
        );

        return;
      }

      setIsCancelling(
        true
      );

      setCancelError(
        null
      );

      try {
        const updated = await inspecaoService.cancelar(inspectionToCancel.id, reason);
        setInspecoes((current) => current.map((inspection) => inspection.id === updated.id ? {
          ...inspection, status: 'CANCELADA', statusApi: updated.status,
          canceladoEm: updated.canceledAt, canceladoPor: updated.canceledBy, motivoCancelamento: updated.canceledReason,
        } : inspection));
        setInspectionToCancel(
          null
        );

        setCancellationReason(
          ''
        );

        showSuccess(
          `Inspeção #${updated.id} cancelada.`
        );
      } catch (error: unknown) {
        console.error(
          'Erro ao cancelar inspeção:',
          error
        );

        const apiMessage =
          getApiErrorMessage(
            error
          );

        setCancelError(
          apiMessage
            ? `Não foi possível cancelar: ${apiMessage}`
            : 'Não foi possível cancelar a inspeção.'
        );
      } finally {
        setIsCancelling(
          false
        );
      }
    };

  return (
    <>
      <TopHeader
        title="Inspeções"
        context={
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">
              Operação
            </span>

            <ChevronRight
              size={14}
              className="text-slate-400"
            />

            <span className="font-semibold text-slate-800">
              Acompanhamento
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
              {
                successMessage
              }
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

        {/* HEADER */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <CalendarClock
                size={30}
                className="text-[#0f766e]"
              />

              Acompanhamento de
              Inspeções
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Acompanhe o estado das
              inspeções registradas
              pela API e identifique
              ordens atrasadas.
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
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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

            <Link
              href="/inspections/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-sm font-bold"
            >
              <Plus size={17} />
              Nova inspeção
            </Link>
          </div>
        </section>

        {/* API LIMITATION */}
        <section className="p-4 border border-amber-200 bg-amber-50 rounded-xl flex gap-3">
          <AlertCircle
            size={18}
            className="text-amber-600 shrink-0 mt-0.5"
          />

          <div>
            <h2 className="text-sm font-bold text-amber-900">
              Fluxo atual da API
            </h2>

            <p className="text-xs text-amber-800 mt-1 leading-5">
              O backend atual expõe
              somente os estados
              PENDENTE,
              EM_ANDAMENTO,
              CONCLUIDA e
              CANCELADA. Os estados
              de envio, revisão,
              aprovação e reprovação
              previstos no produto
              ainda não estão
              disponíveis nesse
              contrato.
            </p>

            <p className="text-xs text-amber-800 mt-1 leading-5">
              Por isso esta tela não
              simula aprovação ou
              revisão. O Admin Web
              acompanha a execução e
              oferece apenas
              cancelamento quando a
              inspeção ainda não está
              concluída.
            </p>
          </div>
        </section>

        {/* METRICS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Pendentes"
            value={
              pendingCount
            }
          />

          <MetricCard
            title="Em andamento"
            value={
              inProgressCount
            }
          />

          <MetricCard
            title="Concluídas"
            value={
              completedCount
            }
          />

          <MetricCard
            title="Atrasadas"
            value={
              overdueCount
            }
            attention={
              overdueCount > 0
            }
          />
        </section>

        {errorMessage && (
          <section className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="shrink-0 mt-0.5"
            />

            <div className="flex-1">
              <div className="font-bold">
                Erro de comunicação
              </div>

              <div className="mt-1">
                {
                  errorMessage
                }
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleRefresh()
              }
              className="text-xs font-bold underline"
            >
              Tentar novamente
            </button>
          </section>
        )}

        {/* FILTERS */}
        <section className="bg-white p-4 border border-slate-200 rounded-xl grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto] gap-3">
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
              placeholder="Buscar por ID, descrição, equipamento ou técnico..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]"
            />
          </div>

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

            <option value="PENDENTE">
              Pendente
            </option>

            <option value="EM_ANDAMENTO">
              Em andamento
            </option>

            <option value="CONCLUIDA">
              Concluída
            </option>

            <option value="CANCELADA">
              Cancelada
            </option>
          </select>

          <select
            value={
              tecnicoFilter
            }
            onChange={(
              event
            ) =>
              setTecnicoFilter(
                event.target
                  .value
              )
            }
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-700"
          >
            <option value="TODOS">
              Todos os técnicos
            </option>

            {tecnicos.map(
              (tecnico) => (
                <option
                  key={
                    tecnico.id
                  }
                  value={
                    tecnico.id
                  }
                >
                  {
                    tecnico.nome
                  }
                </option>
              )
            )}
          </select>

          <label className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={
                overdueOnly
              }
              onChange={(
                event
              ) =>
                setOverdueOnly(
                  event.target
                    .checked
                )
              }
              className="accent-[#0f766e]"
            />

            Só atrasadas
          </label>
        </section>

        {/* TABLE */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center gap-3 text-slate-500">
              <Loader2
                size={30}
                className="animate-spin text-[#0f766e]"
              />

              <span className="text-sm">
                Carregando
                inspeções...
              </span>
            </div>
          ) : filteredInspections.length ===
            0 ? (
            <div className="p-12 text-center">
              <CalendarClock
                size={42}
                className="mx-auto text-slate-300 mb-3"
              />

              <h2 className="font-bold text-slate-800">
                Nenhuma inspeção
                encontrada
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Altere os filtros ou
                planeje uma nova
                inspeção.
              </p>

              <Link
                href="/inspections/new"
                className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-[#0f766e] text-white rounded-lg text-xs font-bold"
              >
                <Plus size={14} />
                Nova inspeção
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">
                      Inspeção
                    </th>

                    <th className="px-5 py-4">
                      Equipamento
                    </th>

                    <th className="px-5 py-4">
                      Técnico
                    </th>

                    <th className="px-5 py-4">
                      Agendada
                    </th>

                    <th className="px-5 py-4">
                      Realização
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredInspections.map(
                    (
                      inspection
                    ) => {
                      const overdue =
                        isInspectionOverdue(
                          inspection
                        );

                      const cancellable =
                        inspection.status !==
                          'CONCLUIDA' &&
                        inspection.status !==
                          'CANCELADA';

                      return (
                        <tr
                          key={
                            inspection.id
                          }
                          className={
                            overdue
                              ? 'bg-amber-50/40 hover:bg-amber-50/70'
                              : 'hover:bg-slate-50/70'
                          }
                        >
                          <td className="px-5 py-4">
                            <div className="font-bold text-sm text-slate-900">
                              {
                                inspection.descricao
                              }
                            </div>

                            <div className="flex gap-2 items-center mt-1">
                              <span className="font-mono text-[11px] text-slate-400">
                                #
                                {
                                  inspection.id
                                }
                              </span>

                              {overdue && (
                                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-700">
                                  <Clock3
                                    size={
                                      11
                                    }
                                  />

                                  Atrasada
                                </span>
                              )}
                            </div>

                            {inspection.observacoes && (
                              <div className="text-xs text-slate-500 mt-1 max-w-sm line-clamp-2">
                                {
                                  inspection.observacoes
                                }
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="inline-flex items-center gap-2 text-sm text-slate-700">
                              <Wrench
                                size={
                                  14
                                }
                                className="text-[#0f766e]"
                              />

                              {inspection.equipamentoNome ||
                                `Equipamento #${inspection.equipamentoId}`}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                <UserRound
                                  size={
                                    13
                                  }
                                />
                              </div>

                              <div className="text-sm text-slate-700">
                                {inspection.usuarioNome ||
                                  `Usuário #${inspection.usuarioId}`}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                            {formatDate(
                              inspection.dataAgendada
                            )}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                            {formatDate(
                              inspection.dataRealizacao
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <InspectionStatusBadge
                              status={
                                inspection.status
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              {cancellable ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCancellation(
                                      inspection
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50"
                                >
                                  <Ban
                                    size={
                                      13
                                    }
                                  />

                                  Cancelar
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  —
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && (
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
              Exibindo{' '}
              <strong className="text-slate-700">
                {
                  filteredInspections.length
                }
              </strong>{' '}
              de{' '}
              <strong className="text-slate-700">
                {
                  inspecoes.length
                }
              </strong>{' '}
              inspeções.
            </div>
          )}
        </section>
      </main>

      {/* CANCEL MODAL */}
      {inspectionToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
            <header className="p-5 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">
                  Cancelar inspeção
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Ordem #
                  {
                    inspectionToCancel.id
                  }{' '}
                  —{' '}
                  {
                    inspectionToCancel.descricao
                  }
                </p>
              </div>

              <button
                type="button"
                disabled={
                  isCancelling
                }
                onClick={() =>
                  setInspectionToCancel(
                    null
                  )
                }
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </header>

            <form
              onSubmit={
                handleCancelInspection
              }
              className="p-6 space-y-4"
            >
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-5">
                O cancelamento não
                remove o histórico da
                inspeção. O registro
                permanecerá disponível
                com status CANCELADA.
              </div>

              {cancelError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 text-sm text-red-700">
                  <AlertCircle
                    size={
                      16
                    }
                    className="shrink-0 mt-0.5"
                  />

                  {
                    cancelError
                  }
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Motivo do
                  cancelamento *
                </label>

                <textarea
                  required minLength={10} maxLength={1000} aria-label="Motivo do cancelamento"
                  rows={4}
                  value={
                    cancellationReason
                  }
                  onChange={(
                    event
                  ) =>
                    setCancellationReason(
                      event.target
                        .value
                    )
                  }
                  placeholder="Ex: Cliente solicitou reagendamento por indisponibilidade do equipamento."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={
                    isCancelling
                  }
                  onClick={() =>
                    setInspectionToCancel(
                      null
                    )
                  }
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  disabled={
                    isCancelling
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold disabled:opacity-60"
                >
                  {isCancelling && (
                    <Loader2
                      size={
                        14
                      }
                      className="animate-spin"
                    />
                  )}

                  Confirmar
                  cancelamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function MetricCard({
  title,
  value,
  attention = false,
}: {
  title: string;
  value: number;
  attention?: boolean;
}) {
  return (
    <div
      className={
        attention
          ? 'bg-amber-50 border border-amber-200 rounded-xl p-5'
          : 'bg-white border border-slate-200 rounded-xl p-5'
      }
    >
      <div
        className={
          attention
            ? 'text-xs font-bold uppercase tracking-wider text-amber-700'
            : 'text-xs font-bold uppercase tracking-wider text-slate-500'
        }
      >
        {title}
      </div>

      <div
        className={
          attention
            ? 'text-2xl font-black text-amber-900 mt-2'
            : 'text-2xl font-black text-slate-900 mt-2'
        }
      >
        {value}
      </div>
    </div>
  );
}

function InspectionStatusBadge({
  status,
}: {
  status: InspecaoStatus;
}) {
  switch (status) {
    case 'PENDENTE':
      return (
        <span className="inline-flex px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold">
          PENDENTE
        </span>
      );

    case 'EM_ANDAMENTO':
      return (
        <span className="inline-flex px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold">
          EM ANDAMENTO
        </span>
      );

    case 'CONCLUIDA':
      return (
        <span className="inline-flex px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold">
          CONCLUÍDA
        </span>
      );

    case 'CANCELADA':
      return (
        <span className="inline-flex px-2.5 py-1 rounded-full border border-red-200 bg-red-50 text-red-700 text-xs font-bold">
          CANCELADA
        </span>
      );
  }
}

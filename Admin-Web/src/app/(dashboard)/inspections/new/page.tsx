'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  UserRound,
  Wrench,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import { collectPages } from '@/lib/api/services/apiPage';
import TopHeader from '@/components/layout/TopHeader';

import {
  clienteService,
  equipamentoService,
  inspecaoService,
  localService,
  modeloInspecaoService,
  usuarioService,
  type ClienteDTO,
  type EquipamentoDTO,
  type LocalDTO,
  type UsuarioDTO,
} from '@/lib/api/services';
import type { ModeloInspecaoPublicado } from '@/lib/api/services/modeloInspecaoService';

import { useSessionStore } from '@/stores/sessionStore';
import { canPlanInspections } from '@/lib/auth/permissions';

type Priority =
  | 'Baixa'
  | 'Média'
  | 'Alta'
  | 'Crítica';

function toDateTimeLocalValue(
  date: Date
) {
  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        offset * 60_000
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function getDefaultScheduledDate() {
  const date = new Date();

  date.setDate(
    date.getDate() + 1
  );

  date.setHours(
    9,
    0,
    0,
    0
  );

  return toDateTimeLocalValue(
    date
  );
}

function getMinimumScheduledDate() {
  return toDateTimeLocalValue(
    new Date()
  );
}

function getApiErrorMessage(
  error: unknown
) {
  if (
    axios.isAxiosError(error)
  ) {
    const data =
      error.response?.data as
        | {
            mensagem?: string;
            message?: string;
          }
        | string
        | undefined;

    if (
      typeof data ===
      'string'
    ) {
      return data;
    }

    return (
      data?.mensagem ||
      data?.message ||
      error.message
    );
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return undefined;
}

export default function NewInspectionPage() {
  const submittingRef = useRef(false);
  const siteRequest = useRef(0);
  const equipmentRequest = useRef(0);
  const router =
    useRouter();

  const { session } =
    useSessionStore();

  const [
    clientes,
    setClientes,
  ] = useState<
    ClienteDTO[]
  >([]);

  const [
    locais,
    setLocais,
  ] = useState<
    LocalDTO[]
  >([]);

  const [
    equipamentos,
    setEquipamentos,
  ] = useState<
    EquipamentoDTO[]
  >([]);

  const [
    tecnicos,
    setTecnicos,
  ] = useState<
    UsuarioDTO[]
  >([]);

  const [
    modelosPublicados,
    setModelosPublicados,
  ] = useState<ModeloInspecaoPublicado[]>([]);

  const [
    selectedClienteId,
    setSelectedClienteId,
  ] = useState('');

  const [
    selectedLocalId,
    setSelectedLocalId,
  ] = useState('');

  const [
    selectedEquipamentoId,
    setSelectedEquipamentoId,
  ] = useState('');

  const [
    selectedTecnicoId,
    setSelectedTecnicoId,
  ] = useState('');

  const [
    selectedTemplateVersionId,
    setSelectedTemplateVersionId,
  ] = useState('');

  const [
    descricao,
    setDescricao,
  ] = useState('');

  const [
    dataAgendada,
    setDataAgendada,
  ] = useState(
    getDefaultScheduledDate
  );

  const [
    prioridade,
    setPrioridade,
  ] =
    useState<Priority>(
      'Média'
    );

  const [
    observacoes,
    setObservacoes,
  ] = useState('');

  const [
    isLoadingInitial,
    setIsLoadingInitial,
  ] = useState(true);

  const [
    isLoadingLocais,
    setIsLoadingLocais,
  ] = useState(false);

  const [
    isLoadingEquipamentos,
    setIsLoadingEquipamentos,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    if (
      session &&
      !canPlanInspections(
        session.profile
      )
    ) {
      router.replace(
        '/forbidden'
      );
    }
  }, [
    router,
    session,
  ]);

  useEffect(() => {
    let active = true;

    const loadInitialData =
      async () => {
        const [
          clientesResult,
          tecnicosResult,
          modelosResult,
        ] =
          await Promise.allSettled(
            [
              collectPages((page) => clienteService.listarPagina({ page, size: 100, status: 'ACTIVE' })),

              usuarioService.listarPorPerfil(
                'TECNICO'
              ),
              modeloInspecaoService.listarPublicados(),
            ]
          );

        if (!active) {
          return;
        }

        if (
          clientesResult.status ===
          'fulfilled'
        ) {
          setClientes(
            clientesResult.value.filter(
              (cliente) =>
                cliente.ativo
            )
          );
        }

        if (
          tecnicosResult.status ===
          'fulfilled'
        ) {
          setTecnicos(
            tecnicosResult.value.filter(
              (tecnico) =>
                tecnico.ativo
            )
          );
        }

        if (modelosResult.status === 'fulfilled') {
          setModelosPublicados(modelosResult.value);
        }

        if (
          clientesResult.status ===
            'rejected' ||
          tecnicosResult.status ===
            'rejected' ||
          modelosResult.status === 'rejected'
        ) {
          setErrorMessage(
            'Parte dos dados necessários para o planejamento não pôde ser carregada.'
          );
        }

        setIsLoadingInitial(
          false
        );
      };

    void loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  const selectedCliente =
    useMemo(
      () =>
        clientes.find(
          (cliente) =>
            String(
              cliente.id
            ) ===
            selectedClienteId
        ) || null,
      [
        clientes,
        selectedClienteId,
      ]
    );

  const selectedLocal =
    useMemo(
      () =>
        locais.find(
          (local) =>
            String(
              local.id
            ) ===
            selectedLocalId
        ) || null,
      [
        locais,
        selectedLocalId,
      ]
    );

  const selectedEquipamento =
    useMemo(
      () =>
        equipamentos.find(
          (equipamento) =>
            String(
              equipamento.id
            ) ===
            selectedEquipamentoId
        ) || null,
      [
        equipamentos,
        selectedEquipamentoId,
      ]
    );

  const selectedTecnico =
    useMemo(
      () =>
        tecnicos.find(
          (tecnico) =>
            String(
              tecnico.id
            ) ===
            selectedTecnicoId
        ) || null,
      [
        tecnicos,
        selectedTecnicoId,
      ]
    );

  const handleClienteChange = async (clienteId: string) => {
    const request = ++siteRequest.current;
    equipmentRequest.current += 1;
    setSelectedClienteId(clienteId);
    setSelectedLocalId(''); setSelectedEquipamentoId('');
    setLocais([]); setEquipamentos([]);
    setIsLoadingEquipamentos(false); setIsLoadingLocais(Boolean(clienteId));
    setErrorMessage(null);
    if (!clienteId) return;
    try {
      const data = await collectPages((page) => localService.listarPagina({ clientId: Number(clienteId), status: 'ACTIVE', page, size: 100 }));
      if (request === siteRequest.current) setLocais(data.filter((site) => site.ativo && site.clienteId === Number(clienteId)));
    } catch {
      if (request === siteRequest.current) setErrorMessage('Não foi possível carregar os locais deste cliente. Selecione o cliente novamente para tentar de novo.');
    } finally {
      if (request === siteRequest.current) setIsLoadingLocais(false);
    }
  };

  const handleLocalChange = async (localId: string) => {
    const request = ++equipmentRequest.current;
    setSelectedLocalId(localId); setSelectedEquipamentoId(''); setEquipamentos([]);
    setIsLoadingEquipamentos(Boolean(localId)); setErrorMessage(null);
    if (!localId) return;
    try {
      const data = await collectPages((page) => equipamentoService.listarPagina({ siteId: Number(localId), status: 'ACTIVE', page, size: 100 }));
      if (request === equipmentRequest.current) setEquipamentos(data.filter((equipment) => equipment.ativo && equipment.localId === Number(localId)));
    } catch {
      if (request === equipmentRequest.current) setErrorMessage('Não foi possível carregar os equipamentos deste local. Selecione o local novamente para tentar de novo.');
    } finally {
      if (request === equipmentRequest.current) setIsLoadingEquipamentos(false);
    }
  };
  const handleSubmit =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();
      if (submittingRef.current || !session || !canPlanInspections(session.profile)) return;

      setErrorMessage(null);
      if (!selectedCliente?.ativo || !selectedLocal?.ativo || selectedLocal.clienteId !== selectedCliente.id ||
          !selectedEquipamento?.ativo || selectedEquipamento.localId !== selectedLocal.id) {
        setErrorMessage('Selecione cliente, local e equipamento ativos com vínculos compatíveis.');
        return;
      }

      if (
        !selectedClienteId
      ) {
        setErrorMessage(
          'Selecione o cliente.'
        );

        return;
      }

      if (
        !selectedLocalId
      ) {
        setErrorMessage(
          'Selecione o local da inspeção.'
        );

        return;
      }

      if (
        !selectedEquipamentoId
      ) {
        setErrorMessage(
          'A API atual exige um equipamento para criar a inspeção.'
        );

        return;
      }

      if (
        !selectedTecnicoId
      ) {
        setErrorMessage(
          'Selecione o técnico responsável.'
        );

        return;
      }

      if (!modelosPublicados.some((modelo) => modelo.versaoId === Number(selectedTemplateVersionId))) {
        setErrorMessage('Selecione um modelo de inspeção publicado.');
        return;
      }

      if (
        !descricao.trim()
      ) {
        setErrorMessage(
          'Informe o título ou descrição da inspeção.'
        );

        return;
      }

      if (
        !dataAgendada
      ) {
        setErrorMessage(
          'Informe a data e hora da inspeção.'
        );

        return;
      }

      const selectedDate =
        new Date(
          dataAgendada
        );

      if (
        Number.isNaN(
          selectedDate.getTime()
        )
      ) {
        setErrorMessage(
          'A data informada é inválida.'
        );

        return;
      }

      if (
        selectedDate.getTime() <
        Date.now()
      ) {
        setErrorMessage(
          'A inspeção não pode ser agendada para uma data no passado.'
        );

        return;
      }

      submittingRef.current = true;
      setIsSubmitting(
        true
      );

      try {
        const formattedDate =
          dataAgendada.length ===
          16
            ? `${dataAgendada}:00`
            : dataAgendada;

        const normalizedObservation =
          observacoes.trim();

        const created = await inspecaoService.criar(
          {
            descricao:
              descricao.trim(),

            dataAgendada:
              formattedDate,

            observacoes:
              normalizedObservation || undefined,

            clienteId: Number(selectedClienteId),

            localId: Number(selectedLocalId),

            templateVersionId: Number(selectedTemplateVersionId),

            prioridade: prioridade === 'Baixa'
              ? 'LOW'
              : prioridade === 'Alta'
                ? 'HIGH'
                : prioridade === 'Crítica'
                  ? 'CRITICAL'
                  : 'MEDIUM',

            equipamentoId:
              Number(
                selectedEquipamentoId
              ),

            usuarioId:
              Number(
                selectedTecnicoId
              ),
          }
        );

        router.push(
          `/inspections?created=true&inspectionId=${created.id}`
        );
      } catch (error: unknown) {
        console.error(
          'Erro ao criar inspeção:',
          error
        );

        const apiMessage =
          getApiErrorMessage(
            error
          );

        setErrorMessage(
          apiMessage
            ? `Não foi possível agendar a inspeção: ${apiMessage}`
            : 'Não foi possível comunicar com a API para criar a inspeção.'
        );
      } finally {
        submittingRef.current = false;
        setIsSubmitting(
          false
        );
      }
    };

  if (isLoadingInitial) {
    return (
      <>
        <TopHeader
          title="Nova Inspeção"
        />

        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2
            size={30}
            className="animate-spin text-[#0f766e]"
          />

          <span className="text-sm font-semibold">
            Carregando dados
            para planejamento...
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      <TopHeader
        title="Nova Inspeção"
        context={
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">
              Inspeções
            </span>

            <ChevronRight
              size={14}
              className="text-slate-400"
            />

            <span className="font-semibold text-slate-800">
              Planejamento
            </span>
          </div>
        }
      />

      <main className="p-8 max-w-6xl mx-auto space-y-6">
        <section>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Calendar
              size={30}
              className="text-[#0f766e]"
            />

            Planejar Inspeção
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Defina o local,
            equipamento, técnico
            responsável e data
            prevista para execução.
          </p>
        </section>

        {errorMessage && (
          <section className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="shrink-0 mt-0.5"
            />

            <div>
              <div className="font-bold">
                Não foi possível
                continuar
              </div>

              <div className="mt-1">
                {errorMessage}
              </div>
            </div>
          </section>
        )}

        <form
          onSubmit={
            handleSubmit
          }
          className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* LEFT */}
            <section className="p-6 lg:p-8 lg:border-r border-slate-200 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Building2
                  size={18}
                  className="text-[#0f766e]"
                />

                <h2 className="font-bold text-slate-800">
                  1. Local da
                  inspeção
                </h2>
              </div>

              {/* CLIENT */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Cliente *
                </label>

                <select
                  required
                  aria-label="Cliente" value={selectedClienteId}
                  onChange={(
                    event
                  ) =>
                    void handleClienteChange(
                      event.target
                        .value
                    )
                  }
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                >
                  <option value="">
                    Selecione um
                    cliente...
                  </option>

                  {clientes.map(
                    (
                      cliente
                    ) => (
                      <option
                        key={
                          cliente.id
                        }
                        value={
                          cliente.id
                        }
                      >
                        {
                          cliente.nome
                        }
                      </option>
                    )
                  )}
                </select>

                <p className="text-[11px] text-slate-400 mt-1">
                  Somente clientes
                  ativos são
                  disponibilizados.
                </p>
              </div>

              {/* SITE */}
              <div>
                <label className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  <span>
                    Local / Unidade *
                  </span>

                  {isLoadingLocais && (
                    <Loader2
                      size={13}
                      className="animate-spin text-[#0f766e]"
                    />
                  )}
                </label>

                <select
                  required
                  aria-label="Local" value={selectedLocalId}
                  disabled={
                    !selectedClienteId ||
                    isLoadingLocais
                  }
                  onChange={(
                    event
                  ) =>
                    void handleLocalChange(
                      event.target
                        .value
                    )
                  }
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 disabled:bg-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                >
                  <option value="">
                    {!selectedClienteId
                      ? 'Selecione o cliente primeiro...'
                      : locais.length ===
                          0
                        ? 'Nenhum local ativo encontrado'
                        : 'Selecione o local...'}
                  </option>

                  {locais.map(
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
                        }{' '}
                        —{' '}
                        {
                          local.endereco
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* EQUIPMENT */}
              <div>
                <label className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  <span>
                    Equipamento *
                  </span>

                  {isLoadingEquipamentos && (
                    <Loader2
                      size={13}
                      className="animate-spin text-[#0f766e]"
                    />
                  )}
                </label>

                <select
                  required
                  aria-label="Equipamento" value={selectedEquipamentoId}
                  disabled={
                    !selectedLocalId ||
                    isLoadingEquipamentos
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedEquipamentoId(
                      event.target
                        .value
                    )
                  }
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 disabled:bg-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                >
                  <option value="">
                    {!selectedLocalId
                      ? 'Selecione o local primeiro...'
                      : equipamentos.length ===
                          0
                        ? 'Nenhum equipamento ativo encontrado'
                        : 'Selecione o equipamento...'}
                  </option>

                  {equipamentos.map(
                    (
                      equipamento
                    ) => (
                      <option
                        key={
                          equipamento.id
                        }
                        value={
                          equipamento.id
                        }
                      >
                        {
                          equipamento.nome
                        }

                        {equipamento.numeroSerie
                          ? ` — ${equipamento.numeroSerie}`
                          : ''}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* CONTEXT */}
              {(selectedCliente ||
                selectedLocal ||
                selectedEquipamento) && (
                <div className="p-4 rounded-lg border border-teal-200 bg-teal-50/60 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    Contexto
                    selecionado
                  </div>

                  {selectedCliente && (
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <Building2
                        size={
                          13
                        }
                      />

                      {
                        selectedCliente.nome
                      }
                    </div>
                  )}

                  {selectedLocal && (
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <MapPin
                        size={
                          13
                        }
                      />

                      {
                        selectedLocal.nome
                      }
                    </div>
                  )}

                  {selectedEquipamento && (
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <Wrench
                        size={
                          13
                        }
                      />

                      {
                        selectedEquipamento.nome
                      }
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* RIGHT */}
            <section className="p-6 lg:p-8 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Clock
                  size={18}
                  className="text-[#0f766e]"
                />

                <h2 className="font-bold text-slate-800">
                  2. Planejamento
                  operacional
                </h2>
              </div>

              {/* TEMPLATE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Modelo de inspeção publicado *
                </label>
                <select
                  required
                  aria-label="Versão publicada" value={selectedTemplateVersionId}
                  onChange={(event) => setSelectedTemplateVersionId(event.target.value)}
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                >
                  <option value="">{modelosPublicados.length ? 'Selecione um modelo...' : 'Nenhum modelo publicado disponível'}</option>
                  {modelosPublicados.map((modelo) => (
                    <option key={modelo.versaoId} value={modelo.versaoId}>
                      {modelo.titulo} — v{modelo.versao}
                    </option>
                  ))}
                </select>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Título /
                  descrição *
                </label>

                <input
                  type="text"
                  required
                  aria-label="Título da inspeção" value={descricao}
                  onChange={(
                    event
                  ) =>
                    setDescricao(
                      event.target
                        .value
                    )
                  }
                  placeholder="Ex: Inspeção preventiva trimestral"
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              {/* DATE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Data e hora
                  prevista *
                </label>

                <input
                  type="datetime-local"
                  required
                  min={
                    getMinimumScheduledDate()
                  }
                  aria-label="Prazo da inspeção" value={dataAgendada}
                  onChange={(
                    event
                  ) =>
                    setDataAgendada(
                      event.target
                        .value
                    )
                  }
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              {/* TECH */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Técnico
                  responsável *
                </label>

                <select
                  required
                  aria-label="Técnico" value={selectedTecnicoId}
                  onChange={(
                    event
                  ) =>
                    setSelectedTecnicoId(
                      event.target
                        .value
                    )
                  }
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                >
                  <option value="">
                    Selecione um
                    técnico...
                  </option>

                  {tecnicos.map(
                    (
                      tecnico
                    ) => (
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
                        }{' '}
                        —{' '}
                        {
                          tecnico.email
                        }
                      </option>
                    )
                  )}
                </select>

                <p className="text-[11px] text-slate-400 mt-1">
                  Somente usuários
                  ativos com perfil
                  técnico são
                  exibidos.
                </p>
              </div>

              {/* PRIORITY */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Prioridade
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 border border-slate-300 rounded-lg overflow-hidden">
                  {(
                    [
                      'Baixa',
                      'Média',
                      'Alta',
                      'Crítica',
                    ] as Priority[]
                  ).map(
                    (
                      item
                    ) => (
                      <button
                        key={
                          item
                        }
                        type="button"
                        onClick={() =>
                          setPrioridade(
                            item
                          )
                        }
                        className={`py-2.5 px-2 text-xs font-bold border-r last:border-r-0 border-slate-200 transition-colors ${
                          prioridade ===
                          item
                            ? 'bg-[#0f766e] text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>

              </div>

              {/* NOTES */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Instruções /
                  observações
                </label>

                <textarea
                  rows={4}
                  aria-label="Instruções ao técnico" value={observacoes}
                  onChange={(
                    event
                  ) =>
                    setObservacoes(
                      event.target
                        .value
                    )
                  }
                  placeholder="EPIs, acesso ao local, pessoa de contato, instruções especiais..."
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              {selectedTecnico && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2">
                  <UserRound
                    size={15}
                    className="text-[#0f766e] shrink-0 mt-0.5"
                  />

                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Técnico
                      selecionado
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5">
                      {
                        selectedTecnico.nome
                      }{' '}
                      •{' '}
                      {
                        selectedTecnico.email
                      }
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <footer className="px-6 lg:px-8 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-3">
            <Link
              href="/inspections"
              className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-semibold text-sm text-center"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={
                isSubmitting
              }
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg font-bold text-sm disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle2
                    size={16}
                  />

                  Agendar Inspeção
                </>
              )}
            </button>
          </footer>
        </form>
      </main>
    </>
  );
}

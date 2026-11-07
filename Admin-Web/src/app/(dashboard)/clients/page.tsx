'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
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
  UserRoundX,
  X,
} from 'lucide-react';

import TopHeader from '@/components/layout/TopHeader';
import {
  clienteService,
  type ClienteDTO,
} from '@/lib/api/services';

type StatusFilter = 'TODOS' | 'ATIVOS' | 'INATIVOS';

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.length !== 14) {
    return value;
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
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

export default function ClientsPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('TODOS');

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  // Create
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  const [formError, setFormError] =
    useState<string | null>(null);

  // Inactivation
  const [clientToDeactivate, setClientToDeactivate] =
    useState<ClienteDTO | null>(null);

  const [isDeactivating, setIsDeactivating] =
    useState(false);

  useEffect(() => {
    let active = true;

    const loadClients = async () => {
      try {
        const data = await clienteService.listar();

        if (active) {
          setClientes(data);
        }
      } catch (error: unknown) {
        console.error('Erro ao carregar clientes:', error);

        if (active) {
          setErrorMessage(
            'Não foi possível carregar os clientes da API.'
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadClients();

    return () => {
      active = false;
    };
  }, []);

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return clientes.filter((cliente) => {
      const matchesSearch =
        !term ||
        cliente.nome.toLowerCase().includes(term) ||
        cliente.email.toLowerCase().includes(term) ||
        cliente.cnpj.toLowerCase().includes(term) ||
        cliente.telefone.toLowerCase().includes(term) ||
        String(cliente.id).includes(term);

      const matchesStatus =
        statusFilter === 'TODOS' ||
        (statusFilter === 'ATIVOS' && cliente.ativo) ||
        (statusFilter === 'INATIVOS' && !cliente.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [clientes, searchTerm, statusFilter]);

  const totalAtivos = clientes.filter(
    (cliente) => cliente.ativo
  ).length;

  const totalInativos = clientes.filter(
    (cliente) => !cliente.ativo
  ).length;

  const showSuccess = (message: string) => {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const data = await clienteService.listar();
      setClientes(data);
    } catch (error: unknown) {
      console.error('Erro ao atualizar clientes:', error);

      setErrorMessage(
        'Não foi possível atualizar a lista de clientes.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const openCreateModal = () => {
    setNome('');
    setCnpj('');
    setTelefone('');
    setEmail('');
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleCreateClient = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setFormError(null);

    const normalizedCnpj = cnpj.replace(/\D/g, '');
    const normalizedTelefone = telefone.replace(/\D/g, '');

    if (!nome.trim()) {
      setFormError('Informe o nome do cliente.');
      return;
    }

    if (normalizedCnpj.length !== 14) {
      setFormError(
        'Informe um CNPJ válido com 14 dígitos.'
      );
      return;
    }

    if (!/^\d{10,11}$/.test(normalizedTelefone)) {
      setFormError('Informe o telefone com DDD e 10 ou 11 dígitos.');
      return;
    }

    if (!email.trim()) {
      setFormError('Informe o e-mail do cliente.');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await clienteService.cadastrar({
        nome: nome.trim(),
        cnpj: normalizedCnpj,
        telefone: normalizedTelefone,
        email: email.trim(),
      });

      setClientes((current) => [
        created,
        ...current,
      ]);

      setIsCreateOpen(false);
      router.push(`/clients/${created.id}`);
    } catch (error: unknown) {
      console.error('Erro ao cadastrar cliente:', error);

      const apiMessage = getApiErrorMessage(error);

      setFormError(
        apiMessage
          ? `Não foi possível cadastrar: ${apiMessage}`
          : 'Não foi possível cadastrar o cliente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateClient = async () => {
    if (!clientToDeactivate) {
      return;
    }

    setIsDeactivating(true);
    setErrorMessage(null);

    try {
      await clienteService.inativar(
        clientToDeactivate.id
      );

      setClientes((current) =>
        current.map((cliente) =>
          cliente.id === clientToDeactivate.id
            ? {
                ...cliente,
                ativo: false,
              }
            : cliente
        )
      );

      showSuccess(
        `Cliente "${clientToDeactivate.nome}" inativado com sucesso.`
      );

      setClientToDeactivate(null);
    } catch (error: unknown) {
      console.error('Erro ao inativar cliente:', error);

      const apiMessage = getApiErrorMessage(error);

      setErrorMessage(
        apiMessage
          ? `Não foi possível inativar o cliente: ${apiMessage}`
          : 'Não foi possível inativar o cliente.'
      );
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <>
      <TopHeader
        title="Clientes"
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
              Clientes
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
              <Building2
                size={30}
                className="text-[#0f766e]"
              />

              Clientes
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Gerencie as empresas atendidas pela operação
              FieldOps.
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
              Novo cliente
            </button>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total de clientes"
            value={clientes.length}
          />

          <StatCard
            title="Clientes ativos"
            value={totalAtivos}
          />

          <StatCard
            title="Clientes inativos"
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
                Não foi possível concluir a operação
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
        <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Buscar por nome, CNPJ, e-mail, telefone ou ID..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as StatusFilter
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
                Carregando clientes...
              </span>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-12 text-center">
              <Building2
                size={42}
                className="mx-auto mb-3 text-slate-300"
              />

              <h2 className="font-bold text-slate-800">
                Nenhum cliente encontrado
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Altere os filtros ou cadastre um novo
                cliente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">
                      Cliente
                    </th>

                    <th className="px-6 py-4">
                      CNPJ
                    </th>

                    <th className="px-6 py-4">
                      Contato
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
                  {filteredClients.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0f766e] flex items-center justify-center">
                            <Building2 size={17} />
                          </div>

                          <div>
                            <div className="font-bold text-sm text-slate-900">
                              {cliente.nome}
                            </div>

                            <div className="text-xs text-slate-500 mt-0.5">
                              {cliente.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {formatCnpj(cliente.cnpj)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700">
                          {cliente.telefone}
                        </div>

                        <div className="text-xs text-slate-500">
                          {cliente.email}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            cliente.ativo
                              ? 'px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold'
                              : 'px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold'
                          }
                        >
                          {cliente.ativo
                            ? 'ATIVO'
                            : 'INATIVO'}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        #{cliente.id}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/clients/${cliente.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            title="Ver locais e equipamentos deste cliente"
                          >
                            <MapPin size={14} />
                            Detalhes
                            <ExternalLink size={12} />
                          </Link>

                          {cliente.ativo && (
                            <button
                              type="button"
                              onClick={() =>
                                setClientToDeactivate(
                                  cliente
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              <UserRoundX size={14} />
                              Inativar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* API limitation */}
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertCircle
              size={18}
              className="text-amber-600 shrink-0 mt-0.5"
            />

            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Edição depende da API
              </h3>

              <p className="text-xs leading-5 text-amber-800 mt-1">
                O serviço atual permite cadastrar, consultar
                e inativar clientes, mas não possui endpoint
                de edição. Por isso a interface não tenta
                alterar dados cadastrais por um endpoint
                inexistente.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-slate-900">
                  Novo cliente
                </h2>

                <p className="text-xs text-slate-500">
                  Cadastre uma empresa atendida pelo
                  FieldOps.
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
              onSubmit={handleCreateClient}
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
                  Razão social / Nome *
                </label>

                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(event) =>
                    setNome(event.target.value)
                  }
                  placeholder="Ex: Indústria ABC"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CNPJ *
                </label>

                <input
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={14}
                  value={cnpj}
                  onChange={(event) =>
                    setCnpj(event.target.value.replace(/\D/g, '').slice(0, 14))
                  }
                  placeholder="12345678000195"
                  pattern="\d{14}"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />

                <p className="text-[11px] text-slate-400 mt-1">
                  Informe os 14 dígitos do CNPJ.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone *
                </label>

                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={11}
                  value={telefone}
                  onChange={(event) =>
                    setTelefone(event.target.value.replace(/\D/g, '').slice(0, 11))
                  }
                  placeholder="11999998888"
                  pattern="\d{10,11}"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Informe o DDD e o número (10 ou 11 dígitos).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail *
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="contato@empresa.com.br"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
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
                      Cadastrar cliente
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate confirmation */}
      {clientToDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <UserRoundX size={23} />
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                Inativar cliente?
              </h2>

              <p className="text-sm text-slate-600 mt-2 leading-6">
                O cliente{' '}
                <strong>
                  {clientToDeactivate.nome}
                </strong>{' '}
                será marcado como inativo.
              </p>

              <p className="text-xs text-slate-500 mt-2 leading-5">
                O histórico não será apagado. A inativação
                preserva os registros existentes conforme as
                regras do FieldOps.
              </p>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  disabled={isDeactivating}
                  onClick={() =>
                    setClientToDeactivate(null)
                  }
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isDeactivating}
                  onClick={handleDeactivateClient}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold disabled:opacity-60"
                >
                  {isDeactivating && (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  Confirmar inativação
                </button>
              </div>
            </div>
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

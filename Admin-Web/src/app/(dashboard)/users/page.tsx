'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Search,
  Shield,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import TopHeader from '@/components/layout/TopHeader';
import {
  usuarioService,
  type UsuarioDTO,
} from '@/lib/api/services';
import type { Profile } from '@/types';
import { useSessionStore } from '@/stores/sessionStore';
import { canManageUsers } from '@/lib/auth/permissions';
import { useRouter } from 'next/navigation';

type StatusFilter = 'TODOS' | 'ATIVOS' | 'INATIVOS';
type ProfileFilter = 'TODOS' | Profile;

export default function UsersPage() {
  const router = useRouter();
  const { session } = useSessionStore();
  const canManageCurrentUsers = canManageUsers(session?.profile);

  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inactivatingUserId, setInactivatingUserId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [profileFilter, setProfileFilter] =
    useState<ProfileFilter>('TODOS');
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('TODOS');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<Profile>('TECNICO');

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  useEffect(() => {
    if (session && !canManageCurrentUsers) {
      router.replace('/forbidden');
    }
  }, [canManageCurrentUsers, router, session]);

  useEffect(() => {
    let active = true;

    if (!canManageCurrentUsers) {
      return () => { active = false; };
    }

    const loadUsers = async () => {
      try {
        const data = await usuarioService.listarTodos();

        if (active) {
          setUsuarios(data);
        }
      } catch (error: unknown) {
        console.error('Erro ao carregar usuários:', error);

        if (active) {
          setErrorMessage(
            'Não foi possível carregar os usuários da API.'
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      active = false;
    };
  }, [canManageCurrentUsers]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const matchesSearch =
        !term ||
        usuario.nome.toLowerCase().includes(term) ||
        usuario.email.toLowerCase().includes(term) ||
        String(usuario.id).includes(term);

      const matchesProfile =
        profileFilter === 'TODOS' ||
        usuario.perfil === profileFilter;

      const matchesStatus =
        statusFilter === 'TODOS' ||
        (statusFilter === 'ATIVOS' && usuario.ativo) ||
        (statusFilter === 'INATIVOS' && !usuario.ativo);

      return (
        matchesSearch &&
        matchesProfile &&
        matchesStatus
      );
    });
  }, [
    usuarios,
    searchTerm,
    profileFilter,
    statusFilter,
  ]);

  const totalAtivos =
    usuarios.filter((usuario) => usuario.ativo).length;

  const totalTecnicos =
    usuarios.filter(
      (usuario) => usuario.perfil === 'TECNICO'
    ).length;

  const totalSupervisores =
    usuarios.filter(
      (usuario) => usuario.perfil === 'SUPERVISOR'
    ).length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const data = await usuarioService.listarTodos();
      setUsuarios(data);
    } catch (error: unknown) {
      console.error('Erro ao atualizar usuários:', error);

      setErrorMessage(
        'Não foi possível atualizar a lista de usuários.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInactivate = async (usuario: UsuarioDTO) => {
    const confirmed = window.confirm(
      `Inativar ${usuario.nome}? A pessoa perderá o acesso ao FieldOps.`
    );

    if (!confirmed) {
      return;
    }

    setInactivatingUserId(usuario.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await usuarioService.inativar(usuario.id);
      setUsuarios((current) =>
        current.map((item) =>
          item.id === usuario.id ? { ...item, ativo: false } : item
        )
      );
      setSuccessMessage(`Usuário "${usuario.nome}" inativado com sucesso.`);
    } catch (error: unknown) {
      console.error('Erro ao inativar usuário:', error);
      setErrorMessage(
        'Não foi possível inativar o usuário. Verifique sua permissão e tente novamente.'
      );
    } finally {
      setInactivatingUserId(null);
    }
  };

  const openCreateModal = () => {
    setNome('');
    setEmail('');
    setSenha('');
    setPerfil('TECNICO');
    setIsModalOpen(true);
  };

  const handleCreateUser = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!nome.trim()) {
      setErrorMessage('Informe o nome do usuário.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Informe o e-mail do usuário.');
      return;
    }

    if (senha.length < 6) {
      setErrorMessage(
        'A senha deve possuir pelo menos 6 caracteres.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await usuarioService.cadastrar({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        perfil,
      });

      setUsuarios((current) => [
        created,
        ...current,
      ]);

      setSuccessMessage(
        `Usuário "${created.nome}" cadastrado com sucesso.`
      );

      setIsModalOpen(false);

      window.setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (error: unknown) {
      console.error('Erro ao cadastrar usuário:', error);

      setErrorMessage(
        'Não foi possível cadastrar o usuário. Verifique os dados e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProfileLabel = (profile: Profile) => {
    switch (profile) {
      case 'ADMINISTRADOR':
        return 'Administrador';

      case 'SUPERVISOR':
        return 'Supervisor';

      case 'TECNICO':
        return 'Técnico';

      default:
        return profile;
    }
  };

  const getProfileClasses = (profile: Profile) => {
    switch (profile) {
      case 'ADMINISTRADOR':
        return 'bg-purple-50 text-purple-700 border-purple-200';

      case 'SUPERVISOR':
        return 'bg-blue-50 text-blue-700 border-blue-200';

      case 'TECNICO':
        return 'bg-teal-50 text-teal-700 border-teal-200';

      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (!canManageCurrentUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-semibold text-slate-600">Validando acesso...</div>
    );
  }

  return (
    <>
      <TopHeader
        title="Usuários"
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
              Usuários
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
              onClick={() => setSuccessMessage(null)}
              className="ml-3 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Users
                size={30}
                className="text-[#0f766e]"
              />

              Usuários
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Gerencie os usuários e perfis de acesso do FieldOps.
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
              <UserPlus size={17} />
              Novo usuário
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total"
            value={usuarios.length}
          />

          <StatCard
            title="Ativos"
            value={totalAtivos}
          />

          <StatCard
            title="Técnicos"
            value={totalTecnicos}
          />

          <StatCard
            title="Supervisores"
            value={totalSupervisores}
          />
        </section>

        {errorMessage && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex gap-3 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="shrink-0 mt-0.5"
            />

            <div>
              <div className="font-bold">
                Não foi possível concluir a operação
              </div>

              <div className="mt-0.5">
                {errorMessage}
              </div>
            </div>
          </div>
        )}

        <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col xl:flex-row gap-3">
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
              placeholder="Pesquisar por nome, e-mail ou ID..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
            />
          </div>

          <select
            value={profileFilter}
            onChange={(event) =>
              setProfileFilter(
                event.target.value as ProfileFilter
              )
            }
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-700"
          >
            <option value="TODOS">
              Todos os perfis
            </option>

            <option value="ADMINISTRADOR">
              Administrador
            </option>

            <option value="SUPERVISOR">
              Supervisor
            </option>

            <option value="TECNICO">
              Técnico
            </option>
          </select>

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

        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center gap-3 text-slate-500">
              <Loader2
                size={30}
                className="animate-spin text-[#0f766e]"
              />

              <span className="text-sm">
                Carregando usuários...
              </span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users
                size={42}
                className="mx-auto mb-3 text-slate-300"
              />

              <h2 className="font-bold text-slate-800">
                Nenhum usuário encontrado
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Altere os filtros ou cadastre um novo usuário.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">
                      Usuário
                    </th>

                    <th className="px-6 py-4">
                      E-mail
                    </th>

                    <th className="px-6 py-4">
                      Perfil
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
                  {filteredUsers.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className="hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-50 text-[#0f766e] flex items-center justify-center font-bold">
                            {usuario.nome
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <div className="font-bold text-sm text-slate-900">
                              {usuario.nome}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {usuario.email}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold ${getProfileClasses(
                            usuario.perfil
                          )}`}
                        >
                          <Shield size={12} />

                          {getProfileLabel(
                            usuario.perfil
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            usuario.ativo
                              ? 'px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold'
                              : 'px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold'
                          }
                        >
                          {usuario.ativo
                            ? 'ATIVO'
                            : 'INATIVO'}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        #{usuario.id}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {usuario.ativo && (
                          <button
                            type="button"
                            onClick={() => void handleInactivate(usuario)}
                            disabled={inactivatingUserId !== null}
                            title="Inativar usuário"
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {inactivatingUserId === usuario.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Power size={14} />
                            )}
                            Inativar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertCircle
              size={18}
              className="text-amber-600 shrink-0 mt-0.5"
            />

            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Funcionalidades dependentes da API
              </h3>

              <p className="text-xs leading-5 text-amber-800 mt-1">
                A API disponibiliza a inativação de usuários
                pela rota PATCH /usuarios/:id/inativar,
                integrada nesta tela. Ativação, bloqueio e
                redefinição de acesso ainda não estão expostos
                no contrato atual.
              </p>
            </div>
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-slate-900">
                  Novo usuário
                </h2>

                <p className="text-xs text-slate-500">
                  Cadastre uma nova conta no FieldOps.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsModalOpen(false)
                }
                className="p-2 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCreateUser}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome completo *
                </label>

                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(event) =>
                    setNome(event.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Senha inicial *
                </label>

                <input
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(event) =>
                    setSenha(event.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Perfil *
                </label>

                <select
                  value={perfil}
                  onChange={(event) =>
                    setPerfil(
                      event.target.value as Profile
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                >
                  <option value="TECNICO">
                    Técnico
                  </option>

                  <option value="SUPERVISOR">
                    Supervisor
                  </option>

                  <option value="ADMINISTRADOR">
                    Administrador
                  </option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setIsModalOpen(false)
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

                      Cadastrar usuário
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

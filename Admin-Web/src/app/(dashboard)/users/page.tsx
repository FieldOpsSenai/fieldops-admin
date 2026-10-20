'use client';

import React, { useState, useEffect, useMemo } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/stores/sessionStore';
import { canManageUsers } from '@/lib/auth/permissions';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Shield,
  RefreshCw,
  X,
  UserCheck,
  UserCog,
  Wrench,
} from 'lucide-react';
import { usuarioService, UsuarioDTO } from '@/lib/api/services';
import { Profile } from '@/types';

export default function UsersManagementPage() {
  const router = useRouter();
  const { session } = useSessionStore();

  const userCanManage = canManageUsers(session?.profile);

  useEffect(() => {
    if (!userCanManage) {
      router.replace('/forbidden');
    }
  }, [userCanManage, router]);

  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileFilter, setProfileFilter] = useState<'TODOS' | Profile>('TODOS');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [userNome, setUserNome] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userSenha, setUserSenha] = useState('123456');
  const [userPerfil, setUserPerfil] = useState<Profile>('TECNICO');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadUsers = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await usuarioService.listarTodos();
      setUsuarios(data);
    } catch (err: unknown) {
      console.error('Erro ao carregar usuários:', err);
      setErrorMessage('Erro ao carregar lista de usuários da API.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (userCanManage) {
      loadUsers();
    }
  }, [userCanManage]);

  const handleOpenModal = () => {
    setUserNome('');
    setUserEmail('');
    setUserSenha('123456');
    setUserPerfil('TECNICO');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const created = await usuarioService.cadastrar({
        nome: userNome.trim(),
        email: userEmail.trim(),
        senha: userSenha,
        perfil: userPerfil,
      });

      setUsuarios([created, ...usuarios]);
      showToast(`Usuário "${created.nome}" cadastrado com sucesso!`);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Erro ao cadastrar usuário:', err);
      const msg = err.response?.data?.mensagem || err.response?.data || err.message;
      alert(`Falha ao cadastrar: ${typeof msg === 'string' ? msg : 'Verifique os dados.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((u) => {
      const matchesSearch =
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProfile =
        profileFilter === 'TODOS' || u.perfil === profileFilter;
      return matchesSearch && matchesProfile;
    });
  }, [usuarios, searchTerm, profileFilter]);

  const stats = useMemo(() => {
    const tecnicos = usuarios.filter((u) => u.perfil === 'TECNICO').length;
    const supervisores = usuarios.filter((u) => u.perfil === 'SUPERVISOR').length;
    const administradores = usuarios.filter((u) => u.perfil === 'ADMINISTRADOR').length;
    return { tecnicos, supervisores, administradores, total: usuarios.length };
  }, [usuarios]);

  if (!userCanManage) {
    return null;
  }

  return (
    <>
      <TopHeader
        title="Gerenciamento de Usuários & Técnicos"
        context={
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>FieldOps</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800">Controle de Acesso</span>
          </div>
        }
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-lg shadow-xl border border-slate-700 animate-in fade-in">
            <CheckCircle2 size={20} className="text-[#10b981]" />
            <span className="text-sm font-medium">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-3 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => loadUsers(true)}
              className="font-bold underline text-red-800 hover:text-red-900"
            >
              Recarregar
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Usuários & Técnicos
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Controle de contas, perfis de acesso e credenciais de operadores de campo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadUsers(true)}
              className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-xs transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
              title="Atualizar lista"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? 'animate-spin text-[#0f766e]' : ''}
              />
              <span className="hidden sm:inline">Recarregar</span>
            </button>

            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg shadow-xs font-bold text-sm transition-colors cursor-pointer"
            >
              <Plus size={18} />
              Novo Usuário
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total de Contas
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="text-xs font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench size={14} />
              Técnicos
            </div>
            <div className="text-2xl font-bold text-[#0f766e] mt-1">{stats.tecnicos}</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck size={14} />
              Supervisores
            </div>
            <div className="text-2xl font-bold text-blue-700 mt-1">{stats.supervisores}</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} />
              Administradores
            </div>
            <div className="text-2xl font-bold text-purple-700 mt-1">
              {stats.administradores}
            </div>
          </div>
        </div>

        {/* Search & Profile Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="block w-full pl-9 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] bg-white shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Perfil:</span>
            <select
              value={profileFilter}
              onChange={(e) => setProfileFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#10b981]"
            >
              <option value="TODOS">Todos os perfis</option>
              <option value="TECNICO">Técnicos</option>
              <option value="SUPERVISOR">Supervisores</option>
              <option value="ADMINISTRADOR">Administradores</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin text-[#0f766e]" />
              <span className="text-sm font-medium">Carregando usuários...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">ID</th>
                    <th className="px-6 py-3.5">Usuário</th>
                    <th className="px-6 py-3.5">E-mail</th>
                    <th className="px-6 py-3.5">Perfil de Acesso</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredUsuarios.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredUsuarios.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                          #{u.id}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-[#0f766e] text-xs font-bold flex items-center justify-center uppercase">
                            {u.nome.charAt(0)}
                          </div>
                          <span>{u.nome}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{u.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${
                              u.perfil === 'ADMINISTRADOR'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : u.perfil === 'SUPERVISOR'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-teal-50 text-[#0f766e] border-teal-200'
                            }`}
                          >
                            {u.perfil}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ATIVO
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Cadastrar Novo Usuário</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Criação de conta com credenciais de acesso ao FieldOps.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={userNome}
                  onChange={(e) => setUserNome(e.target.value)}
                  placeholder="Ex: João Técnico Silva"
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Corporativo *
                </label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="joao.silva@fieldops.com"
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Senha de Acesso *
                </label>
                <input
                  type="password"
                  required
                  value={userSenha}
                  onChange={(e) => setUserSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Perfil de Acesso *
                </label>
                <select
                  value={userPerfil}
                  onChange={(e) => setUserPerfil(e.target.value as Profile)}
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-[#10b981]"
                >
                  <option value="TECNICO">TECNICO (Executa vistorias e inspeções em campo)</option>
                  <option value="SUPERVISOR">SUPERVISOR (Aprova vistorias e planeja rotinas)</option>
                  <option value="ADMINISTRADOR">ADMINISTRADOR (Acesso total)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

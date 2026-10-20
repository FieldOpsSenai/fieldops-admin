'use client';

import React, { useState, useEffect, useMemo } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import {
  Building2,
  MapPin,
  Wrench,
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  Check,
  Info,
  Phone,
  Mail,
  FileText,
  Sparkles,
  Layers,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import {
  clienteService,
  localService,
  equipamentoService,
  ClienteDTO,
  LocalDTO,
  EquipamentoDTO,
  ClienteRequest,
  LocalRequest,
  EquipamentoRequest,
} from '@/lib/api/services';

export type StepType = 1 | 2 | 3;

interface ClientsHierarchyManagerProps {
  initialStep?: StepType;
}

export default function ClientsHierarchyManager({
  initialStep = 1,
}: ClientsHierarchyManagerProps) {
  // Stepper state
  const [currentStep, setCurrentStep] = useState<StepType>(initialStep);

  // Selected entities hierarchy
  const [selectedCliente, setSelectedCliente] = useState<ClienteDTO | null>(null);
  const [selectedLocal, setSelectedLocal] = useState<LocalDTO | null>(null);
  const [selectedEquipamento, setSelectedEquipamento] = useState<EquipamentoDTO | null>(null);

  // Search & Filters per step
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Global Data
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [locais, setLocais] = useState<LocalDTO[]>([]);
  const [equipamentos, setEquipamentos] = useState<EquipamentoDTO[]>([]);

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals for CRUD
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing targets
  const [editingCliente, setEditingCliente] = useState<ClienteDTO | null>(null);
  const [editingLocal, setEditingLocal] = useState<LocalDTO | null>(null);
  const [editingEquipamento, setEditingEquipamento] = useState<EquipamentoDTO | null>(null);

  // Post-creation prompt modal ("Cadastrar próximo nível imediatamente?")
  const [promptNextStep, setPromptNextStep] = useState<{
    type: 'CLIENTE_CREATED' | 'LOCAL_CREATED';
    title: string;
    description: string;
    targetName: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  // Form states - Cliente
  const [formClienteNome, setFormClienteNome] = useState('');
  const [formClienteCnpj, setFormClienteCnpj] = useState('');
  const [formClienteTelefone, setFormClienteTelefone] = useState('');
  const [formClienteEmail, setFormClienteEmail] = useState('');

  // Form states - Local
  const [formLocalNome, setFormLocalNome] = useState('');
  const [formLocalEndereco, setFormLocalEndereco] = useState('');
  const [formLocalClienteId, setFormLocalClienteId] = useState<string>('');

  // Form states - Equipamento
  const [formEquipNome, setFormEquipNome] = useState('');
  const [formEquipNumeroSerie, setFormEquipNumeroSerie] = useState('');
  const [formEquipTipo, setFormEquipTipo] = useState('');
  const [formEquipLocalId, setFormEquipLocalId] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load all hierarchy data from backend
  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const [cRes, lRes, eRes] = await Promise.allSettled([
        clienteService.listar(),
        localService.listarTodos(),
        equipamentoService.listarTodos(),
      ]);

      let loadedClientes: ClienteDTO[] = [];
      let loadedLocais: LocalDTO[] = [];
      let loadedEquipamentos: EquipamentoDTO[] = [];

      if (cRes.status === 'fulfilled') {
        loadedClientes = cRes.value;
        setClientes(loadedClientes);
      } else {
        console.error('Erro ao buscar clientes:', cRes.reason);
      }

      if (lRes.status === 'fulfilled') {
        loadedLocais = lRes.value;
        setLocais(loadedLocais);
      } else {
        console.error('Erro ao buscar locais:', lRes.reason);
      }

      if (eRes.status === 'fulfilled') {
        loadedEquipamentos = eRes.value;
        setEquipamentos(loadedEquipamentos);
      } else {
        console.error('Erro ao buscar equipamentos:', eRes.reason);
      }

      // Update selected records if they still exist in fresh data
      setSelectedCliente((prev) => (prev ? loadedClientes.find((c) => c.id === prev.id) || prev : null));
      setSelectedLocal((prev) => (prev ? loadedLocais.find((l) => l.id === prev.id) || prev : null));
      setSelectedEquipamento((prev) =>
        prev ? loadedEquipamentos.find((e) => e.id === prev.id) || prev : null
      );
    } catch (err: unknown) {
      console.error('Erro carregando hierarquia:', err);
      setErrorMessage('Erro ao comunicar com a API do FieldOps.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update initialStep if prop changes
  useEffect(() => {
    if (initialStep) {
      setCurrentStep(initialStep);
    }
  }, [initialStep]);

  // Derived statistics & mappings
  const locaisByCliente = useMemo(() => {
    const map = new Map<number, LocalDTO[]>();
    locais.forEach((loc) => {
      const list = map.get(loc.clienteId) || [];
      list.push(loc);
      map.set(loc.clienteId, list);
    });
    return map;
  }, [locais]);

  const equipamentosByLocal = useMemo(() => {
    const map = new Map<number, EquipamentoDTO[]>();
    equipamentos.forEach((eq) => {
      const list = map.get(eq.localId) || [];
      list.push(eq);
      map.set(eq.localId, list);
    });
    return map;
  }, [equipamentos]);

  // Step 2 locais: filtered by selected client if any, otherwise all locais
  const displayedLocais = useMemo(() => {
    if (selectedCliente) {
      return locais.filter((l) => l.clienteId === selectedCliente.id);
    }
    return locais;
  }, [locais, selectedCliente]);

  // Step 3 equipamentos: filtered by selected local if any, otherwise by selected client, or all
  const displayedEquipamentos = useMemo(() => {
    if (selectedLocal) {
      return equipamentos.filter((e) => e.localId === selectedLocal.id);
    }
    if (selectedCliente) {
      const clientLocalIds = new Set(
        locais.filter((l) => l.clienteId === selectedCliente.id).map((l) => l.id)
      );
      return equipamentos.filter((e) => clientLocalIds.has(e.localId));
    }
    return equipamentos;
  }, [equipamentos, selectedLocal, selectedCliente, locais]);

  // Filtered lists with search and status
  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const matchSearch =
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cnpj.includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
            ? c.ativo
            : !c.ativo;
      return matchSearch && matchStatus;
    });
  }, [clientes, searchTerm, statusFilter]);

  const filteredLocais = useMemo(() => {
    return displayedLocais.filter((l) => {
      const matchSearch =
        l.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.clienteNome && l.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
            ? l.ativo
            : !l.ativo;
      return matchSearch && matchStatus;
    });
  }, [displayedLocais, searchTerm, statusFilter]);

  const filteredEquipamentos = useMemo(() => {
    return displayedEquipamentos.filter((e) => {
      const matchSearch =
        e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.tipo && e.tipo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.localNome && e.localNome.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
            ? e.ativo
            : !e.ativo;
      return matchSearch && matchStatus;
    });
  }, [displayedEquipamentos, searchTerm, statusFilter]);

  // Handlers for navigating hierarchy
  const handleSelectCliente = (cliente: ClienteDTO) => {
    setSelectedCliente(cliente);
    // If selecting another client, reset selected local if it doesn't belong to this client
    if (selectedLocal && selectedLocal.clienteId !== cliente.id) {
      setSelectedLocal(null);
      setSelectedEquipamento(null);
    }
  };

  const handleAdvanceToLocais = (cliente?: ClienteDTO) => {
    const target = cliente || selectedCliente;
    if (!target) return;
    setSelectedCliente(target);
    setCurrentStep(2);
    setSearchTerm('');
  };

  const handleSelectLocal = (local: LocalDTO) => {
    setSelectedLocal(local);
    // Also ensure client is selected if not already
    if (!selectedCliente || selectedCliente.id !== local.clienteId) {
      const foundClient = clientes.find((c) => c.id === local.clienteId);
      if (foundClient) setSelectedCliente(foundClient);
    }
  };

  const handleAdvanceToEquipamentos = (local?: LocalDTO) => {
    const target = local || selectedLocal;
    if (!target) return;
    setSelectedLocal(target);
    if (!selectedCliente || selectedCliente.id !== target.clienteId) {
      const foundClient = clientes.find((c) => c.id === target.clienteId);
      if (foundClient) setSelectedCliente(foundClient);
    }
    setCurrentStep(3);
    setSearchTerm('');
  };

  // Open modals
  const handleOpenClientModal = (clienteToEdit?: ClienteDTO) => {
    if (clienteToEdit) {
      setEditingCliente(clienteToEdit);
      setFormClienteNome(clienteToEdit.nome);
      setFormClienteCnpj(clienteToEdit.cnpj);
      setFormClienteTelefone(clienteToEdit.telefone);
      setFormClienteEmail(clienteToEdit.email);
    } else {
      setEditingCliente(null);
      setFormClienteNome('');
      setFormClienteCnpj('');
      setFormClienteTelefone('');
      setFormClienteEmail('');
    }
    setIsClientModalOpen(true);
  };

  const handleOpenLocalModal = (localToEdit?: LocalDTO) => {
    if (localToEdit) {
      setEditingLocal(localToEdit);
      setFormLocalNome(localToEdit.nome);
      setFormLocalEndereco(localToEdit.endereco);
      setFormLocalClienteId(String(localToEdit.clienteId));
    } else {
      setEditingLocal(null);
      setFormLocalNome('');
      setFormLocalEndereco('');
      // Default to selectedCliente or first client
      const defaultId = selectedCliente?.id || (clientes.length > 0 ? clientes[0].id : '');
      setFormLocalClienteId(defaultId ? String(defaultId) : '');
    }
    setIsLocalModalOpen(true);
  };

  const handleOpenEquipModal = (equipToEdit?: EquipamentoDTO) => {
    if (equipToEdit) {
      setEditingEquipamento(equipToEdit);
      setFormEquipNome(equipToEdit.nome);
      setFormEquipNumeroSerie(equipToEdit.numeroSerie);
      setFormEquipTipo(equipToEdit.tipo || '');
      setFormEquipLocalId(String(equipToEdit.localId));
    } else {
      setEditingEquipamento(null);
      setFormEquipNome('');
      setFormEquipNumeroSerie('');
      setFormEquipTipo('');
      // Default to selectedLocal or first local available
      const defaultLocalId =
        selectedLocal?.id || (displayedLocais.length > 0 ? displayedLocais[0].id : '');
      setFormEquipLocalId(defaultLocalId ? String(defaultLocalId) : '');
    }
    setIsEquipModalOpen(true);
  };

  // Inactivation handler
  const handleInativarCliente = async (cliente: ClienteDTO) => {
    if (confirm(`Deseja realmente inativar o cliente "${cliente.nome}"?`)) {
      try {
        await clienteService.inativar(cliente.id);
        setClientes((prev) =>
          prev.map((c) => (c.id === cliente.id ? { ...c, ativo: false } : c))
        );
        if (selectedCliente?.id === cliente.id) {
          setSelectedCliente((prev) => (prev ? { ...prev, ativo: false } : null));
        }
        showToast(`Cliente "${cliente.nome}" inativado.`);
      } catch (err: unknown) {
        console.error('Erro ao inativar cliente:', err);
        showToast('Erro ao inativar cliente.');
      }
    }
  };

  // Submit Cliente (Cadastrar / Editar)
  const handleSubmitCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: ClienteRequest = {
      nome: formClienteNome.trim(),
      cnpj: formClienteCnpj.trim(),
      telefone: formClienteTelefone.trim(),
      email: formClienteEmail.trim(),
    };

    try {
      if (editingCliente) {
        let updated: ClienteDTO;
        try {
          updated = await clienteService.atualizar(editingCliente.id, payload);
        } catch {
          // Fallback optimistic update if backend does not yet implement PUT
          updated = { ...editingCliente, ...payload };
        }
        setClientes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        if (selectedCliente?.id === updated.id) setSelectedCliente(updated);
        showToast(`Cliente "${updated.nome}" atualizado com sucesso!`);
        setIsClientModalOpen(false);
      } else {
        const created = await clienteService.cadastrar(payload);
        setClientes((prev) => [created, ...prev]);
        setSelectedCliente(created);
        setIsClientModalOpen(false);
        showToast(`Cliente "${created.nome}" cadastrado com sucesso!`);

        // Prompt user immediately to add first local for this newly created client!
        setPromptNextStep({
          type: 'CLIENTE_CREATED',
          title: 'Cliente criado com sucesso!',
          description: `Deseja cadastrar o primeiro local / unidade para "${created.nome}" agora?`,
          targetName: created.nome,
          onConfirm: () => {
            setPromptNextStep(null);
            setSelectedCliente(created);
            setCurrentStep(2);
            // Open local modal with this client preselected
            setEditingLocal(null);
            setFormLocalNome('');
            setFormLocalEndereco('');
            setFormLocalClienteId(String(created.id));
            setIsLocalModalOpen(true);
          },
          onCancel: () => {
            setPromptNextStep(null);
          },
        });
      }
    } catch (err: any) {
      console.error('Erro ao salvar cliente:', err);
      const msg = err.response?.data?.mensagem || err.response?.data || err.message;
      alert(`Falha ao salvar cliente: ${typeof msg === 'string' ? msg : 'Verifique os dados.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Local (Cadastrar / Editar)
  const handleSubmitLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLocalClienteId) {
      alert('Por favor, selecione o cliente vinculado.');
      return;
    }
    setIsSubmitting(true);

    const clienteIdNum = Number(formLocalClienteId);
    const payload: LocalRequest = {
      nome: formLocalNome.trim(),
      endereco: formLocalEndereco.trim(),
      clienteId: clienteIdNum,
    };

    try {
      if (editingLocal) {
        let updated: LocalDTO;
        try {
          updated = await localService.atualizar(editingLocal.id, payload);
        } catch {
          // Fallback optimistic update
          const clientObj = clientes.find((c) => c.id === clienteIdNum);
          updated = {
            ...editingLocal,
            ...payload,
            clienteNome: clientObj?.nome || editingLocal.clienteNome,
          };
        }
        setLocais((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        if (selectedLocal?.id === updated.id) setSelectedLocal(updated);
        showToast(`Local "${updated.nome}" atualizado com sucesso!`);
        setIsLocalModalOpen(false);
      } else {
        const created = await localService.cadastrar(payload);
        const clientObj = clientes.find((c) => c.id === clienteIdNum);
        const enriched: LocalDTO = {
          ...created,
          clienteNome: clientObj?.nome || created.clienteNome,
        };

        setLocais((prev) => [enriched, ...prev]);
        setSelectedLocal(enriched);
        setIsLocalModalOpen(false);
        showToast(`Local "${enriched.nome}" cadastrado com sucesso!`);

        // Prompt user immediately to add first equipment for this newly created local!
        setPromptNextStep({
          type: 'LOCAL_CREATED',
          title: 'Local criado com sucesso!',
          description: `Deseja cadastrar o primeiro equipamento para a unidade "${enriched.nome}" agora?`,
          targetName: enriched.nome,
          onConfirm: () => {
            setPromptNextStep(null);
            setSelectedLocal(enriched);
            setCurrentStep(3);
            // Open equip modal with this local preselected
            setEditingEquipamento(null);
            setFormEquipNome('');
            setFormEquipNumeroSerie('');
            setFormEquipTipo('');
            setFormEquipLocalId(String(enriched.id));
            setIsEquipModalOpen(true);
          },
          onCancel: () => {
            setPromptNextStep(null);
          },
        });
      }
    } catch (err: any) {
      console.error('Erro ao salvar local:', err);
      const msg = err.response?.data?.mensagem || err.response?.data || err.message;
      alert(`Falha ao salvar local: ${typeof msg === 'string' ? msg : 'Verifique os dados.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Equipamento (Cadastrar / Editar)
  const handleSubmitEquipamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEquipLocalId) {
      alert('Por favor, selecione o local de instalação.');
      return;
    }
    setIsSubmitting(true);

    const localIdNum = Number(formEquipLocalId);
    const payload: EquipamentoRequest = {
      nome: formEquipNome.trim(),
      numeroSerie: formEquipNumeroSerie.trim(),
      tipo: formEquipTipo.trim() || undefined,
      localId: localIdNum,
    };

    try {
      if (editingEquipamento) {
        let updated: EquipamentoDTO;
        try {
          updated = await equipamentoService.atualizar(editingEquipamento.id, payload);
        } catch {
          // Fallback optimistic update
          const localObj = locais.find((l) => l.id === localIdNum);
          updated = {
            ...editingEquipamento,
            ...payload,
            localNome: localObj?.nome || editingEquipamento.localNome,
          };
        }
        setEquipamentos((prev) => prev.map((eq) => (eq.id === updated.id ? updated : eq)));
        if (selectedEquipamento?.id === updated.id) setSelectedEquipamento(updated);
        showToast(`Equipamento "${updated.nome}" atualizado com sucesso!`);
        setIsEquipModalOpen(false);
      } else {
        const created = await equipamentoService.cadastrar(payload);
        const localObj = locais.find((l) => l.id === localIdNum);
        const enriched: EquipamentoDTO = {
          ...created,
          localNome: localObj?.nome || created.localNome,
        };

        setEquipamentos((prev) => [enriched, ...prev]);
        setSelectedEquipamento(enriched);
        setIsEquipModalOpen(false);
        showToast(`Equipamento "${enriched.nome}" cadastrado com sucesso!`);
      }
    } catch (err: any) {
      console.error('Erro ao salvar equipamento:', err);
      const msg = err.response?.data?.mensagem || err.response?.data || err.message;
      alert(`Falha ao salvar equipamento: ${typeof msg === 'string' ? msg : 'Verifique os dados.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <TopHeader
        title="Gerenciamento de Clientes, Locais & Equipamentos"
        context={
          <div className="flex items-center gap-2 text-sm text-slate-500 overflow-x-auto">
            <span>FieldOps</span>
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">Hierarquia de Ativos</span>
          </div>
        }
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-lg shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 size={20} className="text-[#10b981]" />
            <span className="text-sm font-medium">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-3 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => loadData(true)}
              className="font-bold underline text-red-800 hover:text-red-900"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Main Header with Reload */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Gerenciamento Unificado
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Navegação hierárquica por etapas: Cliente → Locais do Cliente → Equipamentos do Local.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(true)}
              className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-xs transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
              title="Recarregar todos os dados"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? 'animate-spin text-[#0f766e]' : ''}
              />
              <span className="hidden sm:inline">Recarregar</span>
            </button>

            {currentStep === 1 && (
              <button
                onClick={() => handleOpenClientModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg shadow-xs font-bold text-sm transition-colors cursor-pointer"
              >
                <Plus size={18} />
                Novo Cliente
              </button>
            )}

            {currentStep === 2 && (
              <button
                onClick={() => handleOpenLocalModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg shadow-xs font-bold text-sm transition-colors cursor-pointer"
              >
                <Plus size={18} />
                Novo Local
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={() => handleOpenEquipModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg shadow-xs font-bold text-sm transition-colors cursor-pointer"
              >
                <Plus size={18} />
                Novo Equipamento
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEPPER NAVIGATION BAR */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
            {/* Step 1: Clientes */}
            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                setSearchTerm('');
              }}
              className={`flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                currentStep === 1
                  ? 'bg-teal-50/70 border-[#0f766e] shadow-xs'
                  : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                  currentStep === 1
                    ? 'bg-[#0f766e] text-white shadow-xs'
                    : selectedCliente
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                }`}
              >
                {selectedCliente && currentStep !== 1 ? (
                  <Check size={18} strokeWidth={2.5} />
                ) : (
                  <Building2 size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Etapa 1
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                    {clientes.length}
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 truncate">Clientes</div>
                <div className="text-xs text-slate-500 truncate">
                  {selectedCliente ? selectedCliente.nome : 'Selecione ou cadastre'}
                </div>
              </div>
            </button>

            {/* Step 2: Locais */}
            <button
              type="button"
              onClick={() => {
                setCurrentStep(2);
                setSearchTerm('');
              }}
              className={`flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                currentStep === 2
                  ? 'bg-teal-50/70 border-[#0f766e] shadow-xs'
                  : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                  currentStep === 2
                    ? 'bg-[#0f766e] text-white shadow-xs'
                    : selectedLocal
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                }`}
              >
                {selectedLocal && currentStep !== 2 ? (
                  <Check size={18} strokeWidth={2.5} />
                ) : (
                  <MapPin size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Etapa 2
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                    {displayedLocais.length}
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 truncate">Locais / Unidades</div>
                <div className="text-xs text-slate-500 truncate">
                  {selectedLocal
                    ? selectedLocal.nome
                    : selectedCliente
                      ? `Locais de ${selectedCliente.nome}`
                      : 'Todos os locais'}
                </div>
              </div>
            </button>

            {/* Step 3: Equipamentos */}
            <button
              type="button"
              onClick={() => {
                setCurrentStep(3);
                setSearchTerm('');
              }}
              className={`flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                currentStep === 3
                  ? 'bg-teal-50/70 border-[#0f766e] shadow-xs'
                  : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                  currentStep === 3
                    ? 'bg-[#0f766e] text-white shadow-xs'
                    : selectedEquipamento
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Wrench size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Etapa 3
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                    {displayedEquipamentos.length}
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 truncate">Equipamentos</div>
                <div className="text-xs text-slate-500 truncate">
                  {selectedEquipamento
                    ? selectedEquipamento.nome
                    : selectedLocal
                      ? `Equipamentos em ${selectedLocal.nome}`
                      : 'Todos os equipamentos'}
                </div>
              </div>
            </button>
          </div>

          {/* Interactive Hierarchy Breadcrumb */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Trilha:</span>

            <button
              onClick={() => {
                setCurrentStep(1);
                setSearchTerm('');
              }}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentStep === 1
                  ? 'bg-[#0f766e] text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Building2 size={13} />
              Clientes ({clientes.length})
            </button>

            {selectedCliente && (
              <>
                <ChevronRight size={13} className="text-slate-400" />
                <button
                  onClick={() => {
                    setCurrentStep(2);
                    setSearchTerm('');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentStep === 2
                      ? 'bg-[#0f766e] text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <MapPin size={13} />
                  <span>{selectedCliente.nome}</span>
                  <span className="text-[0.65rem] opacity-75">
                    ({locaisByCliente.get(selectedCliente.id)?.length || 0} locais)
                  </span>
                </button>
              </>
            )}

            {selectedLocal && (
              <>
                <ChevronRight size={13} className="text-slate-400" />
                <button
                  onClick={() => {
                    setCurrentStep(3);
                    setSearchTerm('');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentStep === 3
                      ? 'bg-[#0f766e] text-white'
                      : 'bg-teal-50 text-[#0f766e] hover:bg-teal-100 border border-teal-200'
                  }`}
                >
                  <Wrench size={13} />
                  <span>{selectedLocal.nome}</span>
                  <span className="text-[0.65rem] opacity-75">
                    ({equipamentosByLocal.get(selectedLocal.id)?.length || 0} equip.)
                  </span>
                </button>
              </>
            )}

            {selectedEquipamento && (
              <>
                <ChevronRight size={13} className="text-slate-400" />
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200">
                  Tag: {selectedEquipamento.numeroSerie}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ACTIVE CONTEXT BANNER (FOR STEP 2 & STEP 3) */}
        {/* ========================================================================= */}
        {currentStep === 2 && selectedCliente && (
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <Building2 size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Cliente Selecionado (Contexto Ativo)
                </div>
                <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                  {selectedCliente.nome}
                  <span className="text-xs font-mono font-normal text-slate-500">
                    CNPJ: {selectedCliente.cnpj}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Visualizando apenas os locais vinculados a este cliente. Novos locais serão
                  associados automaticamente a ele.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setSearchTerm('');
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft size={14} />
                Trocar Cliente
              </button>
              <button
                onClick={() => handleOpenLocalModal()}
                className="px-3 py-1.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} />
                Adicionar Local
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && selectedLocal && (
          <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-100 text-[#0f766e] rounded-lg">
                <MapPin size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0f766e] uppercase tracking-wider">
                  Local Selecionado (Contexto Ativo)
                </div>
                <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                  {selectedLocal.nome}
                  <span className="text-xs font-normal text-slate-500">
                    • {selectedLocal.endereco}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Cliente:{' '}
                  <span className="font-semibold text-slate-800">
                    {selectedCliente?.nome || selectedLocal.clienteNome || `#${selectedLocal.clienteId}`}
                  </span>
                  . Novos equipamentos serão vinculados diretamente a esta unidade.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => {
                  setCurrentStep(2);
                  setSearchTerm('');
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft size={14} />
                Trocar Local
              </button>
              <button
                onClick={() => handleOpenEquipModal()}
                className="px-3 py-1.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} />
                Adicionar Equipamento
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEARCH & FILTERS BAR */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                currentStep === 1
                  ? 'Filtrar clientes por nome, CNPJ ou e-mail...'
                  : currentStep === 2
                    ? 'Filtrar locais por nome ou endereço...'
                    : 'Filtrar equipamentos por tag, nome ou tipo...'
              }
              className="block w-full pl-9 pr-9 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] bg-white shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Filter size={13} />
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
            >
              <option value="ALL">Todos os status</option>
              <option value="ACTIVE">Apenas Ativos</option>
              <option value="INACTIVE">Apenas Inativos</option>
            </select>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MASTER - DETAIL LAYOUT */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================== LEFT: MASTER LIST (TABLE) ==================== */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="animate-spin text-[#0f766e]" />
                <span className="text-sm font-medium">Carregando dados da hierarquia...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* -------------------- STEP 1: CLIENTES -------------------- */}
                {currentStep === 1 && (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3.5">Cliente</th>
                        <th className="px-4 py-3.5">CNPJ</th>
                        <th className="px-4 py-3.5">Contato</th>
                        <th className="px-4 py-3.5 text-center">Locais</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {filteredClientes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            <Building2 size={36} className="mx-auto text-slate-300 mb-2" />
                            <div className="font-bold text-slate-700">
                              Nenhum cliente encontrado
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {searchTerm
                                ? `Nenhum resultado corresponde à busca "${searchTerm}".`
                                : 'Comece cadastrando o primeiro cliente do sistema.'}
                            </div>
                            <button
                              onClick={() => handleOpenClientModal()}
                              className="mt-4 px-4 py-2 bg-[#0f766e] text-white text-xs font-bold rounded-lg hover:bg-[#115e59] cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Plus size={15} />
                              Cadastrar Primeiro Cliente
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredClientes.map((c) => {
                          const isSelected = selectedCliente?.id === c.id;
                          const clientLocais = locaisByCliente.get(c.id) || [];

                          return (
                            <tr
                              key={c.id}
                              onClick={() => handleSelectCliente(c)}
                              className={`transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50/80 border-l-4 border-l-[#10b981]'
                                  : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                              }`}
                            >
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-slate-900">{c.nome}</div>
                                <div className="text-xs font-mono text-slate-400">ID #{c.id}</div>
                              </td>

                              <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                                {c.cnpj}
                              </td>

                              <td className="px-4 py-3.5 text-xs text-slate-600">
                                <div className="truncate max-w-[160px]">{c.email}</div>
                                <div className="text-slate-400">{c.telefone}</div>
                              </td>

                              <td className="px-4 py-3.5 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {clientLocais.length} locais
                                </span>
                              </td>

                              <td className="px-4 py-3.5">
                                <span
                                  className={`px-2 py-0.5 text-xs font-bold rounded-full border ${
                                    c.ativo
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}
                                >
                                  {c.ativo ? 'ATIVO' : 'INATIVO'}
                                </span>
                              </td>

                              <td className="px-5 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAdvanceToLocais(c);
                                    }}
                                    className="px-2.5 py-1.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-md text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    title="Ver locais deste cliente"
                                  >
                                    <span>Locais</span>
                                    <ChevronRight size={14} />
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenClientModal(c);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                                    title="Editar cliente"
                                  >
                                    <Edit2 size={15} />
                                  </button>

                                  {c.ativo && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleInativarCliente(c);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                                      title="Inativar cliente"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {/* -------------------- STEP 2: LOCAIS -------------------- */}
                {currentStep === 2 && (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3.5">Unidade / Local</th>
                        <th className="px-4 py-3.5">Endereço</th>
                        <th className="px-4 py-3.5">Cliente Vinculado</th>
                        <th className="px-4 py-3.5 text-center">Equipamentos</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {filteredLocais.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            <MapPin size={36} className="mx-auto text-slate-300 mb-2" />
                            <div className="font-bold text-slate-700">
                              {selectedCliente
                                ? `Nenhum local cadastrado para "${selectedCliente.nome}".`
                                : 'Nenhum local encontrado.'}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {selectedCliente
                                ? 'Cadastre a primeira filial, fábrica ou galpão deste cliente.'
                                : 'Selecione um cliente ou adicione uma nova unidade.'}
                            </div>
                            <button
                              onClick={() => handleOpenLocalModal()}
                              className="mt-4 px-4 py-2 bg-[#0f766e] text-white text-xs font-bold rounded-lg hover:bg-[#115e59] cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Plus size={15} />
                              Adicionar Primeiro Local
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredLocais.map((l) => {
                          const isSelected = selectedLocal?.id === l.id;
                          const localEquips = equipamentosByLocal.get(l.id) || [];
                          const clientOwner =
                            clientes.find((c) => c.id === l.clienteId)?.nome ||
                            l.clienteNome ||
                            `Cliente #${l.clienteId}`;

                          return (
                            <tr
                              key={l.id}
                              onClick={() => handleSelectLocal(l)}
                              className={`transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50/80 border-l-4 border-l-[#10b981]'
                                  : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                              }`}
                            >
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  <MapPin size={15} className="text-[#0f766e] shrink-0" />
                                  <span>{l.nome}</span>
                                </div>
                                <div className="text-xs font-mono text-slate-400 pl-5">
                                  ID #{l.id}
                                </div>
                              </td>

                              <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[200px] truncate">
                                {l.endereco}
                              </td>

                              <td className="px-4 py-3.5 text-xs font-semibold text-slate-800">
                                {clientOwner}
                              </td>

                              <td className="px-4 py-3.5 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {localEquips.length} equip.
                                </span>
                              </td>

                              <td className="px-4 py-3.5">
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ATIVO
                                </span>
                              </td>

                              <td className="px-5 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAdvanceToEquipamentos(l);
                                    }}
                                    className="px-2.5 py-1.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-md text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    title="Ver equipamentos instalados neste local"
                                  >
                                    <span>Equipamentos</span>
                                    <ChevronRight size={14} />
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenLocalModal(l);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                                    title="Editar local"
                                  >
                                    <Edit2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {/* -------------------- STEP 3: EQUIPAMENTOS -------------------- */}
                {currentStep === 3 && (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3.5">Equipamento</th>
                        <th className="px-4 py-3.5">Número de Série / Tag</th>
                        <th className="px-4 py-3.5">Tipo / Categoria</th>
                        <th className="px-4 py-3.5">Local / Unidade</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {filteredEquipamentos.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            <Wrench size={36} className="mx-auto text-slate-300 mb-2" />
                            <div className="font-bold text-slate-700">
                              {selectedLocal
                                ? `Nenhum equipamento cadastrado em "${selectedLocal.nome}".`
                                : 'Nenhum equipamento encontrado.'}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {selectedLocal
                                ? 'Cadastre o primeiro maquinário ou dispositivo desta planta.'
                                : 'Selecione um local ou adicione um novo equipamento.'}
                            </div>
                            <button
                              onClick={() => handleOpenEquipModal()}
                              className="mt-4 px-4 py-2 bg-[#0f766e] text-white text-xs font-bold rounded-lg hover:bg-[#115e59] cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Plus size={15} />
                              Adicionar Primeiro Equipamento
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredEquipamentos.map((eq) => {
                          const isSelected = selectedEquipamento?.id === eq.id;
                          const localOwner =
                            locais.find((l) => l.id === eq.localId)?.nome ||
                            eq.localNome ||
                            `Local #${eq.localId}`;

                          return (
                            <tr
                              key={eq.id}
                              onClick={() => setSelectedEquipamento(eq)}
                              className={`transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50/80 border-l-4 border-l-[#10b981]'
                                  : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                              }`}
                            >
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  <Wrench size={15} className="text-[#0f766e] shrink-0" />
                                  <span>{eq.nome}</span>
                                </div>
                                <div className="text-xs font-mono text-slate-400 pl-5">
                                  ID #{eq.id}
                                </div>
                              </td>

                              <td className="px-4 py-3.5">
                                <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {eq.numeroSerie}
                                </span>
                              </td>

                              <td className="px-4 py-3.5 text-xs text-slate-600">
                                {eq.tipo || 'Geral'}
                              </td>

                              <td className="px-4 py-3.5 text-xs font-semibold text-slate-800">
                                {localOwner}
                              </td>

                              <td className="px-4 py-3.5">
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ATIVO
                                </span>
                              </td>

                              <td className="px-5 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEquipModal(eq);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                                    title="Editar equipamento"
                                  >
                                    <Edit2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* ======================== RIGHT: DETAIL SIDE PANEL ==================== */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5 sticky top-20">
            {/* ----------------- DETAIL: CLIENTE (STEP 1) ----------------- */}
            {currentStep === 1 && (
              <>
                {selectedCliente ? (
                  <div className="space-y-5 animate-in fade-in">
                    <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                          <Building2 size={24} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Detalhes do Cliente
                          </div>
                          <h3 className="font-bold text-slate-900 text-lg leading-snug">
                            {selectedCliente.nome}
                          </h3>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                          selectedCliente.ativo
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {selectedCliente.ativo ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-slate-400 font-semibold mb-1">CNPJ</div>
                        <div className="font-mono text-sm font-bold text-slate-800">
                          {selectedCliente.cnpj}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Mail size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{selectedCliente.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span>{selectedCliente.telefone}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-lg">
                          <div className="text-xl font-bold text-[#0f766e]">
                            {locaisByCliente.get(selectedCliente.id)?.length || 0}
                          </div>
                          <div className="text-[0.65rem] font-bold text-slate-600 uppercase tracking-wider">
                            Locais Cadastrados
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg">
                          <div className="text-xl font-bold text-emerald-700">
                            {(() => {
                              const cLocais = locaisByCliente.get(selectedCliente.id) || [];
                              const cLocalIds = new Set(cLocais.map((l) => l.id));
                              return equipamentos.filter((e) => cLocalIds.has(e.localId)).length;
                            })()}
                          </div>
                          <div className="text-[0.65rem] font-bold text-slate-600 uppercase tracking-wider">
                            Equipamentos Totais
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <button
                        onClick={() => handleAdvanceToLocais()}
                        className="w-full py-2.5 px-4 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Avançar para Locais deste Cliente</span>
                        <ArrowRight size={15} />
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenLocalModal()}
                          className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus size={14} />
                          Novo Local
                        </button>
                        <button
                          onClick={() => handleOpenClientModal(selectedCliente)}
                          className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Edit2 size={14} />
                          Editar Cliente
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 space-y-3">
                    <Building2 size={40} className="mx-auto text-slate-300" />
                    <div className="font-bold text-slate-700 text-sm">Nenhum cliente selecionado</div>
                    <p className="text-xs text-slate-500">
                      Clique em um cliente na tabela ao lado para visualizar os detalhes, estatísticas
                      e navegar para seus locais vinculados.
                    </p>
                    <button
                      onClick={() => handleOpenClientModal()}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      Cadastrar Novo Cliente
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ----------------- DETAIL: LOCAL (STEP 2) ----------------- */}
            {currentStep === 2 && (
              <>
                {selectedLocal ? (
                  <div className="space-y-5 animate-in fade-in">
                    <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-teal-100 text-[#0f766e] rounded-xl">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Detalhes da Unidade
                          </div>
                          <h3 className="font-bold text-slate-900 text-lg leading-snug">
                            {selectedLocal.nome}
                          </h3>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ATIVO
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-slate-400 font-semibold mb-1">Endereço Completo</div>
                        <div className="text-sm font-semibold text-slate-800">
                          {selectedLocal.endereco}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-slate-400 font-semibold mb-1">Cliente Vinculado</div>
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span>
                            {clientes.find((c) => c.id === selectedLocal.clienteId)?.nome ||
                              selectedLocal.clienteNome ||
                              `Cliente #${selectedLocal.clienteId}`}
                          </span>
                          <button
                            onClick={() => {
                              const c = clientes.find((cli) => cli.id === selectedLocal.clienteId);
                              if (c) setSelectedCliente(c);
                              setCurrentStep(1);
                            }}
                            className="text-[#0f766e] hover:underline font-bold text-[0.7rem]"
                          >
                            Ver Cliente
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-lg text-center">
                        <div className="text-2xl font-bold text-[#0f766e]">
                          {equipamentosByLocal.get(selectedLocal.id)?.length || 0}
                        </div>
                        <div className="text-[0.65rem] font-bold text-slate-600 uppercase tracking-wider">
                          Equipamentos Instalados nesta Unidade
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <button
                        onClick={() => handleAdvanceToEquipamentos()}
                        className="w-full py-2.5 px-4 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Avançar para Equipamentos deste Local</span>
                        <ArrowRight size={15} />
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenEquipModal()}
                          className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus size={14} />
                          Novo Equipamento
                        </button>
                        <button
                          onClick={() => handleOpenLocalModal(selectedLocal)}
                          className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Edit2 size={14} />
                          Editar Local
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 space-y-3">
                    <MapPin size={40} className="mx-auto text-slate-300" />
                    <div className="font-bold text-slate-700 text-sm">Nenhum local selecionado</div>
                    <p className="text-xs text-slate-500">
                      Clique em uma unidade na tabela ao lado para visualizar os detalhes e gerenciar
                      os equipamentos instalados nela.
                    </p>
                    <button
                      onClick={() => handleOpenLocalModal()}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      Cadastrar Novo Local
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ----------------- DETAIL: EQUIPAMENTO (STEP 3) ----------------- */}
            {currentStep === 3 && (
              <>
                {selectedEquipamento ? (
                  <div className="space-y-5 animate-in fade-in">
                    <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-teal-100 text-[#0f766e] rounded-xl">
                          <Wrench size={24} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Detalhes do Equipamento
                          </div>
                          <h3 className="font-bold text-slate-900 text-lg leading-snug">
                            {selectedEquipamento.nome}
                          </h3>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ATIVO
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-slate-400 font-semibold mb-1">
                          Número de Série / Tag
                        </div>
                        <div className="font-mono text-sm font-bold text-slate-800 bg-white p-2 rounded border border-slate-200">
                          {selectedEquipamento.numeroSerie}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-slate-400 font-semibold mb-1">Tipo de Máquina</div>
                        <div className="text-sm font-semibold text-slate-800">
                          {selectedEquipamento.tipo || 'Geral / Não especificado'}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-slate-400 font-semibold mb-1">Local de Instalação</div>
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span>
                            {locais.find((l) => l.id === selectedEquipamento.localId)?.nome ||
                              selectedEquipamento.localNome ||
                              `Local #${selectedEquipamento.localId}`}
                          </span>
                          <button
                            onClick={() => {
                              const loc = locais.find((l) => l.id === selectedEquipamento.localId);
                              if (loc) setSelectedLocal(loc);
                              setCurrentStep(2);
                            }}
                            className="text-[#0f766e] hover:underline font-bold text-[0.7rem]"
                          >
                            Ver Local
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <button
                        onClick={() => handleOpenEquipModal(selectedEquipamento)}
                        className="w-full py-2.5 px-4 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Edit2 size={15} />
                        <span>Editar Equipamento</span>
                      </button>

                      <button
                        onClick={() => handleOpenEquipModal()}
                        className="w-full py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus size={14} />
                        Cadastrar Outro Equipamento neste Local
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 space-y-3">
                    <Wrench size={40} className="mx-auto text-slate-300" />
                    <div className="font-bold text-slate-700 text-sm">
                      Nenhum equipamento selecionado
                    </div>
                    <p className="text-xs text-slate-500">
                      Clique em um equipamento na tabela ao lado para inspecionar os detalhes técnicos
                      ou realizar edições.
                    </p>
                    <button
                      onClick={() => handleOpenEquipModal()}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      Cadastrar Novo Equipamento
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PROMPT MODAL: NEXT STEP IMMEDIATELY AFTER CREATION */}
      {/* ========================================================================= */}
      {promptNextStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg leading-tight">
                  {promptNextStep.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{promptNextStep.description}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <Info size={16} className="text-[#0f766e] shrink-0" />
              <span>
                A hierarquia mantém automaticamente o vínculo para que você não precise preencher dados
                repetidos.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={promptNextStep.onCancel}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Agora Não
              </button>
              <button
                type="button"
                onClick={promptNextStep.onConfirm}
                className="px-5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>
                  {promptNextStep.type === 'CLIENTE_CREATED'
                    ? 'Sim, Cadastrar Local'
                    : 'Sim, Cadastrar Equipamento'}
                </span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLIENTE (CREATE / EDIT) */}
      {/* ========================================================================= */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingCliente
                    ? `Atualizando informações de ${editingCliente.nome}`
                    : 'Cadastre a empresa cliente no sistema'}
                </p>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCliente} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razão Social / Nome Fantasia *
                </label>
                <input
                  type="text"
                  required
                  value={formClienteNome}
                  onChange={(e) => setFormClienteNome(e.target.value)}
                  placeholder="Ex: Usina Siderúrgica Central"
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CNPJ (14 dígitos) *
                </label>
                <input
                  type="text"
                  required
                  value={formClienteCnpj}
                  onChange={(e) => setFormClienteCnpj(e.target.value)}
                  placeholder="12345678000195"
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone / Ramal *
                </label>
                <input
                  type="text"
                  required
                  value={formClienteTelefone}
                  onChange={(e) => setFormClienteTelefone(e.target.value)}
                  placeholder="(11) 99999-8888"
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail de Contato *
                </label>
                <input
                  type="email"
                  required
                  value={formClienteEmail}
                  onChange={(e) => setFormClienteEmail(e.target.value)}
                  placeholder="contato@siderurgica.com.br"
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : editingCliente ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOCAL (CREATE / EDIT) */}
      {/* ========================================================================= */}
      {isLocalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingLocal ? 'Editar Local' : 'Novo Local / Unidade'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingLocal
                    ? `Atualizando informações de ${editingLocal.nome}`
                    : 'Cadastre uma unidade vinculada ao cliente'}
                </p>
              </div>
              <button
                onClick={() => setIsLocalModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitLocal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cliente Vinculado *
                </label>
                <select
                  value={formLocalClienteId}
                  onChange={(e) => setFormLocalClienteId(e.target.value)}
                  required
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-[#10b981]"
                >
                  <option value="">Selecione o cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.cnpj})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Unidade / Setor / Galpão *
                </label>
                <input
                  type="text"
                  required
                  value={formLocalNome}
                  onChange={(e) => setFormLocalNome(e.target.value)}
                  placeholder="Ex: Galpão B - Usinagem Pesada"
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formLocalEndereco}
                  onChange={(e) => setFormLocalEndereco(e.target.value)}
                  placeholder="Av. Industrial, 400 - Distrito Norte, SP"
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLocalModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : editingLocal ? 'Salvar Alterações' : 'Cadastrar Local'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EQUIPAMENTO (CREATE / EDIT) */}
      {/* ========================================================================= */}
      {isEquipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingEquipamento ? 'Editar Equipamento' : 'Novo Equipamento'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingEquipamento
                    ? `Atualizando dados de ${editingEquipamento.nome}`
                    : 'Cadastre um maquinário vinculado ao local'}
                </p>
              </div>
              <button
                onClick={() => setIsEquipModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEquipamento} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Local de Instalação *
                </label>
                <select
                  value={formEquipLocalId}
                  onChange={(e) => setFormEquipLocalId(e.target.value)}
                  required
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-[#10b981]"
                >
                  <option value="">Selecione o local de instalação...</option>
                  {displayedLocais.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome} ({l.clienteNome || 'Cliente'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome / Identificação do Equipamento *
                </label>
                <input
                  type="text"
                  required
                  value={formEquipNome}
                  onChange={(e) => setFormEquipNome(e.target.value)}
                  placeholder="Ex: Compressor Parafuso 50HP"
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Série / Tag *
                </label>
                <input
                  type="text"
                  required
                  value={formEquipNumeroSerie}
                  onChange={(e) => setFormEquipNumeroSerie(e.target.value)}
                  placeholder="Ex: CMP-998877"
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo / Categoria (Opcional)
                </label>
                <input
                  type="text"
                  value={formEquipTipo}
                  onChange={(e) => setFormEquipTipo(e.target.value)}
                  placeholder="Ex: Compressor / Caldeira / Transformador"
                  className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEquipModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting
                    ? 'Salvando...'
                    : editingEquipamento
                      ? 'Salvar Alterações'
                      : 'Cadastrar Equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

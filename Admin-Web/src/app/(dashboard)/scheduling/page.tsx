'use client';

import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { 
  Calendar, 
  Building2, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  MapPin, 
  User, 
  Wrench, 
  FileText,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  clienteService, 
  localService, 
  equipamentoService, 
  usuarioService, 
  inspecaoService,
  ClienteDTO,
  LocalDTO,
  EquipamentoDTO,
  UsuarioDTO
} from '@/lib/api/services';

export default function ScheduleInspectionPage() {
  const router = useRouter();

  // Data Sources from Java API
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [locais, setLocais] = useState<LocalDTO[]>([]);
  const [equipamentos, setEquipamentos] = useState<EquipamentoDTO[]>([]);
  const [tecnicos, setTecnicos] = useState<UsuarioDTO[]>([]);

  // Form State
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [selectedLocalId, setSelectedLocalId] = useState<string>('');
  const [selectedEquipamentoId, setSelectedEquipamentoId] = useState<string>('');
  const [selectedTecnicoId, setSelectedTecnicoId] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [dataAgendada, setDataAgendada] = useState<string>('');
  const [prioridade, setPrioridade] = useState<string>('Média');
  const [observacoes, setObservacoes] = useState<string>('');

  // UI State
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingLocais, setIsLoadingLocais] = useState(false);
  const [isLoadingEquipamentos, setIsLoadingEquipamentos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load initial clients & technicians
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      setIsLoadingInitial(true);
      try {
        const [clientesData, usuariosData] = await Promise.allSettled([
          clienteService.listar(),
          usuarioService.listarTodos(),
        ]);

        if (isMounted) {
          if (clientesData.status === 'fulfilled') {
            setClientes(clientesData.value);
          }
          if (usuariosData.status === 'fulfilled') {
            // Filter technicians if possible or take all
            const tecs = usuariosData.value.filter((u) => u.perfil === 'TECNICO');
            setTecnicos(tecs.length > 0 ? tecs : usuariosData.value);
          }
        }
      } catch (err) {
        console.error('Error loading initial scheduling data:', err);
      } finally {
        if (isMounted) setIsLoadingInitial(false);
      }
    };

    loadInitialData();

    // Default scheduled date to tomorrow at 09:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setDataAgendada(tomorrow.toISOString().slice(0, 16));

    return () => {
      isMounted = false;
    };
  }, []);

  // When Client changes, cascade fetch Locais
  const handleClienteChange = async (clienteIdStr: string) => {
    setSelectedClienteId(clienteIdStr);
    setSelectedLocalId('');
    setSelectedEquipamentoId('');
    setLocais([]);
    setEquipamentos([]);

    if (!clienteIdStr) return;

    setIsLoadingLocais(true);
    try {
      const locaisData = await localService.listarPorCliente(Number(clienteIdStr));
      setLocais(locaisData);
    } catch (err) {
      console.error('Error loading locais:', err);
    } finally {
      setIsLoadingLocais(false);
    }
  };

  // When Local changes, cascade fetch Equipamentos
  const handleLocalChange = async (localIdStr: string) => {
    setSelectedLocalId(localIdStr);
    setSelectedEquipamentoId('');
    setEquipamentos([]);

    if (!localIdStr) return;

    setIsLoadingEquipamentos(true);
    try {
      const equipsData = await equipamentoService.listarPorLocal(Number(localIdStr));
      setEquipamentos(equipsData);
    } catch (err) {
      console.error('Error loading equipamentos:', err);
    } finally {
      setIsLoadingEquipamentos(false);
    }
  };

  // Handle Form Submission -> POST /api/v1/inspecoes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!descricao.trim()) {
      setErrorMessage('Por favor, informe a descrição ou título da inspeção.');
      return;
    }
    if (!dataAgendada) {
      setErrorMessage('Por favor, defina a data e hora prevista para a inspeção.');
      return;
    }
    if (!selectedEquipamentoId) {
      setErrorMessage('Por favor, selecione um equipamento vinculado ao local.');
      return;
    }
    if (!selectedTecnicoId) {
      setErrorMessage('Por favor, selecione o técnico responsável.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Backend expects LocalDateTime formatted as "YYYY-MM-DDTHH:mm:ss"
      let formattedDate = dataAgendada;
      if (formattedDate.length === 16) {
        formattedDate = `${formattedDate}:00`;
      }

      await inspecaoService.criar({
        descricao: descricao.trim(),
        dataAgendada: formattedDate,
        observacoes: observacoes ? `[Prioridade: ${prioridade}] ${observacoes.trim()}` : `[Prioridade: ${prioridade}]`,
        equipamentoId: Number(selectedEquipamentoId),
        usuarioId: Number(selectedTecnicoId),
      });

      setSuccessMessage('Inspeção agendada e transmitida com sucesso para o backend!');
      setTimeout(() => {
        router.push('/inspections');
      }, 1500);
    } catch (err: any) {
      console.error('Error creating inspection:', err);
      const backendErr = err.response?.data?.mensagem || err.response?.data?.message || err.message;
      setErrorMessage(
        backendErr 
          ? `Falha ao agendar inspeção: ${backendErr}` 
          : 'Ocorreu um erro ao comunicar com a API Java. Verifique os dados e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <TopHeader 
        title="Agendar Inspeção"
        context={
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">FieldOps Desktop</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800">Agendar Inspeção Técnica</span>
          </div>
        }
      />
      
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1 flex items-center gap-3">
            <Calendar className="text-[#0f766e]" size={30} />
            Agendar Nova Inspeção
          </h1>
          <p className="text-slate-500 text-sm">
            Preencha os detalhes operacionais abaixo. O formulário carrega clientes, locais, maquinários e técnicos diretamente da API Java.
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-700 animate-in fade-in">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-sm text-emerald-800 animate-in fade-in">
            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{successMessage}</p>
              <p className="text-xs text-emerald-700 mt-0.5">Redirecionando para a lista de inspeções...</p>
            </div>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* Left Panel: Detalhes da Atribuição e Localização */}
            <div className="p-8 lg:border-r border-slate-200 space-y-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                <Building2 size={18} className="text-[#0f766e]" />
                1. Localização & Equipamento
              </h2>
              
              <div className="space-y-5">
                {/* Cliente */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Cliente / Contratante <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={selectedClienteId}
                    onChange={(e) => handleClienteChange(e.target.value)}
                    required
                    className="block w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981] bg-white transition-all"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.cnpj ? `(CNPJ: ${c.cnpj})` : ''}
                      </option>
                    ))}
                  </select>
                  {clientes.length === 0 && !isLoadingInitial && (
                    <p className="mt-1 text-xs text-amber-600">
                      Nenhum cliente cadastrado. Cadastre clientes na aba <Link href="/settings" className="underline font-bold">Master Data</Link>.
                    </p>
                  )}
                </div>

                {/* Local Instalação */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center justify-between">
                    <span>Unidade / Local Operacional <span className="text-red-500">*</span></span>
                    {isLoadingLocais && <Loader2 size={12} className="animate-spin text-[#0f766e]" />}
                  </label>
                  <select 
                    value={selectedLocalId}
                    onChange={(e) => handleLocalChange(e.target.value)}
                    disabled={!selectedClienteId || isLoadingLocais}
                    required
                    className="block w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981] bg-white disabled:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    <option value="">
                      {!selectedClienteId ? 'Selecione o cliente primeiro...' : locais.length === 0 ? 'Nenhum local cadastrado para este cliente' : 'Selecione o local...'}
                    </option>
                    {locais.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nome} - {loc.endereco}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Equipamento */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center justify-between">
                    <span>Equipamento / Ativo <span className="text-red-500">*</span></span>
                    {isLoadingEquipamentos && <Loader2 size={12} className="animate-spin text-[#0f766e]" />}
                  </label>
                  <select 
                    value={selectedEquipamentoId}
                    onChange={(e) => setSelectedEquipamentoId(e.target.value)}
                    disabled={!selectedLocalId || isLoadingEquipamentos}
                    required
                    className="block w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981] bg-white disabled:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    <option value="">
                      {!selectedLocalId ? 'Selecione o local primeiro...' : equipamentos.length === 0 ? 'Nenhum equipamento cadastrado neste local' : 'Selecione o equipamento...'}
                    </option>
                    {equipamentos.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.nome} {eq.numeroSerie ? `(S/N: ${eq.numeroSerie})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Info Card */}
                <div className="p-3.5 bg-teal-50/60 border border-teal-200/70 rounded-lg text-xs text-teal-900 flex items-start gap-2.5">
                  <MapPin size={16} className="text-[#0f766e] flex-shrink-0 mt-0.5" />
                  <span>
                    A vinculação em cascata (Cliente $\rightarrow$ Unidade $\rightarrow$ Equipamento) assegura conformidade no histórico de manutenção de cada ativo.
                  </span>
                </div>
              </div>
            </div>

            {/* Right Panel: Agendamento, Responsável & Instruções */}
            <div className="p-8 space-y-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                <Clock size={18} className="text-[#0f766e]" />
                2. Detalhes da Ordem de Serviço
              </h2>
              
              <div className="space-y-5">
                {/* Título / Descrição */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Título / Descrição da Inspeção <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    required
                    placeholder="Ex: Inspeção Preventiva Trimestral - Compressor 50HP"
                    className="block w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-all"
                  />
                </div>

                {/* Data Prevista */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Data e Hora Prevista <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="datetime-local" 
                    value={dataAgendada}
                    onChange={(e) => setDataAgendada(e.target.value)}
                    required
                    className="block w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981] bg-white transition-all"
                  />
                </div>

                {/* Técnico Responsável */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Técnico Responsável <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={selectedTecnicoId}
                    onChange={(e) => setSelectedTecnicoId(e.target.value)}
                    required
                    className="block w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981] bg-white transition-all"
                  >
                    <option value="">Atribuir a um técnico...</option>
                    {tecnicos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prioridade */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Prioridade da Execução
                  </label>
                  <div className="grid grid-cols-4 border border-slate-300 rounded-lg overflow-hidden bg-slate-50 text-xs font-semibold">
                    {['Baixa', 'Média', 'Alta', 'Crítica'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPrioridade(p)}
                        className={`py-2.5 text-center transition-colors cursor-pointer border-r last:border-r-0 border-slate-200 ${
                          prioridade === p 
                            ? 'bg-[#0f766e] text-white font-bold' 
                            : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instruções Adicionais */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Observações e Instruções para o Técnico
                  </label>
                  <textarea 
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Instruções de segurança (EPIs, chave de acesso, contatos no local, etc.)"
                    className="block w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] resize-none transition-all"
                  ></textarea>
                </div>
              </div>
            </div>

          </div>

          {/* Action Bar */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <Link 
              href="/inspections" 
              className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg shadow-xs hover:bg-slate-100 font-semibold text-sm transition-colors"
            >
              Cancelar
            </Link>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg shadow-sm font-bold text-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Transmitindo para a API...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Agendar Inspeção</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  Layers, 
  ListChecks, 
  ChevronRight, 
  X, 
  Check, 
  Sparkles, 
  Download, 
  MoreVertical, 
  Grid, 
  List,
  AlertTriangle,
  FileCheck,
  ToggleLeft,
  ToggleRight,
  HelpCircle
} from 'lucide-react';
import { Template, TemplateSection, TemplateItem, ResponseType, TemplateStatus } from '@/types';

// Mock Initial Templates Data
const INITIAL_TEMPLATES: (Template & { description: string; category: string })[] = [
  {
    id: 'TMP-001',
    title: 'Inspeção Preventiva de Compressores Industriais',
    description: 'Checklist padrão para verificação mecânica, elétrica e testes de pressão em compressores parafuso e pistão.',
    category: 'Mecânica & Fluidos',
    status: 'PUBLICADO',
    version: 3,
    createdAt: '2026-06-15T10:00:00Z',
    updatedAt: '2026-08-20T14:30:00Z',
    publishedAt: '2026-08-20T15:00:00Z',
    publishedBy: 'Carlos Silva (Supervisor)',
    sections: [
      {
        id: 'SEC-1',
        title: '1. Verificação Visual e Estrutural',
        order: 1,
        items: [
          {
            id: 'ITM-101',
            label: 'Integridade da carcaça e fixação dos amortecedores',
            responseType: 'BOOLEAN',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: true,
            order: 1
          },
          {
            id: 'ITM-102',
            label: 'Sinais de vazamento de óleo no bloco compressor',
            responseType: 'BOOLEAN',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: true,
            order: 2
          },
          {
            id: 'ITM-103',
            label: 'Nível e coloração do óleo lubrificante',
            responseType: 'SINGLE_SELECT',
            options: [
              { id: 'OPT-1', label: 'Normal (Claro / Nível OK)', order: 1 },
              { id: 'OPT-2', label: 'Baixo (Requer complemento)', order: 2 },
              { id: 'OPT-3', label: 'Contaminado / Escurecido (Requer troca)', order: 3 }
            ],
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: true,
            order: 3
          }
        ]
      },
      {
        id: 'SEC-2',
        title: '2. Parâmetros Operacionais e Medições',
        order: 2,
        items: [
          {
            id: 'ITM-201',
            label: 'Pressão de Trabalho do Reservatório (bar)',
            responseType: 'NUMERIC',
            required: true,
            allowObservation: false,
            requireEvidenceOnNonConformity: false,
            order: 1
          },
          {
            id: 'ITM-202',
            label: 'Temperatura de Descarga (°C)',
            responseType: 'NUMERIC',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: true,
            order: 2
          },
          {
            id: 'ITM-203',
            label: 'Corrente dos Motores Elétricos - Fase R/S/T (A)',
            responseType: 'TEXT',
            required: false,
            allowObservation: true,
            requireEvidenceOnNonConformity: false,
            order: 3
          }
        ]
      },
      {
        id: 'SEC-3',
        title: '3. Dispositivos de Segurança e Teste de Alívio',
        order: 3,
        items: [
          {
            id: 'ITM-301',
            label: 'Válvula de segurança calibrada com lacre intacto',
            responseType: 'BOOLEAN',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: true,
            order: 1
          },
          {
            id: 'ITM-302',
            label: 'Botão de parada de emergência operacional',
            responseType: 'BOOLEAN',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: true,
            order: 2
          }
        ]
      }
    ]
  },
  {
    id: 'TMP-002',
    title: 'Auditoria de Conformidade NR-10 e Painéis Elétricos',
    description: 'Roteiro de inspeção de segurança em quadros de distribuição, aterramento e sinalização.',
    category: 'Elétrica & NR-10',
    status: 'PUBLICADO',
    version: 2,
    createdAt: '2026-07-01T09:15:00Z',
    updatedAt: '2026-08-15T11:20:00Z',
    publishedAt: '2026-08-15T11:30:00Z',
    publishedBy: 'Mariana Duarte (Engenheira)',
    sections: [
      {
        id: 'SEC-10',
        title: '1. Sinalização e Bloqueio LOTO',
        order: 1,
        items: [
          {
            id: 'ITM-1001',
            label: 'Diagrama unifilar atualizado presente na porta do painel',
            responseType: 'BOOLEAN',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: true,
            order: 1
          },
          {
            id: 'ITM-1002',
            label: 'Sinalização de advertência de risco elétrico visível',
            responseType: 'BOOLEAN',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: false,
            order: 2
          }
        ]
      },
      {
        id: 'SEC-11',
        title: '2. Termografia e Conexões',
        order: 2,
        items: [
          {
            id: 'ITM-1003',
            label: 'Ponto quente detectado em barramentos ou disjuntores',
            responseType: 'BOOLEAN',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: true,
            order: 1
          },
          {
            id: 'ITM-1004',
            label: 'Temperatura máxima registrada na termografia (°C)',
            responseType: 'NUMERIC',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: true,
            order: 2
          }
        ]
      }
    ]
  },
  {
    id: 'TMP-003',
    title: 'Checklist Diário de Empilhadeiras e Veículos Industriais',
    description: 'Checagem pré-uso operacional de segurança diária antes do início do turno de trabalho.',
    category: 'Logística & Frotas',
    status: 'PUBLICADO',
    version: 1,
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-10T16:45:00Z',
    publishedAt: '2026-08-10T17:00:00Z',
    publishedBy: 'Carlos Silva (Supervisor)',
    sections: [
      {
        id: 'SEC-20',
        title: '1. Verificações Operacionais Básicas',
        order: 1,
        items: [
          {
            id: 'ITM-2001',
            label: 'Freios de serviço e estacionamento funcionais',
            responseType: 'BOOLEAN',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: true,
            order: 1
          },
          {
            id: 'ITM-2002',
            label: 'Buzina e alarme sonoro de marcha à ré operando',
            responseType: 'BOOLEAN',
            required: true,
            allowObservation: false,
            requireEvidenceOnNonConformity: true,
            order: 2
          },
          {
            id: 'ITM-2003',
            label: 'Horímetro Inicial',
            responseType: 'NUMERIC',
            required: true,
            allowObservation: false,
            requireEvidenceOnNonConformity: false,
            order: 3
          }
        ]
      }
    ]
  },
  {
    id: 'TMP-004',
    title: 'Inspeção de Vaso de Pressão e Caldeiras (NR-13)',
    description: 'Protocolo detalhado de integridade estrutural, espessura de chapa e teste hidrostático.',
    category: 'Segurança NR-13',
    status: 'RASCUNHO',
    version: 1,
    createdAt: '2026-08-25T14:10:00Z',
    updatedAt: '2026-08-29T18:00:00Z',
    sections: [
      {
        id: 'SEC-30',
        title: '1. Documentação Mandatória e Prontuário',
        order: 1,
        items: [
          {
            id: 'ITM-3001',
            label: 'Prontuário da caldeira disponível e atualizado',
            responseType: 'BOOLEAN',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: true,
            order: 1
          },
          {
            id: 'ITM-3002',
            label: 'Registro de Segurança em dia com anotações de ocorrências',
            responseType: 'BOOLEAN',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: false,
            order: 2
          }
        ]
      },
      {
        id: 'SEC-31',
        title: '2. Ensaio de Ultrassom e Medição de Espessura',
        order: 2,
        items: [
          {
            id: 'ITM-3003',
            label: 'Espessura Mínima Encontrada no Costado (mm)',
            responseType: 'NUMERIC',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: true,
            order: 1
          }
        ]
      }
    ]
  },
  {
    id: 'TMP-005',
    title: 'Manutenção Preventiva de Sistema de Climatização HVAC',
    description: 'Verificação de serpentinas, filtros de ar G4/F7, motores e dreno de condensado em chillers e fancoils.',
    category: 'HVAC & Predial',
    status: 'PUBLICADO',
    version: 2,
    createdAt: '2026-07-10T11:00:00Z',
    updatedAt: '2026-08-18T10:00:00Z',
    publishedAt: '2026-08-18T10:15:00Z',
    publishedBy: 'Carlos Silva (Supervisor)',
    sections: [
      {
        id: 'SEC-40',
        title: '1. Filtros e Qualidade do Ar',
        order: 1,
        items: [
          {
            id: 'ITM-4001',
            label: 'Estado de saturação dos elementos filtrantes',
            responseType: 'SINGLE_SELECT',
            options: [
              { id: 'OP-1', label: 'Limpo / Sem necessidade de troca', order: 1 },
              { id: 'OP-2', label: 'Higienizado em campo', order: 2 },
              { id: 'OP-3', label: 'Saturado (Substituído por novo)', order: 3 }
            ],
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: true,
            order: 1
          }
        ]
      }
    ]
  }
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PUBLICADO' | 'RASCUNHO'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [previewTemplate, setPreviewTemplate] = useState<(typeof INITIAL_TEMPLATES)[0] | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<(typeof INITIAL_TEMPLATES)[0] | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form builder state for Create / Edit Modal
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Mecânica & Fluidos');
  const [formStatus, setFormStatus] = useState<TemplateStatus>('PUBLICADO');
  const [formSections, setFormSections] = useState<TemplateSection[]>([]);

  // Show auto-dismiss toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filter logic
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Categories list
  const allCategories = Array.from(new Set(templates.map((t) => t.category)));

  // KPI calculations
  const totalTemplates = templates.length;
  const publishedCount = templates.filter((t) => t.status === 'PUBLICADO').length;
  const draftCount = templates.filter((t) => t.status === 'RASCUNHO').length;
  const totalItemsCount = templates.reduce((acc, t) => {
    return acc + t.sections.reduce((sAcc, s) => sAcc + s.items.length, 0);
  }, 0);

  // Open Template Editor for New
  const handleOpenNewEditor = () => {
    setEditingTemplate(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('Mecânica & Fluidos');
    setFormStatus('PUBLICADO');
    setFormSections([
      {
        id: `SEC-${Date.now()}-1`,
        title: '1. Verificações Preliminares',
        order: 1,
        items: [
          {
            id: `ITM-${Date.now()}-1`,
            label: 'Equipamento limpo e desenergizado com segurança?',
            responseType: 'BOOLEAN',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity: true,
            order: 1
          }
        ]
      }
    ]);
    setIsEditorOpen(true);
  };

  // Open Template Editor for Existing
  const handleOpenEdit = (t: (typeof INITIAL_TEMPLATES)[0]) => {
    setEditingTemplate(t);
    setFormTitle(t.title);
    setFormDescription(t.description);
    setFormCategory(t.category);
    setFormStatus(t.status);
    setFormSections(JSON.parse(JSON.stringify(t.sections)));
    setIsEditorOpen(true);
  };

  // Duplicate Template
  const handleDuplicate = (t: (typeof INITIAL_TEMPLATES)[0]) => {
    const newId = `TMP-${String(templates.length + 1).padStart(3, '0')}`;
    const duplicated: (typeof INITIAL_TEMPLATES)[0] = {
      ...JSON.parse(JSON.stringify(t)),
      id: newId,
      title: `${t.title} (Cópia)`,
      status: 'RASCUNHO',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: undefined,
      publishedBy: undefined
    };
    setTemplates([duplicated, ...templates]);
    showToast(`Modelo "${duplicated.title}" duplicado com sucesso como Rascunho.`);
  };

  // Delete Template
  const handleDelete = (id: string, title: string) => {
    if (confirm(`Deseja realmente remover o modelo "${title}"?`)) {
      setTemplates(templates.filter((t) => t.id !== id));
      showToast(`Modelo "${title}" removido com sucesso.`);
    }
  };

  // Toggle status
  const handleToggleStatus = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus: TemplateStatus = t.status === 'PUBLICADO' ? 'RASCUNHO' : 'PUBLICADO';
          return {
            ...t,
            status: nextStatus,
            publishedAt: nextStatus === 'PUBLICADO' ? new Date().toISOString() : undefined,
            publishedBy: nextStatus === 'PUBLICADO' ? 'Administrador' : undefined,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      })
    );
    showToast('Status do modelo atualizado.');
  };

  // Add section in editor
  const handleAddSection = () => {
    const secNum = formSections.length + 1;
    const newSection: TemplateSection = {
      id: `SEC-${Date.now()}-${secNum}`,
      title: `${secNum}. Nova Seção de Itens`,
      order: secNum,
      items: [
        {
          id: `ITM-${Date.now()}-1`,
          label: 'Item de verificação',
          responseType: 'BOOLEAN',
          required: true,
          allowObservation: true,
          requireEvidenceOnNonConformity: true,
          order: 1
        }
      ]
    };
    setFormSections([...formSections, newSection]);
  };

  // Remove section
  const handleRemoveSection = (sectionIndex: number) => {
    if (formSections.length === 1) {
      alert('O modelo deve conter pelo menos uma seção.');
      return;
    }
    const updated = formSections.filter((_, idx) => idx !== sectionIndex);
    setFormSections(updated);
  };

  // Add item to section
  const handleAddItemToSection = (sectionIndex: number) => {
    const targetSec = formSections[sectionIndex];
    const itemNum = targetSec.items.length + 1;
    const newItem: TemplateItem = {
      id: `ITM-${Date.now()}-${itemNum}`,
      label: `Nova verificação ou teste #${itemNum}`,
      responseType: 'BOOLEAN',
      required: true,
      allowObservation: true,
      requireEvidenceOnNonConformity: true,
      order: itemNum
    };
    const updated = [...formSections];
    updated[sectionIndex].items.push(newItem);
    setFormSections(updated);
  };

  // Remove item from section
  const handleRemoveItem = (sectionIndex: number, itemIndex: number) => {
    if (formSections[sectionIndex].items.length === 1) {
      alert('Cada seção precisa ter pelo menos um item.');
      return;
    }
    const updated = [...formSections];
    updated[sectionIndex].items.splice(itemIndex, 1);
    setFormSections(updated);
  };

  // Save template from editor
  const handleSaveEditor = (statusToSave: TemplateStatus) => {
    if (!formTitle.trim()) {
      alert('Por favor, informe o título do modelo.');
      return;
    }

    if (editingTemplate) {
      // Update
      const updatedList = templates.map((t) => {
        if (t.id === editingTemplate.id) {
          return {
            ...t,
            title: formTitle.trim(),
            description: formDescription.trim(),
            category: formCategory,
            status: statusToSave,
            version: statusToSave === 'PUBLICADO' && t.status === 'RASCUNHO' ? t.version + 1 : t.version,
            sections: formSections,
            updatedAt: new Date().toISOString(),
            publishedAt: statusToSave === 'PUBLICADO' ? new Date().toISOString() : t.publishedAt,
            publishedBy: statusToSave === 'PUBLICADO' ? 'Administrador' : t.publishedBy
          };
        }
        return t;
      });
      setTemplates(updatedList);
      showToast(`Modelo "${formTitle}" atualizado com sucesso.`);
    } else {
      // Create new
      const newId = `TMP-${String(templates.length + 1).padStart(3, '0')}`;
      const newTemplate: (typeof INITIAL_TEMPLATES)[0] = {
        id: newId,
        title: formTitle.trim(),
        description: formDescription.trim() || 'Modelo de inspeção operacional criado pelo administrador.',
        category: formCategory,
        status: statusToSave,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: statusToSave === 'PUBLICADO' ? new Date().toISOString() : undefined,
        publishedBy: statusToSave === 'PUBLICADO' ? 'Administrador' : undefined,
        sections: formSections
      };
      setTemplates([newTemplate, ...templates]);
      showToast(`Novo modelo "${formTitle}" criado com sucesso!`);
    }

    setIsEditorOpen(false);
  };

  return (
    <>
      <TopHeader 
        title="Modelos de Inspeção"
        context={
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">FieldOps Desktop</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800">Modelos & Checklists</span>
          </div>
        }
      />

      {/* Main Container */}
      <div className="p-8 max-w-7xl mx-auto space-y-6">

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-lg shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
            <CheckCircle2 size={20} className="text-[#10b981]" />
            <span className="text-sm font-medium">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-3 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <FileText className="text-[#0f766e]" size={32} />
              Modelos de Inspeção
            </h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">
              Crie, gerencie e publique questionários e formulários padronizados para execução em campo.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleOpenNewEditor}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0f766e] text-white rounded-md shadow-sm hover:bg-[#115e59] font-medium text-sm transition-colors cursor-pointer"
            >
              <Plus size={18} strokeWidth={2.5} />
              Novo Modelo
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-[#0f766e] rounded-lg">
              <Layers size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Modelos</div>
              <div className="text-2xl font-bold text-slate-900">{totalTemplates}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileCheck size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Publicados (Ativos)</div>
              <div className="text-2xl font-bold text-emerald-700">{publishedCount}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rascunhos em Edição</div>
              <div className="text-2xl font-bold text-amber-700">{draftCount}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <ListChecks size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Itens Checklist</div>
              <div className="text-2xl font-bold text-indigo-900">{totalItemsCount}</div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-1 items-center gap-3 min-w-[280px]">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </div>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar modelo por título, descrição ou ID..."
                className="block w-full pl-9 py-2 border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
              />
            </div>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="py-2 px-3 border border-slate-200 rounded-md text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]"
            >
              <option value="ALL">Todos os Status</option>
              <option value="PUBLICADO">Publicado</option>
              <option value="RASCUNHO">Rascunho</option>
            </select>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 border border-slate-200 rounded-md text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981] hidden sm:block"
            >
              <option value="ALL">Todas as Categorias</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 border border-slate-200 p-1 rounded-md bg-slate-50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-xs text-[#0f766e] font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              title="Visualização em Cards"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-white shadow-xs text-[#0f766e] font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              title="Visualização em Tabela"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Content View: Grid or Table */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <FileText size={48} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Nenhum modelo encontrado</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Nenhum modelo de inspeção corresponde aos filtros de busca aplicados.
            </p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedStatus('ALL'); setSelectedCategory('ALL'); }}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-sm font-medium transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const totalItems = template.sections.reduce((acc, s) => acc + s.items.length, 0);
              const isPublished = template.status === 'PUBLICADO';

              return (
                <div 
                  key={template.id} 
                  className="bg-white rounded-lg border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {template.id}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          v{template.version}.0
                        </span>
                        <span 
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            isPublished 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {template.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0f766e] transition-colors line-clamp-2 mb-2">
                      {template.title}
                    </h3>
                    
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {template.description}
                    </p>

                    <div className="inline-block text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md mb-4">
                      {template.category}
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-2 gap-2 py-3 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Layers size={14} className="text-[#0f766e]" />
                        <span>{template.sections.length} {template.sections.length === 1 ? 'seção' : 'seções'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ListChecks size={14} className="text-[#0f766e]" />
                        <span>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className="flex items-center gap-1.5 text-[#0f766e] hover:text-[#115e59] font-semibold transition-colors"
                    >
                      <Eye size={15} />
                      Visualizar
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(template)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                        title="Editar Modelo"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(template)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                        title="Duplicar como Rascunho"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(template.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                        title={isPublished ? 'Despublicar / Mover para Rascunho' : 'Publicar'}
                      >
                        {isPublished ? <ToggleRight size={16} className="text-emerald-600" /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(template.id, template.title)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Excluir Modelo"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">ID</th>
                    <th className="px-6 py-3.5">Título do Modelo</th>
                    <th className="px-6 py-3.5">Categoria</th>
                    <th className="px-6 py-3.5">Estrutura</th>
                    <th className="px-6 py-3.5">Versão</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredTemplates.map((template) => {
                    const totalItems = template.sections.reduce((acc, s) => acc + s.items.length, 0);
                    const isPublished = template.status === 'PUBLICADO';

                    return (
                      <tr key={template.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-500">
                          {template.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{template.title}</div>
                          <div className="text-xs text-slate-500 line-clamp-1">{template.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded">
                            {template.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                          {template.sections.length} seções • {totalItems} itens
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-600">
                          v{template.version}.0
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                              isPublished 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {template.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPreviewTemplate(template)}
                              className="p-1.5 text-slate-500 hover:text-[#0f766e] hover:bg-slate-100 rounded transition-colors"
                              title="Visualizar Checklist"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(template)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                              title="Editar Modelo"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDuplicate(template)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                              title="Duplicar"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(template.id, template.title)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {previewTemplate.id}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    v{previewTemplate.version}.0 • {previewTemplate.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{previewTemplate.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{previewTemplate.description}</p>
              </div>
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Checklist View */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex items-center gap-2">
                <Sparkles size={16} className="text-blue-600 flex-shrink-0" />
                <span>Esta é a visão de simulação de preenchimento que os técnicos de campo executam no aplicativo mobile.</span>
              </div>

              {previewTemplate.sections.map((section, sIdx) => (
                <div key={section.id} className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                  <div className="bg-slate-100/70 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Layers size={16} className="text-[#0f766e]" />
                      {section.title}
                    </h3>
                    <span className="text-xs text-slate-500">{section.items.length} itens</span>
                  </div>

                  <div className="p-4 divide-y divide-slate-100">
                    {section.items.map((item, iIdx) => (
                      <div key={item.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="text-xs font-semibold text-slate-400 mt-0.5">#{iIdx + 1}</span>
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {item.label}
                                {item.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-slate-500">
                                <span className="px-1.5 py-0.5 bg-slate-100 rounded font-mono">
                                  Tipo: {item.responseType}
                                </span>
                                {item.requireEvidenceOnNonConformity && (
                                  <span className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded">
                                    Exige Foto se Não Conforme
                                  </span>
                                )}
                                {item.allowObservation && (
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    Permite Observação
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Dummy control representation */}
                          <div className="flex-shrink-0">
                            {item.responseType === 'BOOLEAN' && (
                              <div className="flex gap-1 border border-slate-200 rounded p-0.5 bg-slate-50 text-xs">
                                <span className="px-2 py-1 bg-white shadow-xs rounded font-medium text-emerald-700">C</span>
                                <span className="px-2 py-1 text-slate-400">NC</span>
                                <span className="px-2 py-1 text-slate-400">N/A</span>
                              </div>
                            )}
                            {item.responseType === 'NUMERIC' && (
                              <div className="w-24 px-2 py-1 border border-slate-200 rounded bg-slate-50 text-xs text-slate-400 text-right">
                                0.00
                              </div>
                            )}
                            {item.responseType === 'TEXT' && (
                              <div className="w-32 px-2 py-1 border border-slate-200 rounded bg-slate-50 text-xs text-slate-400">
                                Texto...
                              </div>
                            )}
                            {item.responseType === 'SINGLE_SELECT' && (
                              <div className="w-36 px-2 py-1 border border-slate-200 rounded bg-slate-50 text-xs text-slate-500">
                                Selecionar...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button 
                onClick={() => {
                  const target = previewTemplate;
                  setPreviewTemplate(null);
                  handleOpenEdit(target);
                }}
                className="flex items-center gap-2 text-xs font-semibold text-[#0f766e] hover:underline"
              >
                <Edit3 size={14} />
                Editar este Modelo
              </button>
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-sm font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT TEMPLATE MODAL BUILDER */}
      {/* ========================================================================= */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="text-[#0f766e]" size={22} />
                  {editingTemplate ? `Editar Modelo: ${editingTemplate.id}` : 'Novo Modelo de Inspeção'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure as informações gerais, seções e itens que compõem o roteiro técnico.
                </p>
              </div>
              <button 
                onClick={() => setIsEditorOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* General Information */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  1. Informações Básicas do Modelo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Título do Modelo <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Ex: Inspeção Preventiva de Geradores Diesel"
                      className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Categoria / Disciplina
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                    >
                      <option value="Mecânica & Fluidos">Mecânica & Fluidos</option>
                      <option value="Elétrica & NR-10">Elétrica & NR-10</option>
                      <option value="Segurança NR-13">Segurança NR-13</option>
                      <option value="HVAC & Predial">HVAC & Predial</option>
                      <option value="Logística & Frotas">Logística & Frotas</option>
                      <option value="Civil & Estrutural">Civil & Estrutural</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Inicial
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                    >
                      <option value="PUBLICADO">PUBLICADO (Disponível imediatamente para agendamento)</option>
                      <option value="RASCUNHO">RASCUNHO (Em elaboração)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Descrição e Instruções Gerais
                    </label>
                    <textarea 
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Breve resumo da finalidade e escopo desta inspeção técnica..."
                      className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sections & Items Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    2. Estrutura do Checklist (Seções & Perguntas)
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-[#0f766e] hover:bg-teal-100 rounded text-xs font-semibold transition-colors"
                  >
                    <Plus size={14} />
                    Adicionar Seção
                  </button>
                </div>

                {formSections.map((section, secIdx) => (
                  <div key={section.id} className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    {/* Section Header */}
                    <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <Layers size={18} className="text-[#0f766e]" />
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => {
                            const updated = [...formSections];
                            updated[secIdx].title = e.target.value;
                            setFormSections(updated);
                          }}
                          placeholder="Título da Seção (ex: 1. Inspeção Visual)"
                          className="font-bold text-sm text-slate-800 bg-white border border-slate-300 rounded px-2.5 py-1 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddItemToSection(secIdx)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded shadow-2xs"
                        >
                          <Plus size={12} />
                          Item
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(secIdx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                          title="Remover Seção"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Section Items */}
                    <div className="p-4 space-y-3 bg-slate-50/40">
                      {section.items.map((item, itemIdx) => (
                        <div key={item.id} className="bg-white p-3.5 rounded-md border border-slate-200 shadow-2xs space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-xs font-bold text-slate-400 mt-2">#{itemIdx + 1}</span>
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={item.label}
                                onChange={(e) => {
                                  const updated = [...formSections];
                                  updated[secIdx].items[itemIdx].label = e.target.value;
                                  setFormSections(updated);
                                }}
                                placeholder="Pergunta ou item de verificação..."
                                className="w-full text-sm font-medium text-slate-800 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                              />

                              <div className="flex flex-wrap items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <label className="text-slate-600 font-semibold">Tipo de Resposta:</label>
                                  <select
                                    value={item.responseType}
                                    onChange={(e) => {
                                      const updated = [...formSections];
                                      updated[secIdx].items[itemIdx].responseType = e.target.value as ResponseType;
                                      setFormSections(updated);
                                    }}
                                    className="py-1 px-2 border border-slate-200 rounded text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                                  >
                                    <option value="BOOLEAN">BOOLEAN (Conforme / Não Conforme)</option>
                                    <option value="NUMERIC">NUMERIC (Medição / Valor)</option>
                                    <option value="TEXT">TEXT (Texto / Observação livre)</option>
                                    <option value="SINGLE_SELECT">SINGLE_SELECT (Opções)</option>
                                    <option value="DATE">DATE (Data)</option>
                                  </select>
                                </div>

                                <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.required}
                                    onChange={(e) => {
                                      const updated = [...formSections];
                                      updated[secIdx].items[itemIdx].required = e.target.checked;
                                      setFormSections(updated);
                                    }}
                                    className="rounded text-[#0f766e] focus:ring-[#10b981]"
                                  />
                                  <span>Obrigatório</span>
                                </label>

                                <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.requireEvidenceOnNonConformity}
                                    onChange={(e) => {
                                      const updated = [...formSections];
                                      updated[secIdx].items[itemIdx].requireEvidenceOnNonConformity = e.target.checked;
                                      setFormSections(updated);
                                    }}
                                    className="rounded text-[#0f766e] focus:ring-[#10b981]"
                                  />
                                  <span>Exigir Foto em Não Conformidade</span>
                                </label>

                                <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.allowObservation}
                                    onChange={(e) => {
                                      const updated = [...formSections];
                                      updated[secIdx].items[itemIdx].allowObservation = e.target.checked;
                                      setFormSections(updated);
                                    }}
                                    className="rounded text-[#0f766e] focus:ring-[#10b981]"
                                  />
                                  <span>Permitir Observação</span>
                                </label>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(secIdx, itemIdx)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                              title="Remover Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveEditor('RASCUNHO')}
                  className="px-4 py-2 bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-md text-sm font-semibold transition-colors"
                >
                  Salvar como Rascunho
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEditor('PUBLICADO')}
                  className="flex items-center gap-2 px-5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-md text-sm font-semibold transition-colors shadow-xs"
                >
                  <Check size={16} />
                  Publicar Modelo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

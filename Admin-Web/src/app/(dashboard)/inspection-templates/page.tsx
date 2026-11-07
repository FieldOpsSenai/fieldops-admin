'use client';

import React, { useEffect, useMemo, useState } from 'react';

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  Eye,
  FileCheck,
  FileText,
  Grid2X2,
  Layers3,
  List,
  ListChecks,
  LockKeyhole,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import TopHeader from '@/components/layout/TopHeader';
import { modeloInspecaoService } from '@/lib/api/services';

import type {
  ResponseType,
  Template,
  TemplateItem,
  TemplateOption,
  TemplateSection,
  TemplateStatus,
} from '@/types';

type InspectionTemplate = Template & {
  description: string;
  category: string;
};

type StatusFilter =
  | 'ALL'
  | TemplateStatus;

type ViewMode =
  | 'grid'
  | 'table';

const CATEGORIES = [
  'Mecânica & Fluidos',
  'Elétrica & NR-10',
  'Segurança NR-13',
  'HVAC & Predial',
  'Logística & Frotas',
  'Civil & Estrutural',
];

const RESPONSE_TYPE_LABELS: Record<
  ResponseType,
  string
> = {
  TEXT: 'Texto',
  NUMERIC: 'Numérico',
  DATE: 'Data',
  SINGLE_SELECT: 'Seleção única',
  MULTI_SELECT: 'Seleção múltipla',
  BOOLEAN: 'Conforme / Não conforme',
};

const PUBLISHABLE_RESPONSE_TYPES: ResponseType[] = [
  'TEXT',
  'NUMERIC',
  'DATE',
  'SINGLE_SELECT',
  'BOOLEAN',
];

const INITIAL_TEMPLATES: InspectionTemplate[] = [
  {
    id: 'TMP-001',
    title:
      'Inspeção Preventiva de Compressores Industriais',
    description:
      'Checklist padrão para inspeção mecânica, elétrica e operacional de compressores industriais.',
    category: 'Mecânica & Fluidos',
    status: 'PUBLICADO',
    version: 1,
    createdAt:
      '2026-08-01T12:00:00.000Z',
    updatedAt:
      '2026-08-03T15:30:00.000Z',
    publishedAt:
      '2026-08-03T15:30:00.000Z',
    publishedBy:
      'Supervisor FieldOps',
    sections: [
      {
        id: 'SEC-1000',
        title:
          '1. Segurança e condições iniciais',
        order: 1,
        items: [
          {
            id: 'ITM-1001',
            label:
              'Equipamento encontra-se em condição segura para inspeção?',
            responseType:
              'BOOLEAN',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity:
              true,
            order: 1,
          },
          {
            id: 'ITM-1002',
            label:
              'Data da última manutenção preventiva',
            responseType:
              'DATE',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity:
              false,
            order: 2,
          },
        ],
      },
      {
        id: 'SEC-1100',
        title:
          '2. Verificação operacional',
        order: 2,
        items: [
          {
            id: 'ITM-1101',
            label:
              'Pressão de operação medida',
            responseType:
              'NUMERIC',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity:
              true,
            order: 1,
          },
          {
            id: 'ITM-1102',
            label:
              'Condição geral dos filtros',
            responseType:
              'SINGLE_SELECT',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity:
              true,
            order: 2,
            options: [
              {
                id: 'OPT-1102-1',
                label: 'Normal',
                order: 1,
              },
              {
                id: 'OPT-1102-2',
                label:
                  'Requer limpeza',
                order: 2,
              },
              {
                id: 'OPT-1102-3',
                label:
                  'Requer substituição',
                order: 3,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'TMP-002',
    title:
      'Inspeção de Painéis Elétricos',
    description:
      'Roteiro para inspeção visual e técnica de painéis elétricos industriais.',
    category: 'Elétrica & NR-10',
    status: 'PUBLICADO',
    version: 1,
    createdAt:
      '2026-08-08T10:00:00.000Z',
    updatedAt:
      '2026-08-10T14:00:00.000Z',
    publishedAt:
      '2026-08-10T14:00:00.000Z',
    publishedBy:
      'Supervisor FieldOps',
    sections: [
      {
        id: 'SEC-2000',
        title:
          '1. Condições do painel',
        order: 1,
        items: [
          {
            id: 'ITM-2001',
            label:
              'O painel possui identificação visível?',
            responseType:
              'BOOLEAN',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity:
              true,
            order: 1,
          },
          {
            id: 'ITM-2002',
            label:
              'Observações sobre integridade física',
            responseType:
              'TEXT',
            required: false,
            allowObservation: true,
            requireEvidenceOnNonConformity:
              false,
            order: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'TMP-003',
    title:
      'Inspeção de Segurança em Caldeiras',
    description:
      'Modelo em elaboração para inspeções relacionadas à segurança de caldeiras.',
    category: 'Segurança NR-13',
    status: 'RASCUNHO',
    version: 1,
    createdAt:
      '2026-09-20T09:00:00.000Z',
    updatedAt:
      '2026-09-20T09:00:00.000Z',
    sections: [
      {
        id: 'SEC-3000',
        title:
          '1. Verificações preliminares',
        order: 1,
        items: [
          {
            id: 'ITM-3001',
            label:
              'Documentação do equipamento disponível?',
            responseType:
              'BOOLEAN',
            required: true,
            allowObservation: true,
            requireEvidenceOnNonConformity:
              true,
            order: 1,
          },
        ],
      },
    ],
  },
];

function createId(
  prefix: string
) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function cloneSections(
  sections: TemplateSection[]
) {
  return structuredClone(sections);
}

function normalizeOrders(
  sections: TemplateSection[]
): TemplateSection[] {
  return sections.map(
    (section, sectionIndex) => ({
      ...section,
      order: sectionIndex + 1,

      items: section.items.map(
        (item, itemIndex) => ({
          ...item,
          order: itemIndex + 1,

          options:
            item.options?.map(
              (
                option,
                optionIndex
              ) => ({
                ...option,
                order:
                  optionIndex + 1,
              })
            ),
        })
      ),
    })
  );
}

function createDefaultItem(
  order: number
): TemplateItem {
  return {
    id: createId('ITM'),
    label:
      'Nova verificação',
    responseType:
      'BOOLEAN',
    required: true,
    allowObservation: true,
    requireEvidenceOnNonConformity:
      true,
    order,
  };
}

function createDefaultSection(
  order: number
): TemplateSection {
  return {
    id: createId('SEC'),
    title:
      `${order}. Nova seção`,
    order,
    items: [
      createDefaultItem(1),
    ],
  };
}

function validateTemplateForPublish(
  title: string,
  category: string,
  sections: TemplateSection[]
): string[] {
  const errors: string[] = [];

  if (!title.trim()) {
    errors.push(
      'Informe o título do modelo.'
    );
  }

  if (!category.trim()) {
    errors.push(
      'Informe a categoria do modelo.'
    );
  }

  if (sections.length === 0) {
    errors.push(
      'O modelo precisa possuir pelo menos uma seção.'
    );
  }

  sections.forEach(
    (
      section,
      sectionIndex
    ) => {
      if (!section.title.trim()) {
        errors.push(
          `A seção ${sectionIndex + 1} precisa possuir um título.`
        );
      }

      if (
        section.items.length === 0
      ) {
        errors.push(
          `A seção "${section.title || sectionIndex + 1}" precisa possuir pelo menos um item.`
        );
      }

      section.items.forEach(
        (
          item,
          itemIndex
        ) => {
          if (
            !item.label.trim()
          ) {
            errors.push(
              `O item ${itemIndex + 1} da seção ${sectionIndex + 1} precisa possuir uma descrição.`
            );
          }

          if (
            !PUBLISHABLE_RESPONSE_TYPES.includes(
              item.responseType
            )
          ) {
            errors.push(
              `O item "${item.label || itemIndex + 1}" utiliza um tipo de resposta ainda não suportado para publicação.`
            );
          }

          if (
            item.responseType ===
            'SINGLE_SELECT'
          ) {
            if (
              !item.options ||
              item.options.length <
                2
            ) {
              errors.push(
                `O item "${item.label || itemIndex + 1}" precisa possuir pelo menos duas opções.`
              );
            } else if (
              item.options.some(
                (option) =>
                  !option.label.trim()
              )
            ) {
              errors.push(
                `Todas as opções do item "${item.label || itemIndex + 1}" precisam possuir descrição.`
              );
            }
          }
        }
      );
    }
  );

  return errors;
}

function formatDate(
  value?: string
) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    }
  ).format(new Date(value));
}

export default function TemplatesPage() {
  const [
    templates,
    setTemplates,
  ] = useState<
    InspectionTemplate[]
  >(INITIAL_TEMPLATES);

  const [isApiListAvailable, setIsApiListAvailable] = useState(true);

  useEffect(() => {
    let active = true;

    void modeloInspecaoService.listarTodos()
      .then((items) => {
        if (active) {
          setTemplates(items);
          setIsApiListAvailable(true);
        }
      })
      .catch(() => {
        if (active) setIsApiListAvailable(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState<StatusFilter>(
    'ALL'
  );

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('ALL');

  const [
    viewMode,
    setViewMode,
  ] = useState<ViewMode>(
    'grid'
  );

  const [
    previewTemplate,
    setPreviewTemplate,
  ] =
    useState<InspectionTemplate | null>(
      null
    );

  const [
    isEditorOpen,
    setIsEditorOpen,
  ] = useState(false);

  const [
    editingTemplate,
    setEditingTemplate,
  ] =
    useState<InspectionTemplate | null>(
      null
    );

  const [
    toastMessage,
    setToastMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    editorError,
    setEditorError,
  ] =
    useState<string | null>(
      null
    );

  const [
    formTitle,
    setFormTitle,
  ] = useState('');

  const [
    formDescription,
    setFormDescription,
  ] = useState('');

  const [
    formCategory,
    setFormCategory,
  ] = useState(
    'Mecânica & Fluidos'
  );

  const [
    formSections,
    setFormSections,
  ] = useState<
    TemplateSection[]
  >([]);

  const filteredTemplates =
    useMemo(() => {
      const term =
        searchTerm
          .trim()
          .toLowerCase();

      return templates.filter(
        (template) => {
          const matchesSearch =
            !term ||
            template.title
              .toLowerCase()
              .includes(term) ||
            template.description
              .toLowerCase()
              .includes(term) ||
            template.id
              .toLowerCase()
              .includes(term);

          const matchesStatus =
            selectedStatus ===
              'ALL' ||
            template.status ===
              selectedStatus;

          const matchesCategory =
            selectedCategory ===
              'ALL' ||
            template.category ===
              selectedCategory;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesCategory
          );
        }
      );
    }, [
      templates,
      searchTerm,
      selectedStatus,
      selectedCategory,
    ]);

  const allCategories =
    useMemo(
      () =>
        Array.from(
          new Set(
            templates.map(
              (template) =>
                template.category
            )
          )
        ),
      [templates]
    );

  const publishedCount =
    templates.filter(
      (template) =>
        template.status ===
        'PUBLICADO'
    ).length;

  const draftCount =
    templates.filter(
      (template) =>
        template.status ===
        'RASCUNHO'
    ).length;

  const totalItems =
    templates.reduce(
      (
        total,
        template
      ) =>
        total +
        template.sections.reduce(
          (
            sectionTotal,
            section
          ) =>
            sectionTotal +
            section.items.length,
          0
        ),
      0
    );

  const showToast = (
    message: string
  ) => {
    setToastMessage(
      message
    );

    window.setTimeout(
      () => {
        setToastMessage(
          null
        );
      },
      4000
    );
  };

  const handleOpenNewEditor =
    () => {
      setEditingTemplate(
        null
      );

      setFormTitle('');
      setFormDescription('');
      setFormCategory(
        'Mecânica & Fluidos'
      );

      setFormSections([
        createDefaultSection(
          1
        ),
      ]);

      setEditorError(null);

      setIsEditorOpen(
        true
      );
    };

  const handleOpenEdit = (
    template: InspectionTemplate
  ) => {
    if (
      template.status ===
      'PUBLICADO'
    ) {
      showToast(
        'Versões publicadas são imutáveis. Use o modelo como base para criar um novo rascunho.'
      );

      return;
    }

    setEditingTemplate(
      template
    );

    setFormTitle(
      template.title
    );

    setFormDescription(
      template.description
    );

    setFormCategory(
      template.category
    );

    setFormSections(
      cloneSections(
        template.sections
      )
    );

    setEditorError(null);

    setIsEditorOpen(
      true
    );
  };

  const handleDuplicate = (
    template: InspectionTemplate
  ) => {
    const now =
      new Date().toISOString();

    const duplicated: InspectionTemplate =
      {
        ...template,

        id: createId(
          'TMP'
        ),

        title:
          `${template.title} (Cópia)`,

        status:
          'RASCUNHO',

        version: 1,

        createdAt: now,

        updatedAt: now,

        publishedAt:
          undefined,

        publishedBy:
          undefined,

        sections:
          cloneSections(
            template.sections
          ),
      };

    setTemplates(
      (current) => [
        duplicated,
        ...current,
      ]
    );

    showToast(
      `Modelo "${template.title}" copiado para um novo rascunho.`
    );
  };

  const handleDelete = (
    template: InspectionTemplate
  ) => {
    if (
      template.status ===
      'PUBLICADO'
    ) {
      showToast(
        'Uma versão publicada não pode ser excluída.'
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Deseja realmente remover o rascunho "${template.title}"?`
      );

    if (!confirmed) {
      return;
    }

    setTemplates(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            template.id
        )
    );

    showToast(
      `Rascunho "${template.title}" removido.`
    );
  };

  const handleAddSection =
    () => {
      setFormSections(
        (current) => [
          ...current,
          createDefaultSection(
            current.length + 1
          ),
        ]
      );
    };

  const handleRemoveSection =
    (
      sectionIndex: number
    ) => {
      if (
        formSections.length ===
        1
      ) {
        setEditorError(
          'O modelo precisa possuir pelo menos uma seção.'
        );

        return;
      }

      setFormSections(
        (current) =>
          normalizeOrders(
            current.filter(
              (
                _section,
                index
              ) =>
                index !==
                sectionIndex
            )
          )
      );
    };

  const handleSectionTitleChange =
    (
      sectionIndex: number,
      value: string
    ) => {
      setFormSections(
        (current) =>
          current.map(
            (
              section,
              index
            ) =>
              index ===
              sectionIndex
                ? {
                    ...section,
                    title:
                      value,
                  }
                : section
          )
      );
    };

  const handleAddItem =
    (
      sectionIndex: number
    ) => {
      setFormSections(
        (current) =>
          current.map(
            (
              section,
              index
            ) => {
              if (
                index !==
                sectionIndex
              ) {
                return section;
              }

              return {
                ...section,

                items: [
                  ...section.items,
                  createDefaultItem(
                    section.items
                      .length +
                      1
                  ),
                ],
              };
            }
          )
      );
    };

  const handleRemoveItem =
    (
      sectionIndex: number,
      itemIndex: number
    ) => {
      const section =
        formSections[
          sectionIndex
        ];

      if (
        section.items.length ===
        1
      ) {
        setEditorError(
          'Cada seção precisa possuir pelo menos um item.'
        );

        return;
      }

      setFormSections(
        (current) =>
          normalizeOrders(
            current.map(
              (
                currentSection,
                index
              ) => {
                if (
                  index !==
                  sectionIndex
                ) {
                  return currentSection;
                }

                return {
                  ...currentSection,

                  items:
                    currentSection.items.filter(
                      (
                        _item,
                        currentItemIndex
                      ) =>
                        currentItemIndex !==
                        itemIndex
                    ),
                };
              }
            )
          )
      );
    };

  const updateItem = (
    sectionIndex: number,
    itemIndex: number,
    updater: (
      item: TemplateItem
    ) => TemplateItem
  ) => {
    setFormSections(
      (current) =>
        current.map(
          (
            section,
            currentSectionIndex
          ) => {
            if (
              currentSectionIndex !==
              sectionIndex
            ) {
              return section;
            }

            return {
              ...section,

              items:
                section.items.map(
                  (
                    item,
                    currentItemIndex
                  ) =>
                    currentItemIndex ===
                    itemIndex
                      ? updater(
                          item
                        )
                      : item
                ),
            };
          }
        )
    );
  };

  const handleResponseTypeChange =
    (
      sectionIndex: number,
      itemIndex: number,
      responseType: ResponseType
    ) => {
      updateItem(
        sectionIndex,
        itemIndex,
        (item) => {
          if (
            responseType ===
            'SINGLE_SELECT'
          ) {
            return {
              ...item,

              responseType,

              options:
                item.options &&
                item.options
                  .length >= 2
                  ? item.options
                  : [
                      {
                        id: createId(
                          'OPT'
                        ),
                        label:
                          'Opção 1',
                        order: 1,
                      },
                      {
                        id: createId(
                          'OPT'
                        ),
                        label:
                          'Opção 2',
                        order: 2,
                      },
                    ],
            };
          }

          return {
            ...item,

            responseType,

            options:
              undefined,
          };
        }
      );
    };

  const handleAddOption = (
    sectionIndex: number,
    itemIndex: number
  ) => {
    updateItem(
      sectionIndex,
      itemIndex,
      (item) => {
        const options =
          item.options || [];

        return {
          ...item,

          options: [
            ...options,
            {
              id: createId(
                'OPT'
              ),

              label:
                `Opção ${options.length + 1}`,

              order:
                options.length +
                1,
            },
          ],
        };
      }
    );
  };

  const handleOptionChange =
    (
      sectionIndex: number,
      itemIndex: number,
      optionIndex: number,
      value: string
    ) => {
      updateItem(
        sectionIndex,
        itemIndex,
        (item) => ({
          ...item,

          options:
            item.options?.map(
              (
                option,
                currentOptionIndex
              ) =>
                currentOptionIndex ===
                optionIndex
                  ? {
                      ...option,
                      label:
                        value,
                    }
                  : option
            ),
        })
      );
    };

  const handleRemoveOption =
    (
      sectionIndex: number,
      itemIndex: number,
      optionIndex: number
    ) => {
      updateItem(
        sectionIndex,
        itemIndex,
        (item) => {
          const options =
            item.options || [];

          if (
            options.length <=
            2
          ) {
            setEditorError(
              'Itens de seleção única precisam possuir pelo menos duas opções.'
            );

            return item;
          }

          return {
            ...item,

            options:
              options
                .filter(
                  (
                    _option,
                    currentOptionIndex
                  ) =>
                    currentOptionIndex !==
                    optionIndex
                )
                .map(
                  (
                    option,
                    currentOptionIndex
                  ) => ({
                    ...option,
                    order:
                      currentOptionIndex +
                      1,
                  })
                ),
          };
        }
      );
    };

  const handleSaveEditor =
      async (
      statusToSave: TemplateStatus
    ) => {
      setEditorError(null);

      if (
        !formTitle.trim()
      ) {
        setEditorError(
          'Informe o título do modelo.'
        );

        return;
      }

      const normalizedSections =
        normalizeOrders(
          formSections
        );

      if (
        statusToSave ===
        'PUBLICADO'
      ) {
        if (
          editingTemplate?.status ===
          'PUBLICADO'
        ) {
          setEditorError(
            'Versões publicadas são imutáveis.'
          );

          return;
        }

        const validationErrors =
          validateTemplateForPublish(
            formTitle,
            formCategory,
            normalizedSections
          );

        if (
          validationErrors.length >
          0
        ) {
          setEditorError(
            validationErrors.join(
              ' '
            )
          );

          return;
        }
      }

      const now =
        new Date().toISOString();

      if (
        editingTemplate
      ) {
        setTemplates(
          (current) =>
            current.map(
              (template) => {
                if (
                  template.id !==
                  editingTemplate.id
                ) {
                  return template;
                }

                return {
                  ...template,

                  title:
                    formTitle.trim(),

                  description:
                    formDescription.trim() ||
                    'Modelo de inspeção operacional.',

                  category:
                    formCategory,

                  sections:
                    cloneSections(
                      normalizedSections
                    ),

                  status:
                    statusToSave,

                  version:
                    template.version,

                  updatedAt:
                    now,

                  publishedAt:
                    statusToSave ===
                    'PUBLICADO'
                      ? now
                      : undefined,

                  publishedBy:
                    statusToSave ===
                    'PUBLICADO'
                      ? 'Supervisor FieldOps'
                      : undefined,
                };
              }
            )
        );

        if (
          statusToSave ===
          'PUBLICADO'
        ) {
          showToast(
            `Modelo "${formTitle}" publicado. Esta versão agora é imutável.`
          );
        } else {
          showToast(
            `Rascunho "${formTitle}" salvo.`
          );
        }
      } else {
        try {
          const created = await modeloInspecaoService.criar(
            {
              title: formTitle.trim(),
              description: formDescription.trim() || 'Modelo de inspeção operacional.',
              category: formCategory,
              sections: normalizedSections,
            },
            statusToSave === 'PUBLICADO',
          );

          setTemplates((current) => [created, ...current]);
          showToast(statusToSave === 'PUBLICADO'
            ? `Modelo "${formTitle}" publicado. Esta versão agora é imutável.`
            : `Rascunho "${formTitle}" salvo na API.`);
        } catch (error) {
          setEditorError(error instanceof Error ? error.message : 'Não foi possível salvar o modelo na API.');
          return;
        }
      }

      setIsEditorOpen(
        false
      );
    };

  return (
    <>
      <TopHeader
        title="Modelos de Inspeção"
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
              Modelos & Checklists
            </span>
          </div>
        }
      />

      <main className="p-8 max-w-7xl mx-auto space-y-6">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[80] flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-lg shadow-xl border border-slate-700">
            <CheckCircle2
              size={20}
              className="text-emerald-400"
            />

            <span className="text-sm font-medium">
              {toastMessage}
            </span>

            <button
              type="button"
              onClick={() =>
                setToastMessage(
                  null
                )
              }
              className="ml-3 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <FileText
                className="text-[#0f766e]"
                size={32}
              />

              Modelos de Inspeção
            </h1>

            <p className="text-slate-500 mt-1 text-sm md:text-base">
              Configure checklists,
              seções e itens utilizados
              nas inspeções técnicas de
              campo.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleOpenNewEditor
            }
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f766e] text-white rounded-lg shadow-sm hover:bg-[#115e59] font-bold text-sm transition-colors"
          >
            <Plus size={18} />
            Novo modelo
          </button>
        </section>

        <section className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex gap-3">
          <AlertTriangle
            size={18}
            className="text-amber-600 shrink-0 mt-0.5"
          />

          <div>
            <div className="text-sm font-bold text-amber-900">
              {isApiListAvailable ? 'Consulta pela API habilitada' : 'API de modelos indisponível'}
            </div>

            <p className="text-xs text-amber-800 mt-1 leading-5">
              {isApiListAvailable
                ? 'A listagem e a criação/publicação de novos modelos são persistidas na API. Edição e duplicação de modelos existentes ainda não estão conectadas; versões publicadas permanecem imutáveis.'
                : 'Não foi possível carregar os modelos da API. Os dados demonstrativos são exibidos como referência e não são persistidos.'}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            icon={
              <Layers3
                size={22}
              />
            }
            title="Total de modelos"
            value={
              templates.length
            }
          />

          <MetricCard
            icon={
              <FileCheck
                size={22}
              />
            }
            title="Publicados"
            value={
              publishedCount
            }
          />

          <MetricCard
            icon={
              <Clock size={22} />
            }
            title="Rascunhos"
            value={
              draftCount
            }
          />

          <MetricCard
            icon={
              <ListChecks
                size={22}
              />
            }
            title="Itens de checklist"
            value={
              totalItems
            }
          />
        </section>

        <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col xl:flex-row gap-3 justify-between">
          <div className="flex flex-col md:flex-row flex-1 gap-3">
            <div className="relative flex-1 max-w-xl">
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
                placeholder="Buscar por título, descrição ou ID..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
              />
            </div>

            <select
              value={
                selectedStatus
              }
              onChange={(
                event
              ) =>
                setSelectedStatus(
                  event.target
                    .value as StatusFilter
                )
              }
              className="py-2 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white"
            >
              <option value="ALL">
                Todos os status
              </option>

              <option value="PUBLICADO">
                Publicados
              </option>

              <option value="RASCUNHO">
                Rascunhos
              </option>
            </select>

            <select
              value={
                selectedCategory
              }
              onChange={(
                event
              ) =>
                setSelectedCategory(
                  event.target
                    .value
                )
              }
              className="py-2 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white"
            >
              <option value="ALL">
                Todas as categorias
              </option>

              {allCategories.map(
                (category) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {category}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="flex items-center gap-1 p-1 border border-slate-200 bg-slate-50 rounded-lg self-start">
            <button
              type="button"
              onClick={() =>
                setViewMode(
                  'grid'
                )
              }
              title="Cards"
              className={`p-2 rounded-md ${
                viewMode ===
                'grid'
                  ? 'bg-white shadow-sm text-[#0f766e]'
                  : 'text-slate-500'
              }`}
            >
              <Grid2X2
                size={16}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode(
                  'table'
                )
              }
              title="Tabela"
              className={`p-2 rounded-md ${
                viewMode ===
                'table'
                  ? 'bg-white shadow-sm text-[#0f766e]'
                  : 'text-slate-500'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </section>

        {filteredTemplates.length ===
        0 ? (
          <section className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText
              size={46}
              className="mx-auto text-slate-300 mb-3"
            />

            <h2 className="font-bold text-slate-800">
              Nenhum modelo
              encontrado
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Altere os filtros ou
              crie um novo modelo.
            </p>
          </section>
        ) : viewMode ===
          'grid' ? (
          <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTemplates.map(
              (template) => (
                <TemplateCard
                  key={
                    template.id
                  }
                  template={
                    template
                  }
                  onPreview={() =>
                    setPreviewTemplate(
                      template
                    )
                  }
                  onEdit={() =>
                    handleOpenEdit(
                      template
                    )
                  }
                  onDuplicate={() =>
                    handleDuplicate(
                      template
                    )
                  }
                  onDelete={() =>
                    handleDelete(
                      template
                    )
                  }
                />
              )
            )}
          </section>
        ) : (
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-4">
                      Modelo
                    </th>

                    <th className="px-5 py-4">
                      Categoria
                    </th>

                    <th className="px-5 py-4">
                      Versão
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Itens
                    </th>

                    <th className="px-5 py-4 text-right">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredTemplates.map(
                    (
                      template
                    ) => {
                      const isPublished =
                        template.status ===
                        'PUBLICADO';

                      const itemCount =
                        template.sections.reduce(
                          (
                            total,
                            section
                          ) =>
                            total +
                            section.items
                              .length,
                          0
                        );

                      return (
                        <tr
                          key={
                            template.id
                          }
                          className="hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <div className="font-bold text-sm text-slate-900">
                              {
                                template.title
                              }
                            </div>

                            <div className="text-xs text-slate-500 mt-1 font-mono">
                              {
                                template.id
                              }
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {
                              template.category
                            }
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                            v
                            {
                              template.version
                            }
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={
                                template.status
                              }
                            />
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {
                              itemCount
                            }
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewTemplate(
                                    template
                                  )
                                }
                                className="p-2 text-slate-500 hover:text-[#0f766e] hover:bg-slate-100 rounded"
                                title="Visualizar"
                              >
                                <Eye
                                  size={
                                    16
                                  }
                                />
                              </button>

                              {!isPublished && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenEdit(
                                      template
                                    )
                                  }
                                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                                  title="Editar rascunho"
                                >
                                  <Edit3
                                    size={
                                      16
                                    }
                                  />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDuplicate(
                                    template
                                  )
                                }
                                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                                title="Duplicar como rascunho"
                              >
                                <Copy
                                  size={
                                    16
                                  }
                                />
                              </button>

                              {!isPublished && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      template
                                    )
                                  }
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Excluir rascunho"
                                >
                                  <Trash2
                                    size={
                                      16
                                    }
                                  />
                                </button>
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
          </section>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex gap-3">
            <LockKeyhole
              size={19}
              className="text-[#0f766e] shrink-0 mt-0.5"
            />

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Regra de
                versionamento
              </h3>

              <p className="text-xs text-slate-600 leading-5 mt-1">
                Rascunhos recém-criados
                podem ser publicados.
                Depois da publicação,
                a versão passa a ser
                somente leitura. Edição
                e criação de novas versões
                de modelos existentes
                ainda não estão disponíveis
                neste editor.
              </p>
            </div>
          </div>
        </section>
      </main>

      {previewTemplate && (
        <PreviewModal
          template={
            previewTemplate
          }
          onClose={() =>
            setPreviewTemplate(
              null
            )
          }
          onEdit={() => {
            const target =
              previewTemplate;

            setPreviewTemplate(
              null
            );

            handleOpenEdit(
              target
            );
          }}
          onDuplicate={() => {
            handleDuplicate(
              previewTemplate
            );

            setPreviewTemplate(
              null
            );
          }}
        />
      )}

      {isEditorOpen && (
        <EditorModal
          editingTemplate={
            editingTemplate
          }
          formTitle={
            formTitle
          }
          formDescription={
            formDescription
          }
          formCategory={
            formCategory
          }
          formSections={
            formSections
          }
          editorError={
            editorError
          }
          onClose={() =>
            setIsEditorOpen(
              false
            )
          }
          onTitleChange={
            setFormTitle
          }
          onDescriptionChange={
            setFormDescription
          }
          onCategoryChange={
            setFormCategory
          }
          onAddSection={
            handleAddSection
          }
          onRemoveSection={
            handleRemoveSection
          }
          onSectionTitleChange={
            handleSectionTitleChange
          }
          onAddItem={
            handleAddItem
          }
          onRemoveItem={
            handleRemoveItem
          }
          onUpdateItem={
            updateItem
          }
          onResponseTypeChange={
            handleResponseTypeChange
          }
          onAddOption={
            handleAddOption
          }
          onOptionChange={
            handleOptionChange
          }
          onRemoveOption={
            handleRemoveOption
          }
          onSaveDraft={() =>
            handleSaveEditor(
              'RASCUNHO'
            )
          }
          onPublish={() =>
            handleSaveEditor(
              'PUBLICADO'
            )
          }
        />
      )}
    </>
  );
}

function MetricCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
      <div className="p-3 bg-teal-50 text-[#0f766e] rounded-lg">
        {icon}
      </div>

      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </div>

        <div className="text-2xl font-black text-slate-900">
          {value}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: TemplateStatus;
}) {
  const published =
    status ===
    'PUBLICADO';

  return (
    <span
      className={
        published
          ? 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold'
          : 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold'
      }
    >
      {published ? (
        <FileCheck
          size={12}
        />
      ) : (
        <Clock size={12} />
      )}

      {published
        ? 'PUBLICADO'
        : 'RASCUNHO'}
    </span>
  );
}

function TemplateCard({
  template,
  onPreview,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  template: InspectionTemplate;
  onPreview: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const isPublished =
    template.status ===
    'PUBLICADO';

  const itemCount =
    template.sections.reduce(
      (
        total,
        section
      ) =>
        total +
        section.items.length,
      0
    );

  return (
    <article className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 bg-teal-50 text-[#0f766e] rounded-lg flex items-center justify-center">
            <FileText
              size={20}
            />
          </div>

          <StatusBadge
            status={
              template.status
            }
          />
        </div>

        <h2 className="font-bold text-lg text-slate-900 mt-4 leading-snug">
          {template.title}
        </h2>

        <p className="text-sm text-slate-500 mt-2 leading-6 line-clamp-3">
          {
            template.description
          }
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs px-2.5 py-1 bg-slate-100 rounded-md text-slate-600 font-semibold">
            {
              template.category
            }
          </span>

          <span className="text-xs px-2.5 py-1 bg-slate-100 rounded-md text-slate-600 font-semibold">
            v
            {
              template.version
            }
          </span>

          <span className="text-xs px-2.5 py-1 bg-slate-100 rounded-md text-slate-600 font-semibold">
            {
              template.sections
                .length
            }{' '}
            seções
          </span>

          <span className="text-xs px-2.5 py-1 bg-slate-100 rounded-md text-slate-600 font-semibold">
            {itemCount} itens
          </span>
        </div>

        {isPublished && (
          <div className="mt-4 flex gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-800">
            <LockKeyhole
              size={14}
              className="shrink-0 mt-0.5"
            />

            Versão publicada e
            protegida contra edição.
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button
          type="button"
          onClick={
            onPreview
          }
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f766e] hover:text-[#115e59]"
        >
          <Eye size={15} />
          Visualizar
        </button>

        <div className="flex gap-1">
          {!isPublished && (
            <button
              type="button"
              onClick={
                onEdit
              }
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded"
              title="Editar rascunho"
            >
              <Edit3
                size={15}
              />
            </button>
          )}

          <button
            type="button"
            onClick={
              onDuplicate
            }
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded"
            title="Duplicar como rascunho"
          >
            <Copy size={15} />
          </button>

          {!isPublished && (
            <button
              type="button"
              onClick={
                onDelete
              }
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Excluir rascunho"
            >
              <Trash2
                size={15}
              />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function PreviewModal({
  template,
  onClose,
  onEdit,
  onDuplicate,
}: {
  template: InspectionTemplate;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
}) {
  const published =
    template.status ===
    'PUBLICADO';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 flex items-center justify-center">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <header className="p-5 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText
                size={21}
                className="text-[#0f766e]"
              />

              <h2 className="font-bold text-xl text-slate-900">
                {template.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusBadge
                status={
                  template.status
                }
              />

              <span className="text-xs text-slate-500">
                Versão{' '}
                {
                  template.version
                }
              </span>

              <span className="text-xs text-slate-500">
                {
                  template.category
                }
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full"
          >
            <X size={19} />
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <section>
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500">
              Descrição
            </h3>

            <p className="text-sm text-slate-700 leading-6 mt-2">
              {
                template.description
              }
            </p>
          </section>

          {published && (
            <section className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 flex gap-3">
              <LockKeyhole
                size={18}
                className="text-emerald-700 shrink-0"
              />

              <div>
                <div className="text-sm font-bold text-emerald-900">
                  Versão imutável
                </div>

                <p className="text-xs text-emerald-800 mt-1">
                  Publicado em{' '}
                  {formatDate(
                    template.publishedAt
                  )}
                  {template.publishedBy
                    ? ` por ${template.publishedBy}`
                    : ''}
                  .
                </p>
              </div>
            </section>
          )}

          <div className="space-y-4">
            {template.sections.map(
              (
                section,
                sectionIndex
              ) => (
                <section
                  key={
                    section.id
                  }
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="bg-slate-100 border-b border-slate-200 px-4 py-3">
                    <h3 className="font-bold text-sm text-slate-900">
                      {
                        section.title
                      }
                    </h3>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {section.items.map(
                      (
                        item,
                        itemIndex
                      ) => (
                        <div
                          key={
                            item.id
                          }
                          className="p-4"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex gap-2">
                                <span className="text-xs text-slate-400 font-mono mt-0.5">
                                  {sectionIndex +
                                    1}
                                  .
                                  {itemIndex +
                                    1}
                                </span>

                                <div>
                                  <div className="text-sm font-semibold text-slate-800">
                                    {
                                      item.label
                                    }

                                    {item.required && (
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-semibold text-slate-600">
                                      {
                                        RESPONSE_TYPE_LABELS[
                                          item
                                            .responseType
                                        ]
                                      }
                                    </span>

                                    {item.allowObservation && (
                                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[11px] font-semibold text-blue-700">
                                        Observação
                                      </span>
                                    )}

                                    {item.requireEvidenceOnNonConformity && (
                                      <span className="px-2 py-0.5 rounded bg-amber-50 text-[11px] font-semibold text-amber-700">
                                        Evidência
                                        em NC
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <ResponsePreview
                              item={
                                item
                              }
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>
              )
            )}
          </div>
        </div>

        <footer className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-3">
          <div>
            {published ? (
              <button
                type="button"
                onClick={
                  onDuplicate
                }
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Copy
                  size={15}
                />

                Usar como base para
                novo rascunho
              </button>
            ) : (
              <button
                type="button"
                onClick={
                  onEdit
                }
                className="inline-flex items-center gap-2 px-4 py-2 border border-teal-200 bg-teal-50 rounded-lg text-sm font-semibold text-[#0f766e]"
              >
                <Edit3
                  size={15}
                />

                Editar rascunho
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}

function ResponsePreview({
  item,
}: {
  item: TemplateItem;
}) {
  switch (
    item.responseType
  ) {
    case 'BOOLEAN':
      return (
        <div className="flex gap-1 text-xs">
          <span className="px-2 py-1 border border-emerald-200 bg-emerald-50 rounded text-emerald-700 font-semibold">
            Conforme
          </span>

          <span className="px-2 py-1 border border-slate-200 rounded text-slate-400">
            Não conforme
          </span>
        </div>
      );

    case 'NUMERIC':
      return (
        <div className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-400 text-right">
          0,00
        </div>
      );

    case 'DATE':
      return (
        <div className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-400">
          dd/mm/aaaa
        </div>
      );

    case 'TEXT':
      return (
        <div className="w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-400">
          Resposta...
        </div>
      );

    case 'SINGLE_SELECT':
      return (
        <div className="w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-400">
          Selecionar opção...
        </div>
      );

    case 'MULTI_SELECT':
      return (
        <div className="w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-400">
          Múltiplas opções...
        </div>
      );

    default:
      return null;
  }
}

type EditorModalProps = {
  editingTemplate:
    | InspectionTemplate
    | null;

  formTitle: string;
  formDescription: string;
  formCategory: string;

  formSections:
    TemplateSection[];

  editorError:
    | string
    | null;

  onClose: () => void;

  onTitleChange: (
    value: string
  ) => void;

  onDescriptionChange: (
    value: string
  ) => void;

  onCategoryChange: (
    value: string
  ) => void;

  onAddSection: () => void;

  onRemoveSection: (
    sectionIndex: number
  ) => void;

  onSectionTitleChange: (
    sectionIndex: number,
    value: string
  ) => void;

  onAddItem: (
    sectionIndex: number
  ) => void;

  onRemoveItem: (
    sectionIndex: number,
    itemIndex: number
  ) => void;

  onUpdateItem: (
    sectionIndex: number,
    itemIndex: number,
    updater: (
      item: TemplateItem
    ) => TemplateItem
  ) => void;

  onResponseTypeChange: (
    sectionIndex: number,
    itemIndex: number,
    responseType: ResponseType
  ) => void;

  onAddOption: (
    sectionIndex: number,
    itemIndex: number
  ) => void;

  onOptionChange: (
    sectionIndex: number,
    itemIndex: number,
    optionIndex: number,
    value: string
  ) => void;

  onRemoveOption: (
    sectionIndex: number,
    itemIndex: number,
    optionIndex: number
  ) => void;

  onSaveDraft: () => void;
  onPublish: () => void;
};

function EditorModal({
  editingTemplate,
  formTitle,
  formDescription,
  formCategory,
  formSections,
  editorError,
  onClose,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onAddSection,
  onRemoveSection,
  onSectionTitleChange,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onResponseTypeChange,
  onAddOption,
  onOptionChange,
  onRemoveOption,
  onSaveDraft,
  onPublish,
}: EditorModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 flex items-center justify-center">
      <div className="bg-white w-full max-w-5xl max-h-[94vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <header className="p-5 md:p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText
                size={22}
                className="text-[#0f766e]"
              />

              {editingTemplate
                ? `Editar Rascunho: ${editingTemplate.id}`
                : 'Novo Modelo de Inspeção'}
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Configure as
              informações gerais,
              seções, itens e regras
              de resposta.
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-6">
          {editorError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-700">
              <AlertTriangle
                size={18}
                className="shrink-0 mt-0.5"
              />

              <div>
                <div className="font-bold">
                  Não foi possível
                  continuar
                </div>

                <p className="mt-1 leading-5">
                  {editorError}
                </p>
              </div>
            </div>
          )}

          <section className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              1. Informações do
              modelo
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Título *
              </label>

              <input
                type="text"
                value={
                  formTitle
                }
                onChange={(
                  event
                ) =>
                  onTitleChange(
                    event.target
                      .value
                  )
                }
                placeholder="Ex: Inspeção Preventiva de Geradores"
                className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoria *
                </label>

                <select
                  value={
                    formCategory
                  }
                  onChange={(
                    event
                  ) =>
                    onCategoryChange(
                      event.target
                        .value
                    )
                  }
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white text-sm"
                >
                  {CATEGORIES.map(
                    (
                      category
                    ) => (
                      <option
                        key={
                          category
                        }
                        value={
                          category
                        }
                      >
                        {
                          category
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estado
                </label>

                <div className="h-[38px] px-3 flex items-center border border-amber-200 bg-amber-50 rounded-lg text-xs font-bold text-amber-700">
                  RASCUNHO
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Descrição /
                instruções gerais
              </label>

              <textarea
                rows={3}
                value={
                  formDescription
                }
                onChange={(
                  event
                ) =>
                  onDescriptionChange(
                    event.target
                      .value
                  )
                }
                placeholder="Descreva o objetivo, escopo ou instruções do modelo..."
                className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#10b981]"
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  2. Estrutura do
                  checklist
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  A ordem visual é
                  utilizada como ordem
                  de execução.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  onAddSection
                }
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-50 text-[#0f766e] hover:bg-teal-100 rounded-lg text-xs font-bold"
              >
                <Plus
                  size={14}
                />

                Adicionar seção
              </button>
            </div>

            {formSections.map(
              (
                section,
                sectionIndex
              ) => (
                <div
                  key={
                    section.id
                  }
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center gap-3">
                    <Layers3
                      size={18}
                      className="text-[#0f766e] shrink-0"
                    />

                    <input
                      type="text"
                      value={
                        section.title
                      }
                      onChange={(
                        event
                      ) =>
                        onSectionTitleChange(
                          sectionIndex,
                          event
                            .target
                            .value
                        )
                      }
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-800"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        onRemoveSection(
                          sectionIndex
                        )
                      }
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remover seção"
                    >
                      <Trash2
                        size={16}
                      />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {section.items.map(
                      (
                        item,
                        itemIndex
                      ) => (
                        <ItemEditor
                          key={
                            item.id
                          }
                          item={
                            item
                          }
                          sectionIndex={
                            sectionIndex
                          }
                          itemIndex={
                            itemIndex
                          }
                          onRemove={() =>
                            onRemoveItem(
                              sectionIndex,
                              itemIndex
                            )
                          }
                          onUpdate={(
                            updater
                          ) =>
                            onUpdateItem(
                              sectionIndex,
                              itemIndex,
                              updater
                            )
                          }
                          onResponseTypeChange={(
                            responseType
                          ) =>
                            onResponseTypeChange(
                              sectionIndex,
                              itemIndex,
                              responseType
                            )
                          }
                          onAddOption={() =>
                            onAddOption(
                              sectionIndex,
                              itemIndex
                            )
                          }
                          onOptionChange={(
                            optionIndex,
                            value
                          ) =>
                            onOptionChange(
                              sectionIndex,
                              itemIndex,
                              optionIndex,
                              value
                            )
                          }
                          onRemoveOption={(
                            optionIndex
                          ) =>
                            onRemoveOption(
                              sectionIndex,
                              itemIndex,
                              optionIndex
                            )
                          }
                        />
                      )
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        onAddItem(
                          sectionIndex
                        )
                      }
                      className="w-full border border-dashed border-slate-300 rounded-lg py-2.5 text-xs font-bold text-slate-600 hover:border-teal-300 hover:text-[#0f766e] hover:bg-teal-50"
                    >
                      + Adicionar item à
                      seção
                    </button>
                  </div>
                </div>
              )
            )}
          </section>
        </div>

        <footer className="p-4 md:px-6 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 max-w-xl">
            Publicar valida a estrutura, envia seções e itens à API e torna a versão somente leitura.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={
                onClose
              }
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={
                onSaveDraft
              }
              className="px-4 py-2 bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-lg text-sm font-bold"
            >
              Salvar rascunho
            </button>

            {(!editingTemplate || editingTemplate.status === 'RASCUNHO') && (
              <button
                type="button"
                onClick={
                  onPublish
                }
                className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-sm font-bold"
              >
                <Check
                  size={16}
                />

                Validar e publicar
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function ItemEditor({
  item,
  sectionIndex,
  itemIndex,
  onRemove,
  onUpdate,
  onResponseTypeChange,
  onAddOption,
  onOptionChange,
  onRemoveOption,
}: {
  item: TemplateItem;

  sectionIndex: number;
  itemIndex: number;

  onRemove: () => void;

  onUpdate: (
    updater: (
      item: TemplateItem
    ) => TemplateItem
  ) => void;

  onResponseTypeChange: (
    responseType: ResponseType
  ) => void;

  onAddOption: () => void;

  onOptionChange: (
    optionIndex: number,
    value: string
  ) => void;

  onRemoveOption: (
    optionIndex: number
  ) => void;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
          {sectionIndex + 1}.
          {itemIndex + 1}
        </div>

        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Pergunta /
            verificação *
          </label>

          <input
            type="text"
            value={
              item.label
            }
            onChange={(
              event
            ) =>
              onUpdate(
                (
                  current
                ) => ({
                  ...current,

                  label:
                    event.target
                      .value,
                })
              )
            }
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={
            onRemove
          }
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          title="Remover item"
        >
          <Trash2
            size={16}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Tipo de resposta *
          </label>

          <select
            value={
              item.responseType
            }
            onChange={(
              event
            ) =>
              onResponseTypeChange(
                event.target
                  .value as ResponseType
              )
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            {PUBLISHABLE_RESPONSE_TYPES.map(
              (
                responseType
              ) => (
                <option
                  key={
                    responseType
                  }
                  value={
                    responseType
                  }
                >
                  {
                    RESPONSE_TYPE_LABELS[
                      responseType
                    ]
                  }
                </option>
              )
            )}
          </select>
        </div>

        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={
                item.required
              }
              onChange={(
                event
              ) =>
                onUpdate(
                  (
                    current
                  ) => ({
                    ...current,

                    required:
                      event.target
                        .checked,
                  })
                )
              }
              className="accent-[#0f766e]"
            />

            Resposta obrigatória
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={
                item.allowObservation
              }
              onChange={(
                event
              ) =>
                onUpdate(
                  (
                    current
                  ) => ({
                    ...current,

                    allowObservation:
                      event.target
                        .checked,
                  })
                )
              }
              className="accent-[#0f766e]"
            />

            Permitir observação
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={
                item.requireEvidenceOnNonConformity
              }
              onChange={(
                event
              ) =>
                onUpdate(
                  (
                    current
                  ) => ({
                    ...current,

                    requireEvidenceOnNonConformity:
                      event.target
                        .checked,
                  })
                )
              }
              className="accent-[#0f766e]"
            />

            Exigir evidência em
            não conformidade
          </label>
        </div>
      </div>

      {item.responseType ===
        'SINGLE_SELECT' && (
        <OptionsEditor
          options={
            item.options || []
          }
          onAdd={
            onAddOption
          }
          onChange={
            onOptionChange
          }
          onRemove={
            onRemoveOption
          }
        />
      )}
    </div>
  );
}

function OptionsEditor({
  options,
  onAdd,
  onChange,
  onRemove,
}: {
  options: TemplateOption[];

  onAdd: () => void;

  onChange: (
    optionIndex: number,
    value: string
  ) => void;

  onRemove: (
    optionIndex: number
  ) => void;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-xs font-bold text-slate-700">
            Opções de resposta
          </div>

          <div className="text-[11px] text-slate-500 mt-0.5">
            Mínimo de duas opções
            para publicação.
          </div>
        </div>

        <button
          type="button"
          onClick={
            onAdd
          }
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700"
        >
          <Plus size={13} />
          Opção
        </button>
      </div>

      <div className="space-y-2">
        {options.map(
          (
            option,
            optionIndex
          ) => (
            <div
              key={
                option.id
              }
              className="flex gap-2"
            >
              <div className="w-7 h-9 flex items-center justify-center text-xs font-mono text-slate-400">
                {optionIndex +
                  1}
              </div>

              <input
                type="text"
                value={
                  option.label
                }
                onChange={(
                  event
                ) =>
                  onChange(
                    optionIndex,
                    event.target
                      .value
                  )
                }
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />

              <button
                type="button"
                onClick={() =>
                  onRemove(
                    optionIndex
                  )
                }
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                title="Remover opção"
              >
                <Trash2
                  size={15}
                />
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

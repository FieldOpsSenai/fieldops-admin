import type { TemplateSection } from '@/types';

export function validateTemplateItems(sections: TemplateSection[]): string[] {
  const errors: string[] = [];
  for (const [sectionIndex, section] of sections.entries()) {
    for (const [itemIndex, item] of section.items.entries()) {
      const prefix = `Item ${sectionIndex + 1}.${itemIndex + 1}:`;
      if (!item.label.trim() || item.label.trim().length > 500) {
        errors.push(`${prefix} informe um enunciado com até 500 caracteres.`);
      }
      if (item.responseType === 'MULTI_SELECT') errors.push(`${prefix} seleção múltipla não está disponível.`);
      if (item.responseType === 'SINGLE_SELECT') {
        const options = item.options?.map((option) => option.label.trim()) ?? [];
        if (options.length < 2 || options.some((option) => !option)) {
          errors.push(`${prefix} informe pelo menos duas opções preenchidas.`);
        } else if (new Set(options.map((option) => option.toLocaleLowerCase('pt-BR'))).size !== options.length) {
          errors.push(`${prefix} as opções não podem se repetir.`);
        }
      }
    }
  }
  return errors;
}

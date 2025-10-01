// src/data/templates.ts

import { TemplateConfig, DocType, Company } from '@/types';
import { a6LabsLetterheadTemplate } from '@/templates/letterheads/a6labs/config';
import { a6LabsLetterheadTemplate2 } from '@/templates/letterheads/a6labs/config-template2';

export const allTemplates: TemplateConfig[] = [
  a6LabsLetterheadTemplate,
  a6LabsLetterheadTemplate2,
  // Add more templates here as we create them
];

export function getTemplatesByDocTypeAndCompany(
  docType: DocType,
  company: Company
): TemplateConfig[] {
  return allTemplates.filter(
    (template) => template.docType === docType && template.company === company
  );
}
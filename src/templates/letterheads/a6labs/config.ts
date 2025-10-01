// src/templates/letterheads/a6labs/config.ts

import { TemplateConfig } from '@/types';

export const a6LabsLetterheadTemplate: TemplateConfig = {
  id: 'a6labs-letterhead-1',
  company: 'a6labs',
  docType: 'letterheads',
  name: 'Template 1',
  thumbnail: '/assets/a6labs/template-1-thumb.png', // Updated path
  fields: [
    {
      name: 'date',
      label: 'Date:',
      type: 'date',
      required: true
    },
    {
      name: 'letterTitle',
      label: 'Letter Title:',
      type: 'text',
      placeholder: 'Authorisation Letter for Proposed Account Manager',
      required: true
    },
    {
      name: 'recipient',
      label: 'Recipient:',
      type: 'text',
      placeholder: 'Melanie Knight, Market Development & Partnerships Team, The Gold Standard...',
      required: true
    },
    {
      name: 'senderSignature',
      label: "Sender's signature:",
      type: 'text',
      placeholder: 'Sincerely, Alex Ring. Head Of Operations, A6 Labs.',
      required: true
    },
    {
      name: 'letterText',
      label: 'Letter Text:',
      type: 'textarea',
      placeholder: 'Dear Melanie,\n\nI am writing on behalf of...',
      required: true
    }
  ]
};
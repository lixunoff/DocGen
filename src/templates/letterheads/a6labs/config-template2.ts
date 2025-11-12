// src/templates/letterheads/a6labs/config-template2.ts

import { TemplateConfig } from '@/types';

export const a6LabsLetterheadTemplate2: TemplateConfig = {
  id: 'a6labs-letterhead-2',
  company: 'a6labs',
  docType: 'letterheads',
  name: 'Green BG',
  thumbnail: '/assets/a6labs/template-2-thumb.png',
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
      placeholder: 'Melanie Knight, Market Development & Partnerships Team...',
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
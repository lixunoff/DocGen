// src/templates/letterheads/a6terraviva/config.ts

import { TemplateConfig } from '@/types';

export const a6TerravivaLetterheadTemplate: TemplateConfig = {
  id: 'a6terraviva-letterhead-1',
  name: 'Simple',
  docType: 'letterheads',
  company: 'a6terraviva',
  thumbnail: '/assets/a6terraviva/template-1-thumb.png',
  fields: [
    {
      name: 'date',
      label: 'Date:',
      type: 'date',
      required: true,
    },
    {
      name: 'letterTitle',
      label: 'Letter Title:',
      type: 'text',
      required: true,
      placeholder: 'Letter Subject'
    },
    {
      name: 'recipient',
      label: 'Recipient:',
      type: 'text',
      required: true,
      placeholder: '[Full Name], [Position], [Company]'
    },
    {
      name: 'senderSignature',
      label: "Sender's signature:",
      type: 'text',
      required: true,
      placeholder: 'Sincerely, \nHarib Bakhshi, CEO, A6 Labs. Felix Mechnig-Giordano, General Manager, Terraviva'
    },
    {
      name: 'letterText',
      label: 'Letter Text:',
      type: 'textarea',
      required: true,
      placeholder: 'Dear [Recipient Name],\n\n[Write your letter content here...]'
    }
  ]
};
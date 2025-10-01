// src/types/index.ts

export type DocType = 'letterheads' | 'reports';

export type Company = 'a6labs' | 'reneum' | 'a6terraviva';

export interface CompanyData {
  id: Company;
  name: string;
  address: string;
}

export interface TemplateConfig {
  id: string;
  company: Company;
  docType: DocType;
  name: string;
  thumbnail: string;
  fields: FormField[];
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date';
  placeholder?: string;
  required?: boolean;
}

export interface LetterheadFormData {
  date: string;
  letterTitle: string;
  recipient: string;
  senderSignature: string;
  letterText: string;
}
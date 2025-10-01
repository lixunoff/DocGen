// src/utils/pdf-generator.ts

import { LetterheadFormData } from '@/types';

export async function generateA6LabsLetterheadPDF(
  formData: LetterheadFormData,
  templateId: string
): Promise<Blob> {
  const response = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      formData, 
      templateId,
      shouldMeasure: true
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate PDF');
  }
  
  return await response.blob();
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
// src/components/PDFPreview.tsx

'use client';

import { useState, useEffect } from 'react';

interface PDFPreviewProps {
  formData: Record<string, string>;
  templateId?: string;
  shouldGenerate: boolean;
  onGenerateComplete: () => void;
}

export default function PDFPreview({ 
  formData, 
  templateId = 'a6labs-letterhead-1',
  shouldGenerate,
  onGenerateComplete 
}: PDFPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!shouldGenerate) return;

    const generatePreview = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            formData: {
              date: formData.date || '',
              letterTitle: formData.letterTitle || '',
              recipient: formData.recipient || '',
              senderSignature: formData.senderSignature || '',
              letterText: formData.letterText || ''
            }, 
            templateId,
            shouldMeasure: true
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate preview');
        }
        
        const blob = await response.blob();
        
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
        
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error('Error generating preview:', error);
      } finally {
        setIsLoading(false);
        onGenerateComplete();
      }
    };

    generatePreview();
  }, [shouldGenerate]);

  return (
    <div className="self-stretch flex flex-col h-full w-full">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-gray-400">
          Generating preview...
        </div>
      ) : pdfUrl ? (
        <iframe
          src={`${pdfUrl}#pagemode=none&toolbar=1`}
          className="w-full h-full"
          style={{ border: 'none' }}
          title="PDF Preview"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-gray-400">
          Fill in the form and click "Generate Preview"
        </div>
      )}
    </div>
  );
}
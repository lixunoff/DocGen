// src/app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import CompanySelector from '@/components/CompanySelector';
import TemplateGrid from '@/components/TemplateGrid';
import FormContainer from '@/components/FormContainer';
import PDFPreview from '@/components/PDFPreview';
import { DocType, Company } from '@/types';
import { getTemplatesByDocTypeAndCompany } from '@/data/templates';

export default function Home() {
  const [activeDocType, setActiveDocType] = useState<DocType>('letterheads');
  const [selectedCompany, setSelectedCompany] = useState<Company>('a6labs');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    'a6labs-letterhead-1'
  );
  const [formData, setFormData] = useState<Record<string, string>>({
    date: '',
    letterTitle: 'Letter Subject',
    recipient: '[Full Name], [Position], [Company]',
    senderSignature: 'Sincerely, [Your Full Name]. [Your Position], [Company].',
    letterText: `Dear [Recipient Name],

[Write your letter content here. You can paste formatted text from Word or Google Docs, including bullet points and paragraphs.]`
  });

  const [shouldGeneratePreview, setShouldGeneratePreview] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const availableTemplates = getTemplatesByDocTypeAndCompany(
    activeDocType,
    selectedCompany
  );

  const selectedTemplate = availableTemplates.find(
    (t) => t.id === selectedTemplateId
  );

  // Автогенерация превью при первой загрузке
  useEffect(() => {
    if (isInitialLoad && selectedTemplateId && formData.date) {
      setShouldGeneratePreview(true);
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, selectedTemplateId, formData.date]);

  // Автоматично змінюємо шаблон при зміні компанії або типу документу
  useEffect(() => {
    if (availableTemplates.length > 0) {
      setSelectedTemplateId(availableTemplates[0].id);
    }
  }, [selectedCompany, activeDocType]);

  // Змінюємо дефолтний підпис залежно від компанії
  useEffect(() => {
    if (selectedCompany === 'a6terraviva') {
      setFormData(prev => ({
        ...prev,
        senderSignature: 'Sincerely, Harib Bakhshi, CEO, A6 Labs. Felix Mechnig-Giordano, General Manager, Terraviva'
      }));
    } else if (selectedCompany === 'a6labs') {
      setFormData(prev => ({
        ...prev,
        senderSignature: 'Sincerely, [Your Full Name]. [Your Position], [Company].'
      }));
    }
  }, [selectedCompany]);

  // Автоматично генеруємо PDF при зміні шаблону (але не при першій загрузці)
  useEffect(() => {
    if (!isInitialLoad && selectedTemplateId) {
      setShouldGeneratePreview(true);
    }
  }, [selectedTemplateId, isInitialLoad]);

  const handleGeneratePreview = () => {
    setShouldGeneratePreview(true);
  };

  return (
    <div className="w-full h-screen bg-white flex">
      <style jsx>{`
        .pdf-preview-wrapper {
          width: 36.212vw;
        }
        
        @media (min-width: 1652px) {
          .pdf-preview-wrapper {
            width: 650.04px;
          }
        }
      `}</style>

      <Sidebar
        activeDocType={activeDocType}
        onDocTypeChange={setActiveDocType}
      />

      <div className="flex-1 px-20 py-8 flex flex-col overflow-y-auto scrollbar-hide">
        <div className="pb-8 flex flex-col gap-8">
          <CompanySelector
            selectedCompany={selectedCompany}
            onCompanyChange={setSelectedCompany}
          />

          {selectedTemplate && (
            <>
              <FormContainer
                template={selectedTemplate}
                formData={formData}
                onFormChange={setFormData}
              />
              
              <button
                onClick={handleGeneratePreview}
                className="self-start p-3 bg-emerald-600 rounded-lg shadow-[0px_4px_24px_0px_rgba(10,137,94,0.48)] flex justify-center items-center gap-2 hover:bg-emerald-700 transition-colors whitespace-nowrap"
                >
                <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <div className="text-white text-sm font-bold leading-tight">
                    Generate Preview
                </div>
                </button>
            </>
          )}
        </div>
      </div>

      <div className="h-screen bg-neutral-100 flex">
        <TemplateGrid
          templates={availableTemplates}
          selectedTemplateId={selectedTemplateId}
          onTemplateSelect={setSelectedTemplateId}
        />

        <div className="pdf-preview-wrapper">
          <PDFPreview 
            formData={formData} 
            templateId={selectedTemplateId || undefined}
            shouldGenerate={shouldGeneratePreview}
            onGenerateComplete={() => setShouldGeneratePreview(false)}
          />
        </div>
      </div>
    </div>
  );
}
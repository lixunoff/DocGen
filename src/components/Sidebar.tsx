// src/components/Sidebar.tsx

'use client';

import { DocType } from '@/types';

interface SidebarProps {
  activeDocType: DocType;
  onDocTypeChange: (docType: DocType) => void;
}

export default function Sidebar({ activeDocType, onDocTypeChange }: SidebarProps) {
  return (
    <div className="w-32 self-stretch py-8 bg-green-950 border-r border-black/10 inline-flex flex-col justify-start items-start gap-10">
      <div className="px-6 flex flex-col justify-center items-start gap-6">
        <div className="justify-start text-white text-base font-black font-['Inter'] leading-9">
          DOCGEN
        </div>
      </div>
      <div className="flex flex-col justify-center items-start gap-2">
        <button
          onClick={() => onDocTypeChange('letterheads')}
          className={`self-stretch px-6 py-2 inline-flex justify-center items-center gap-2.5 ${
            activeDocType === 'letterheads' ? 'border-l-4 border-teal-400' : ''
          }`}
        >
          <div
            className={`justify-start text-sm font-bold font-['Inter'] leading-tight ${
              activeDocType === 'letterheads' ? 'text-teal-400' : 'text-white'
            }`}
          >
            Letterheads
          </div>
        </button>
        <button
          onClick={() => onDocTypeChange('reports')}
          className={`self-stretch px-6 py-2 inline-flex justify-start items-center gap-2.5 ${
            activeDocType === 'reports' ? 'border-l-4 border-teal-400' : ''
          }`}
        >
          <div
            className={`justify-start text-sm font-bold font-['Inter'] leading-tight ${
              activeDocType === 'reports' ? 'text-teal-400' : 'text-white'
            }`}
          >
            Reports
          </div>
        </button>
      </div>
    </div>
  );
}
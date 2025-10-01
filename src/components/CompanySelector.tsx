// src/components/CompanySelector.tsx

'use client';

import { Company } from '@/types';
import { companies } from '@/data/companies';
import { useState } from 'react';

interface CompanySelectorProps {
  selectedCompany: Company;
  onCompanyChange: (company: Company) => void;
}

export default function CompanySelector({
  selectedCompany,
  onCompanyChange,
}: CompanySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentCompany = companies.find((c) => c.id === selectedCompany);

  return (
    <div className="relative h-10 inline-flex justify-start items-center gap-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="justify-start text-zinc-800 text-sm font-bold font-['Inter'] leading-tight">
          {currentCompany?.name}
        </div>
        <div className="w-4 h-4 relative overflow-hidden">
          <svg
            className="w-3 h-3 absolute left-[2px] top-[2px]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 12 12"
            strokeWidth="1.5"
          >
            <path d="M3 4.5L6 7.5L9 4.5" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-black/10 z-20 overflow-hidden">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => {
                  onCompanyChange(company.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm font-['Inter'] hover:bg-neutral-100 transition-colors ${
                  company.id === selectedCompany
                    ? 'bg-neutral-50 font-bold text-zinc-800'
                    : 'text-zinc-600'
                }`}
              >
                {company.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
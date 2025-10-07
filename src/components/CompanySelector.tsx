// src/components/CompanySelector.tsx

'use client';

import { Company } from '@/types';
import { companies } from '@/data/companies';

interface CompanySelectorProps {
  selectedCompany: Company;
  onCompanyChange: (company: Company) => void;
}

export default function CompanySelector({
  selectedCompany,
  onCompanyChange,
}: CompanySelectorProps) {
  return (
    <div className="p-1 bg-neutral-100 rounded-lg inline-flex justify-start items-center gap-1">
      {companies.map((company) => (
        <button
          key={company.id}
          onClick={() => onCompanyChange(company.id)}
          className={`px-3 py-1 flex justify-center items-center gap-2.5 ${
            company.id === selectedCompany
              ? 'bg-white rounded-md shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08)]'
              : 'bg-transparent'
          }`}
        >
          <div
            className={`text-zinc-800 text-sm font-bold font-['Inter'] leading-tight transition-opacity ${
              company.id === selectedCompany ? 'opacity-100' : 'opacity-30 hover:opacity-100'
            }`}
          >
            {company.name}
          </div>
        </button>
      ))}
    </div>
  );
}
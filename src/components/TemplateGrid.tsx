// src/components/TemplateGrid.tsx

'use client';

import { TemplateConfig } from '@/types';
import Image from 'next/image';

interface TemplateGridProps {
  templates: TemplateConfig[];
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string) => void;
}

export default function TemplateGrid({
  templates,
  selectedTemplateId,
  onTemplateSelect,
}: TemplateGridProps) {
  return (
    <div className="self-stretch p-6 border-r border-black/10 inline-flex flex-col justify-start items-start gap-4">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onTemplateSelect(template.id)}
          className={`p-2 rounded-lg outline outline-2 outline-offset-[-2px] flex flex-col justify-center items-center gap-2 transition-colors hover:bg-neutral-50 ${
            selectedTemplateId === template.id
              ? 'outline-emerald-600'
              : 'outline-transparent'
          }`}
        >
          <div className="w-[86px] h-[122px] rounded overflow-hidden relative">
            <Image
              src={template.thumbnail}
              alt={template.name}
              width={86}
              height={122}
              className="object-cover w-full h-full"
              unoptimized
            />
          </div>
          <div className="justify-start text-zinc-800 text-xs font-normal font-['Inter'] leading-none">
            {template.name}
          </div>
        </button>
      ))}
    </div>
  );
}
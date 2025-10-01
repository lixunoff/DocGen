import { TemplateConfig } from '@/types';
import { useState, ChangeEvent, useEffect } from 'react';

interface FormContainerProps {
  template: TemplateConfig;
  formData: Record<string, string>;
  onFormChange: (data: Record<string, string>) => void;
}

// Функция для форматирования даты в формат "Wednesday, 1 October 2025"
function formatDate(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = days[date.getDay()];
  const day = date.getDate(); // Без ведущего нуля
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${dayName}, ${day} ${monthName} ${year}`;
}

export default function FormContainer({
  template,
  formData,
  onFormChange,
}: FormContainerProps) {
  const [activeTab, setActiveTab] = useState<'manually' | 'upload'>('manually');

  // Автоматическая подстановка даты при монтировании компонента
  useEffect(() => {
    if (!formData.date) {
      const currentDate = formatDate(new Date());
      onFormChange({
        ...formData,
        date: currentDate,
      });
    }
  }, []); // Пустой массив зависимостей - выполнится только при монтировании

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    onFormChange({
      ...formData,
      [name]: value,
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    
    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    
    if (htmlData) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlData, 'text/html');
      
      let text = '';
      
      const processNode = (node: Node, insideList = false) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const textContent = node.textContent?.trim();
          if (textContent) {
            text += textContent;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const tagName = element.tagName.toLowerCase();
          
          if (tagName === 'li') {
            if (text && !text.endsWith('\n')) {
              text += '\n';
            }
            text += '• ';
            element.childNodes.forEach(child => processNode(child, true));
          } else if (tagName === 'ul' || tagName === 'ol') {
            if (text && !text.endsWith('\n\n')) {
              text += '\n\n';
            }
            element.childNodes.forEach(child => processNode(child, false));
          } else if (tagName === 'p') {
            if (insideList) {
              element.childNodes.forEach(child => processNode(child, insideList));
            } else {
              if (text && !text.endsWith('\n\n')) {
                text += '\n\n';
              }
              element.childNodes.forEach(child => processNode(child, insideList));
            }
          } else if (tagName === 'div') {
            if (insideList) {
              element.childNodes.forEach(child => processNode(child, insideList));
            } else {
              if (text && !text.endsWith('\n\n')) {
                text += '\n\n';
              }
              element.childNodes.forEach(child => processNode(child, insideList));
            }
          } else if (tagName === 'br') {
            text += '\n';
          } else {
            element.childNodes.forEach(child => processNode(child, insideList));
          }
        }
      };
      
      doc.body.childNodes.forEach(node => processNode(node, false));
      text = text.trim().replace(/\n{3,}/g, '\n\n');
      
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const currentValue = target.value;
      const fieldName = target.name;
      
      const newValue = 
        currentValue.substring(0, start) + 
        text + 
        currentValue.substring(end);
      
      onFormChange({
        ...formData,
        [fieldName]: newValue,
      });
      
      setTimeout(() => {
        const newCursorPos = start + text.length;
        target.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      const plainText = clipboardData.getData('text/plain');
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const currentValue = target.value;
      const fieldName = target.name;
      
      const newValue = 
        currentValue.substring(0, start) + 
        plainText + 
        currentValue.substring(end);
      
      onFormChange({
        ...formData,
        [fieldName]: newValue,
      });
      
      setTimeout(() => {
        const newCursorPos = start + plainText.length;
        target.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  return (
    <div className="w-full max-w-[560px] flex flex-col justify-start items-start gap-6">
      <div className="self-stretch justify-start text-zinc-800 text-4xl font-bold font-['Inter'] leading-10">
        Generate Letterhead
      </div>

      <div className="p-1 bg-zinc-800 rounded-lg inline-flex justify-start items-center gap-1">
        <button
          onClick={() => setActiveTab('manually')}
          className={`self-stretch px-3 py-1 rounded-md shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08)] flex justify-center items-center gap-2.5 transition-colors ${
            activeTab === 'manually' ? 'bg-white' : 'bg-transparent'
          }`}
        >
          <div
            className={`justify-start text-sm font-bold font-['Inter'] leading-tight ${
              activeTab === 'manually' ? 'text-zinc-800' : 'text-white opacity-50'
            }`}
          >
            Manually
          </div>
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`self-stretch px-3 py-1 rounded-md shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08)] flex justify-center items-center gap-2.5 transition-colors ${
            activeTab === 'upload' ? 'bg-white' : 'bg-transparent'
          }`}
        >
          <div
            className={`justify-start text-sm font-bold font-['Inter'] leading-tight ${
              activeTab === 'upload' ? 'text-zinc-800' : 'text-white opacity-50'
            }`}
          >
            Upload DOCX
          </div>
        </button>
      </div>

      <div className="self-stretch flex flex-col justify-start items-start gap-6">
        {template.fields.map((field) => (
          <div
            key={field.name}
            className="self-stretch flex flex-col justify-start items-start gap-1"
          >
            <label
              htmlFor={field.name}
              className="self-stretch justify-start text-zinc-800 text-xs font-bold font-['Inter'] leading-none"
            >
              {field.label}
            </label>
            
            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleInputChange}
                onPaste={handlePaste}
                placeholder={field.placeholder}
                required={field.required}
                rows={10}
                className="self-stretch px-3 py-2 bg-neutral-100 rounded-lg outline outline-1 outline-offset-[-1px] outline-black/10 text-stone-500 text-sm font-normal font-['Inter'] leading-tight resize-none focus:outline-emerald-600 focus:bg-white transition-colors scrollbar-hide"
              />
            ) : field.type === 'date' ? (
              <input
                id={field.name}
                name={field.name}
                type="text"
                value={formData[field.name] || ''}
                onChange={handleInputChange}
                placeholder={field.placeholder || formatDate(new Date())}
                required={field.required}
                className="self-stretch px-3 py-2 bg-neutral-100 rounded-lg outline outline-1 outline-offset-[-1px] outline-black/10 text-stone-500 text-sm font-normal font-['Inter'] leading-tight focus:outline-emerald-600 focus:bg-white transition-colors"
              />
            ) : (
              <input
                id={field.name}
                name={field.name}
                type="text"
                value={formData[field.name] || ''}
                onChange={handleInputChange}
                placeholder={field.placeholder}
                required={field.required}
                className="self-stretch px-3 py-2 bg-neutral-100 rounded-lg outline outline-1 outline-offset-[-1px] outline-black/10 text-stone-500 text-sm font-normal font-['Inter'] leading-tight focus:outline-emerald-600 focus:bg-white transition-colors"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
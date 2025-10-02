'use client';

import { TemplateConfig } from '@/types';
import { useState, ChangeEvent, useEffect, useRef } from 'react';
import mammoth from 'mammoth';

interface FormContainerProps {
  template: TemplateConfig;
  formData: Record<string, string>;
  onFormChange: (data: Record<string, string>) => void;
}

function formatDate(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${dayName}, ${day} ${monthName} ${year}`;
}

const defaultFormData = {
  date: '',
  letterTitle: 'Letter Subject',
  recipient: '[Full Name], [Position], [Company]',
  senderSignature: 'Sincerely, [Your Full Name]. [Your Position], [Company].',
  letterText: `Dear [Recipient Name],

[Write your letter content here. You can paste formatted text from Word or Google Docs, including bullet points and paragraphs.]`
};

export default function FormContainer({
  template,
  formData,
  onFormChange,
}: FormContainerProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!formData.date) {
      onFormChange({
        ...formData,
        date: formatDate(new Date()),
      });
    }
  }, []);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    onFormChange({
      ...formData,
      [name]: value,
    });
  };

  const parseDocxHtml = (html: string) => {
    console.log('=== HTML from DOCX ===');
    console.log(html);
    
    const parsedData: Record<string, string> = {
        ...defaultFormData,
        date: formatDate(new Date())
    };
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const allText = doc.body.textContent || '';
    
    const dateMatch = allText.match(/Date:\s*(.+?)(?=Letter Title:|$)/s);
    const titleMatch = allText.match(/Letter Title:\s*(.+?)(?=Recipient:|$)/s);
    const recipientMatch = allText.match(/Recipient:\s*(.+?)(?=Sender'?s signature:|$)/s);
    const signatureMatch = allText.match(/Sender'?s signature:\s*(.+?)(?=Letter Text:|$)/s);
    
    if (dateMatch) parsedData.date = dateMatch[1].trim();
    if (titleMatch) parsedData.letterTitle = titleMatch[1].trim();
    if (recipientMatch) parsedData.recipient = recipientMatch[1].trim();
    if (signatureMatch) parsedData.senderSignature = signatureMatch[1].trim();
    
    const letterTextIndex = allText.indexOf('Letter Text:');
    if (letterTextIndex !== -1) {
        let foundLetterText = false;
        let letterText = '';
        
        const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim() || '';
            if (text.includes('Letter Text:')) {
            foundLetterText = true;
            const afterMarker = text.split('Letter Text:')[1];
            if (afterMarker?.trim()) {
                letterText += afterMarker.trim();
            }
            } else if (foundLetterText && text) {
            letterText += text;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            
            if (foundLetterText) {
            if (element.tagName === 'UL' || element.tagName === 'OL') {
                if (letterText && !letterText.endsWith('\n\n')) {
                letterText += '\n\n';
                }
                element.querySelectorAll('li').forEach(li => {
                letterText += '• ' + (li.textContent?.trim() || '') + '\n';
                });
                letterText += '\n';
            } else if (element.tagName === 'P') {
                if (letterText && !letterText.endsWith('\n\n')) {
                letterText += '\n\n';
                }
                element.childNodes.forEach(child => processNode(child));
            } else if (element.tagName === 'BR') {
                letterText += '\n';
            } else {
                element.childNodes.forEach(child => processNode(child));
            }
            } else {
            element.childNodes.forEach(child => processNode(child));
            }
        }
        };
        
        doc.body.childNodes.forEach(node => processNode(node));
        
        if (letterText.trim()) {
        parsedData.letterText = letterText
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        }
    }
    
    console.log('=== PARSED DATA ===');
    console.log(parsedData);
    
    return parsedData;
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert('Please upload a DOCX file');
      return;
    }

    setUploadedFile(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh"
          ]
        }
      );
      
      console.log('Extracted HTML:', result.value);
      
      const parsedData = parseDocxHtml(result.value);
      
      console.log('Parsed data:', parsedData);
      
      onFormChange({
        ...formData,
        ...parsedData,
      });
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      alert('Failed to parse DOCX file');
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    onFormChange({
      ...defaultFormData,
      date: formatDate(new Date()),
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

      <div className="self-stretch text-neutral-600 text-sm font-normal font-['Inter'] leading-tight">
        Fill in the letter details manually in the form below, or upload a DOCX file and we'll extract the information automatically.
      </div>

      <div className="self-stretch flex items-center justify-between">
        <label className="cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="py-2.5 bg-white rounded-lg hover:opacity-50 flex items-center gap-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="#059669" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-emerald-600 text-sm font-bold">Upload DOCX File</span>
          </div>
        </label>
        
        {uploadedFile && (
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg border border-neutral-200">
            <span className="text-xs text-neutral-500 font-medium">Uploaded file:</span>
            <span className="text-sm text-neutral-900">{uploadedFile.name}</span>
            <button
              onClick={handleRemoveFile}
              className="ml-1 text-red-500 hover:text-red-700 transition-colors"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
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
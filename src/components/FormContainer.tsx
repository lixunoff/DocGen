'use client';

import { TemplateConfig } from '@/types';
import { useState, ChangeEvent, useEffect, useRef } from 'react';
import mammoth from 'mammoth';
import RichTextEditor from './RichTextEditor';

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
  date: formatDate(new Date()),
  letterTitle: 'Letter Subject',
  recipient: '[Full Name], [Position], [Company]',
  senderSignature: 'Sincerely, [Your Full Name]. [Your Position], [Company].',
  letterText: `<p>Dear [Recipient Name],</p><p>[Write your letter content here. You can paste formatted text from Word or Google Docs, including bullet points and paragraphs.]</p>`
};

export default function FormContainer({
  template,
  formData,
  onFormChange,
}: FormContainerProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isTitleBold, setIsTitleBold] = useState(false);
  const [isSignatureVisible, setIsSignatureVisible] = useState(true);
  const [showStamps, setShowStamps] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('🔄 FormContainer mounted, formData.date:', formData.date);
    console.log('🎭 Current showStamps in formData:', formData.showStamps);
    
    // Відновлюємо стан showStamps зі збережених даних
    if (formData.showStamps === 'false') {
      setShowStamps(false);
    } else if (formData.showStamps === 'true') {
      setShowStamps(true);
    }
    
    if (!formData.date) {
      console.log('⚠️ No date found, setting default date');
      const newDate = formatDate(new Date());
      console.log('📅 Setting date to:', newDate);
      onFormChange({
        ...formData,
        date: newDate,
        showStamps: formData.showStamps || 'true' // Зберігаємо існуючий стан або дефолтний
      });
    } else if (!formData.showStamps) {
      // Якщо дата є, але showStamps не встановлено - встановлюємо дефолтний
      onFormChange({
        ...formData,
        showStamps: 'true'
      });
    }
    
    // Перевіряємо чи заголовок містить <strong>
    if (formData.letterTitle) {
      setIsTitleBold(formData.letterTitle.includes('<strong>'));
    }
  }, []);

  // Функція для перемикання bold стилю заголовка
  const toggleTitleBold = () => {
    const currentTitle = formData.letterTitle || 'Letter Subject';
    let newTitle: string;
    
    if (isTitleBold) {
      // Видаляємо <strong> теги
      newTitle = currentTitle.replace(/<\/?strong>/g, '');
    } else {
      // Додаємо <strong> теги
      const plainTitle = currentTitle.replace(/<\/?strong>/g, '');
      newTitle = `<strong>${plainTitle}</strong>`;
    }
    
    setIsTitleBold(!isTitleBold);
    onFormChange({
      ...formData,
      date: formData.date || formatDate(new Date()), // Переконуємось що дата присутня
      letterTitle: newTitle,
    });
  };

  // Функція для перемикання видимості підпису
  const toggleSignatureVisibility = () => {
    const newVisibility = !isSignatureVisible;
    setIsSignatureVisible(newVisibility);
    
    if (newVisibility) {
      // Сіра кнопка - підпис ПОКАЗУЄТЬСЯ (нормальна робота)
      onFormChange({
        ...formData,
        date: formData.date || formatDate(new Date()),
        senderSignature: formData.senderSignature === '___HIDE_SIGNATURE___' 
          ? 'Sincerely, [Your Full Name]. [Your Position], [Company].'
          : formData.senderSignature
      });
    } else {
      // Зелена кнопка - підпис ХОВАЄТЬСЯ
      onFormChange({
        ...formData,
        date: formData.date || formatDate(new Date()),
        senderSignature: '___HIDE_SIGNATURE___'
      });
    }
  };

  // Функція для перемикання показу печаток
  const toggleStamps = () => {
    const newShowStamps = !showStamps;
    console.log('🎭 Toggle stamps:', { from: showStamps, to: newShowStamps });
    setShowStamps(newShowStamps);
    
    // Передаємо стан печаток через спеціальне поле
    const updatedFormData = {
      ...formData,
      date: formData.date || formatDate(new Date()),
      showStamps: newShowStamps ? 'true' : 'false'
    };
    console.log('📤 Sending formData with showStamps:', updatedFormData.showStamps);
    onFormChange(updatedFormData);
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Для letterTitle зберігаємо bold стан
    if (name === 'letterTitle') {
      const newValue = isTitleBold ? `<strong>${value}</strong>` : value;
      onFormChange({
        ...formData,
        date: formData.date || formatDate(new Date()), // Переконуємось що дата присутня
        [name]: newValue,
      });
    } else {
      onFormChange({
        ...formData,
        date: formData.date || formatDate(new Date()), // Переконуємось що дата присутня
        [name]: value,
      });
    }
  };

  // Handle Rich Text Editor changes
  const handleRichTextChange = (fieldName: string, value: string) => {
    onFormChange({
      ...formData,
      [fieldName]: value,
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
    
    // Шукаємо Letter Text: в HTML
    const letterTextIndex = allText.indexOf('Letter Text:');
    if (letterTextIndex !== -1) {
        console.log('📝 Found "Letter Text:" marker');
        
        // Знаходимо всі елементи після "Letter Text:"
        let foundMarker = false;
        const collectedElements: HTMLElement[] = [];
        
        const findElements = (node: Node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent?.includes('Letter Text:')) {
              foundMarker = true;
              console.log('✅ Marker found in text node');
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            
            if (foundMarker) {
              // Після маркера - збираємо всі P, UL, OL елементи
              if (['P', 'UL', 'OL', 'H1', 'H2', 'H3'].includes(element.tagName)) {
                collectedElements.push(element);
                console.log(`📦 Collected ${element.tagName}:`, element.outerHTML.substring(0, 100));
              }
            }
            
            // Рекурсивно обходимо дітей
            element.childNodes.forEach(child => findElements(child));
          }
        };
        
        doc.body.childNodes.forEach(node => findElements(node));
        
        console.log(`📊 Total collected elements: ${collectedElements.length}`);
        
        // Конвертуємо зібрані елементи в HTML
        // ВАЖЛИВО: НЕ додаємо автоматичні відступи, mammoth вже їх обробив
        let letterTextHtml = '';
        collectedElements.forEach(element => {
          if (element.tagName === 'P') {
            const innerHTML = element.innerHTML.trim();
            if (innerHTML && !innerHTML.includes('Letter Text:')) {
              letterTextHtml += `<p>${innerHTML}</p>`;
            } else if (!innerHTML) {
              // Порожній параграф з mammoth = відступ
              letterTextHtml += '<p><br></p>';
            }
          } else if (element.tagName === 'UL') {
            letterTextHtml += `<ul>`;
            element.querySelectorAll('li').forEach(li => {
              letterTextHtml += `<li>${li.innerHTML}</li>`;
            });
            letterTextHtml += `</ul>`;
          } else if (element.tagName === 'OL') {
            letterTextHtml += `<ol>`;
            element.querySelectorAll('li').forEach(li => {
              letterTextHtml += `<li>${li.innerHTML}</li>`;
            });
            letterTextHtml += `</ol>`;
          } else if (['H1', 'H2', 'H3'].includes(element.tagName)) {
            const innerHTML = element.innerHTML.trim();
            if (innerHTML) {
              letterTextHtml += `<${element.tagName.toLowerCase()}>${innerHTML}</${element.tagName.toLowerCase()}>`;
            }
          }
        });
        
        if (letterTextHtml.trim()) {
          parsedData.letterText = letterTextHtml.trim();
          console.log('✅ Letter text parsed successfully');
          console.log('📄 Result HTML:', letterTextHtml.substring(0, 200));
        } else {
          console.log('⚠️ No letter text content found');
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
      
      console.log('=== RAW HTML FROM MAMMOTH ===');
      console.log(result.value);
      
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
            
            {field.type === 'textarea' && field.name === 'letterText' ? (
              <div className="self-stretch">
                <RichTextEditor
                  value={formData[field.name] || defaultFormData.letterText}
                  onChange={(value) => handleRichTextChange(field.name, value)}
                  placeholder={field.placeholder}
                />
              </div>
            ) : field.type === 'textarea' ? (
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
            ) : field.name === 'letterTitle' ? (
              <div className="self-stretch flex items-stretch gap-2">
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={(formData[field.name] || '').replace(/<\/?strong>/g, '')}
                  onChange={handleInputChange}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="flex-1 px-3 py-2 bg-neutral-100 rounded-lg outline outline-1 outline-offset-[-1px] outline-black/10 text-stone-500 text-sm font-normal font-['Inter'] leading-tight focus:outline-emerald-600 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={toggleTitleBold}
                  className={`w-10 px-3 py-2 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                    isTitleBold 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                  }`}
                  title={isTitleBold ? 'Remove bold' : 'Make bold'}
                >
                  <span className="text-base font-bold">B</span>
                </button>
              </div>
            ) : field.name === 'senderSignature' ? (
              <div className="self-stretch flex items-stretch gap-2">
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={formData[field.name] === '___HIDE_SIGNATURE___' ? '' : (formData[field.name] || '')}
                  onChange={handleInputChange}
                  placeholder={field.placeholder}
                  required={field.required}
                  disabled={!isSignatureVisible}
                  className={`flex-1 px-3 py-2 rounded-lg outline outline-1 outline-offset-[-1px] outline-black/10 text-sm font-normal font-['Inter'] leading-tight transition-colors ${
                    isSignatureVisible
                      ? 'bg-neutral-100 text-stone-500 focus:outline-emerald-600 focus:bg-white'
                      : 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
                  }`}
                />
                <button
                  type="button"
                  onClick={toggleSignatureVisibility}
                  className={`w-10 px-3 py-2 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                    !isSignatureVisible 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                  }`}
                  title={isSignatureVisible ? 'Hide signature' : 'Show signature'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
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

        {/* Toggle для показу печаток */}
        <div className="self-stretch flex items-center justify-between py-3 border-t border-gray-200">
          <label className="text-sm font-medium text-gray-700">
            Show stamps
          </label>
          <button
            type="button"
            onClick={toggleStamps}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showStamps ? 'bg-emerald-600' : 'bg-gray-200'
            }`}
            title={showStamps ? 'Stamps visible' : 'Stamps hidden'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showStamps ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
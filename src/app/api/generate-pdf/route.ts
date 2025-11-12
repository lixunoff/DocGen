// src/app/api/generate-pdf/route.ts

import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import * as a6labsTemplate1 from '@/templates/letterheads/a6labs/template1';
import * as a6terravivaTemplate1 from '@/templates/letterheads/a6terraviva/template1';

interface FormData {
  date: string;
  letterTitle: string;
  recipient: string;
  senderSignature: string;
  letterText: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      formData, 
      templateId,
      shouldMeasure = true
    }: { 
      formData: FormData; 
      templateId: string;
      shouldMeasure?: boolean;
    } = await request.json();
    
    console.log('📥 Received formData:', {
      date: formData.date,
      letterTitle: formData.letterTitle?.substring(0, 50),
      hasRecipient: !!formData.recipient,
      hasSignature: !!formData.senderSignature,
      letterTextLength: formData.letterText?.length || 0
    });
    
    // Fallback для дати якщо вона порожня
    if (!formData.date || formData.date.trim() === '') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
      const now = new Date();
      const dayName = days[now.getDay()];
      const day = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      formData.date = `${dayName}, ${day} ${monthName} ${year}`;
      console.log('⚠️ No date provided, using default:', formData.date);
    }
    
    // Fallback для letterText якщо він порожній
    if (!formData.letterText || formData.letterText.trim() === '') {
      formData.letterText = `<p>Dear [Recipient Name],</p><p>[Write your letter content here. You can paste formatted text from Word or Google Docs, including bullet points and paragraphs.]</p>`;
      console.log('⚠️ No letterText provided, using default');
    }
    
    // Fallback для інших полів
    if (!formData.letterTitle || formData.letterTitle.trim() === '') {
      formData.letterTitle = 'Letter Subject';
      console.log('⚠️ No letterTitle provided, using default');
    }
    
    if (!formData.recipient || formData.recipient.trim() === '') {
      formData.recipient = '[Full Name], [Position], [Company]';
      console.log('⚠️ No recipient provided, using default');
    }
    
    if (!formData.senderSignature || formData.senderSignature.trim() === '') {
      formData.senderSignature = 'Sincerely, [Your Full Name]. [Your Position], [Company].';
      console.log('⚠️ No senderSignature provided, using default');
    }
    
    let textPages: string[];
    
    if (shouldMeasure) {
      // Для a6terraviva template:
      // Перша сторінка: 31 рядок (465pt / 15pt)
      // Інші сторінки: 34 рядки (510pt / 15pt)
      
      // Для a6labs template:
      // Перша сторінка: 34 рядки (513pt / 15pt)
      // Інші сторінки: 38 рядків (580pt / 15pt)
      
      let firstPageHeight = 513;
      let otherPageHeight = 580;
      
      if (templateId === 'a6terraviva-letterhead-1') {
        firstPageHeight = 465;
        otherPageHeight = 510;
      }
      
      textPages = await splitTextByHeight(
        formData.letterText,
        firstPageHeight,
        otherPageHeight,
        templateId
      );
      console.log('📄 Розбито на', textPages.length, 'сторінок');
    } else {
      textPages = [formData.letterText];
    }
    
    let template;
    if (templateId === 'a6labs-letterhead-1' || templateId === 'a6labs-letterhead-2') {
      template = a6labsTemplate1;
    } else if (templateId === 'a6terraviva-letterhead-1') {
      template = a6terravivaTemplate1;
    } else {
      throw new Error(`Unknown template: ${templateId}`);
    }
    
    const html = generateMultiPageHTML(formData, textPages, template);
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    
    await browser.close();
    
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${formData.letterTitle || 'document'}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

/**
 * Очищення HTML від Quill артефактів
 */
function cleanQuillHTML(html: string): string {
  let cleaned = html;
  
  // Видаляємо Quill UI spans
  cleaned = cleaned.replace(/<span class="ql-ui"[^>]*><\/span>/g, '');
  
  // НЕ видаляємо порожні параграфи <p><br></p> - вони створюють відступи!
  // Видаляємо тільки зовсім порожні (без <br>)
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
  
  // Нормалізуємо whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  return cleaned.trim();
}

/**
 * Розумний split тексту на слова з врахуванням HTML тегів
 * Не розриває теги форматування
 */
function smartSplit(text: string): string[] {
  const words: string[] = [];
  let currentWord = '';
  let depth = 0; // Глибина вкладеності тегів
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '<') {
      depth++;
      currentWord += char;
    } else if (char === '>') {
      depth--;
      currentWord += char;
    } else if (char === ' ' && depth === 0) {
      // Пробіл поза тегами - завершуємо слово
      if (currentWord.trim()) {
        words.push(currentWord);
      }
      currentWord = '';
    } else {
      currentWord += char;
    }
  }
  
  // Додаємо останнє слово
  if (currentWord.trim()) {
    words.push(currentWord);
  }
  
  return words;
}

/**
 * Витягуємо параграфи та списки з HTML
 * Quill 2.0 створює <li data-list="ordered"> або <li data-list="bullet">
 */
function htmlToPlainText(html: string): string {
  const elements: string[] = [];
  
  // Quill 2.0: <li data-list="ordered">Text</li> → <ol><li>Text</li></ol>
  // Quill 2.0: <li data-list="bullet">Text</li> → <ul><li>Text</li></ul>
  
  let processedHTML = html;
  
  // ВАЖЛИВО: Спочатку обробляємо bullet, потім ordered, щоб не змішувати
  
  // 1. Групуємо послідовні <li data-list="bullet"> в <ul>
  processedHTML = processedHTML.replace(
    /(<li[^>]*data-list="bullet"[^>]*>[\s\S]*?<\/li>\s*)+/g,
    (match) => {
      const items = match.match(/<li[^>]*data-list="bullet"[^>]*>[\s\S]*?<\/li>/g) || [];
      const cleanedItems = items.map(item => {
        let cleaned = item;
        // Видаляємо data-list атрибут
        cleaned = cleaned.replace(/\s*data-list="bullet"\s*/g, '');
        // Видаляємо всі вкладені ol/ul теги
        cleaned = cleaned.replace(/<\/?ol[^>]*>/g, '');
        cleaned = cleaned.replace(/<\/?ul[^>]*>/g, '');
        // Нормалізуємо <li> тег
        cleaned = cleaned.replace(/<li[^>]*>/, '<li>').trim();
        return cleaned;
      }).join('');
      return `<ul>${cleanedItems}</ul>`;
    }
  );
  
  // 2. Групуємо послідовні <li data-list="ordered"> в <ol>
  processedHTML = processedHTML.replace(
    /(<li[^>]*data-list="ordered"[^>]*>[\s\S]*?<\/li>\s*)+/g,
    (match) => {
      const items = match.match(/<li[^>]*data-list="ordered"[^>]*>[\s\S]*?<\/li>/g) || [];
      const cleanedItems = items.map(item => {
        let cleaned = item;
        // Видаляємо data-list атрибут
        cleaned = cleaned.replace(/\s*data-list="ordered"\s*/g, '');
        // Видаляємо всі вкладені ol/ul теги
        cleaned = cleaned.replace(/<\/?ol[^>]*>/g, '');
        cleaned = cleaned.replace(/<\/?ul[^>]*>/g, '');
        // Нормалізуємо <li> тег
        cleaned = cleaned.replace(/<li[^>]*>/, '<li>').trim();
        return cleaned;
      }).join('');
      return `<ol>${cleanedItems}</ol>`;
    }
  );
  
  // Додаткова очистка - видаляємо вкладені ol/ul якщо залишились
  processedHTML = processedHTML.replace(/<ol>\s*<ul>/g, '<ul>');
  processedHTML = processedHTML.replace(/<\/ul>\s*<\/ol>/g, '</ul>');
  processedHTML = processedHTML.replace(/<ul>\s*<ol>/g, '<ol>');
  processedHTML = processedHTML.replace(/<\/ol>\s*<\/ul>/g, '</ol>');
  
  // Тепер обробляємо стандартним способом
  let position = 0;
  const htmlLength = processedHTML.length;
  
  while (position < htmlLength) {
    // Шукаємо наступний тег
    const pMatch = processedHTML.substring(position).match(/^<p[^>]*>(.*?)<\/p>/s);
    const olMatch = processedHTML.substring(position).match(/^<ol[^>]*>(.*?)<\/ol>/s);
    const ulMatch = processedHTML.substring(position).match(/^<ul[^>]*>(.*?)<\/ul>/s);
    
    if (pMatch) {
      // Параграф
      let content = pMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<span[^>]*>(.*?)<\/span>/gi, '$1')
        .trim();
      
      elements.push(content);
      position += pMatch[0].length;
    } else if (olMatch) {
      // Нумерований список - зберігаємо як HTML
      elements.push('###OL_START###' + olMatch[0] + '###OL_END###');
      position += olMatch[0].length;
    } else if (ulMatch) {
      // Ненумерований список - зберігаємо як HTML
      elements.push('###UL_START###' + ulMatch[0] + '###UL_END###');
      position += ulMatch[0].length;
    } else {
      // Пропускаємо один символ якщо нічого не знайшли
      position++;
    }
  }
  
  // Об'єднуємо елементи через подвійний перенос
  return elements.join('\n\n').trim();
}

/**
 * Розбиваємо текст на сторінки
 * Один Enter = просто новий рядок (<br>)
 * Два Enter = новий абзац з відступом (порожній <p>)
 */
async function splitTextByHeight(
  html: string,
  firstPageMaxHeight: number,
  otherPageMaxHeight: number,
  templateId: string
): Promise<string[]> {
  const LINE_HEIGHT_PX = 15;
  
  const FIRST_PAGE_MAX_LINES = Math.floor(firstPageMaxHeight / LINE_HEIGHT_PX);
  const OTHER_PAGE_MAX_LINES = Math.floor(otherPageMaxHeight / LINE_HEIGHT_PX);
  
  console.log('📏 Перша сторінка: максимум', FIRST_PAGE_MAX_LINES, 'рядків');
  console.log('📏 Інші сторінки: максимум', OTHER_PAGE_MAX_LINES, 'рядків');
  
  // Очищаємо HTML
  const cleanedHTML = cleanQuillHTML(html);
  
  // Конвертуємо в plain text
  const plainText = htmlToPlainText(cleanedHTML);
  console.log('📝 Plain text:', plainText.substring(0, 200) + '...');
  
  // Ініціалізуємо Puppeteer для вимірювань
  const puppeteer = require('puppeteer');
  
  let templateModule;
  if (templateId === 'a6terraviva-letterhead-1') {
    templateModule = require('@/templates/letterheads/a6terraviva/template1');
  } else {
    templateModule = require('@/templates/letterheads/a6labs/template1');
  }
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
    
  const page = await browser.newPage();
  
  const testHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>${templateModule.getStyles()}</style>
    </head>
    <body>
      ${templateModule.generateFirstPage({
        date: 'Test',
        letterTitle: 'Test',
        recipient: 'Test',
        letterText: 'Test'
      }, 1, 1)}
    </body>
    </html>
  `;
  
  await page.setContent(testHTML, { waitUntil: 'networkidle0' });
  
  // Розбиваємо на абзаци (кожен <p> = окремий абзац)
  // Подвійний \n\n тому що htmlToPlainText об'єднує через join('\n\n')
  const paragraphs = plainText
    .split('\n\n')
    .map(p => p.trim());
    // НЕ фільтруємо порожні! Вони означають відступ (користувач натиснув Enter двічі)
  
  console.log('📋 Знайдено абзаців:', paragraphs.length);
  console.log('📝 Перші 10 абзаців:', paragraphs.slice(0, 10).map((p, i) => 
    `${i+1}. ${p.substring(0, 80)}${p.length > 80 ? '...' : ''}`
  ).join('\n'));
  
  const pages: string[] = [];
  let currentPageHTML = '';
  let currentLineCount = 0;
  let pageIndex = 0;
  let isFirstParagraphOnPage = true;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    
    const maxLines = pageIndex === 0 ? FIRST_PAGE_MAX_LINES : OTHER_PAGE_MAX_LINES;
    
    // Якщо параграф порожній - це відступ (порожній <p><br></p>)
    if (!paragraph || paragraph.trim().length === 0) {
      // Додаємо порожній параграф якщо вміщується
      if (currentLineCount + 1 <= maxLines) {
        currentPageHTML += '<p><br></p>';
        currentLineCount += 1;
        isFirstParagraphOnPage = false;
        console.log(`  ➕ Додано порожній параграф (відступ) (${currentLineCount}/${maxLines})`);
      } else {
        // Не вміщується - нова сторінка
        if (currentPageHTML.trim()) {
          pages.push(currentPageHTML.trim());
          console.log(`  📄 Сторінка ${pageIndex + 1} завершена`);
          pageIndex++;
        }
        currentPageHTML = '<p><br></p>';
        currentLineCount = 1;
        isFirstParagraphOnPage = false;
      }
      continue;
    }
    
    // Перевіряємо чи це список
    if (paragraph.startsWith('###OL_START###') || paragraph.startsWith('###UL_START###')) {
      // Це список - витягуємо HTML
      let listHTML = '';
      let listType = '';
      if (paragraph.startsWith('###OL_START###')) {
        listHTML = paragraph.replace(/^###OL_START###/, '').replace(/###OL_END###$/, '');
        listType = 'ol';
      } else {
        listHTML = paragraph.replace(/^###UL_START###/, '').replace(/###UL_END###$/, '');
        listType = 'ul';
      }
      
      // Витягуємо всі <li> елементи
      const liMatches = listHTML.match(/<li[^>]*>(.*?)<\/li>/gs);
      
      if (!liMatches || liMatches.length === 0) {
        continue;
      }
      
      console.log(`📋 Список (${listType}) з ${liMatches.length} елементів`);
      console.log(`  HTML preview: ${listHTML.substring(0, 150)}...`);
      
      // Обробляємо кожен елемент списку окремо
      let currentListHTML = '';
      let itemsOnCurrentPage = 0;
      let totalItemsProcessed = 0;  // Лічильник всіх оброблених елементів
      
      for (let liIndex = 0; liIndex < liMatches.length; liIndex++) {
        const liHTML = liMatches[liIndex];
        const liContent = liHTML.replace(/<\/?li[^>]*>/g, '').trim();
        
        // Розбиваємо на слова для вимірювання
        const words = smartSplit(liContent);
        let currentLine = '';
        let lineCount = 0;
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          
          const fits = await page.evaluate(
            ({ text }: { text: string }) => {
              const container = document.querySelector('.letter-text');
              if (!container) return false;
              
              const testSpan = document.createElement('span');
              testSpan.style.visibility = 'hidden';
              testSpan.style.position = 'absolute';
              testSpan.style.whiteSpace = 'nowrap';
              testSpan.innerHTML = text;
              
              container.appendChild(testSpan);
              const width = testSpan.getBoundingClientRect().width;
              // Враховуємо padding від списків (15-20pt)
              const containerWidth = container.getBoundingClientRect().width - 25;
              container.removeChild(testSpan);
              
              return width <= containerWidth;
            },
            { text: testLine }
          );
          
          if (fits) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lineCount++;
            }
            currentLine = word;
          }
        }
        
        if (currentLine) {
          lineCount++;
        }
        
        console.log(`  Елемент ${liIndex + 1}: ${lineCount} рядків`);
        
        // Перевіряємо чи вміщується цей елемент на поточній сторінці
        if (currentLineCount + lineCount <= maxLines) {
          // Вміщується - додаємо до поточного списку
          currentListHTML += liHTML;
          currentLineCount += lineCount;
          itemsOnCurrentPage++;
          totalItemsProcessed++;
          console.log(`    ✅ Додано (${currentLineCount}/${maxLines})`);
        } else {
          // Не вміщується - завершуємо поточний список і починаємо новий
          
          if (itemsOnCurrentPage > 0) {
            // Закриваємо поточний список на цій сторінці
            // Для першого списку не додаємо start атрибут
            if (totalItemsProcessed === 0) {
              currentPageHTML += `<${listType}>${currentListHTML}</${listType}>`;
            } else {
              // Для продовження списку додаємо start атрибут
              const startNumber = totalItemsProcessed - itemsOnCurrentPage + 1;
              if (listType === 'ol') {
                currentPageHTML += `<${listType} start="${startNumber}">${currentListHTML}</${listType}>`;
              } else {
                currentPageHTML += `<${listType}>${currentListHTML}</${listType}>`;
              }
            }
            console.log(`    📄 Завершено список з ${itemsOnCurrentPage} елементів`);
          }
          
          // Зберігаємо сторінку
          if (currentPageHTML.trim()) {
            pages.push(currentPageHTML.trim());
            console.log(`  📄 Сторінка ${pageIndex + 1} завершена (${currentLineCount} рядків)`);
            pageIndex++;
          }
          
          // Починаємо новий список на новій сторінці
          currentPageHTML = '';
          currentListHTML = liHTML;
          currentLineCount = lineCount;
          itemsOnCurrentPage = 1;
          totalItemsProcessed++;
          isFirstParagraphOnPage = false;
          console.log(`  📄 Новий список на сторінці ${pageIndex + 1} (start=${totalItemsProcessed})`);
        }
      }
      
      // Закриваємо список після обробки всіх елементів
      if (itemsOnCurrentPage > 0) {
        // Додаємо start атрибут якщо це продовження списку
        const startNumber = totalItemsProcessed - itemsOnCurrentPage + 1;
        if (listType === 'ol' && startNumber > 1) {
          currentPageHTML += `<${listType} start="${startNumber}">${currentListHTML}</${listType}>`;
        } else {
          currentPageHTML += `<${listType}>${currentListHTML}</${listType}>`;
        }
        isFirstParagraphOnPage = false;
        console.log(`  ✅ Список завершено (${itemsOnCurrentPage} елементів, start=${startNumber}, ${currentLineCount}/${maxLines})`);
      }
      
      continue;
    }
    
    // Розбиваємо абзац на рядки (одинарний Enter = <br>)
    const lines = paragraph.split('\n');
    
    console.log(`📄 Елемент ${i + 1}: ${lines.length} рядків`);
    
    let paragraphHTML = '';
    let isFirstLineInParagraph = true;
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      let line = lines[lineIndex].trim();
      if (!line) continue;
      
      const isLastLine = lineIndex === lines.length - 1;
      
      // Розбиваємо рядок на візуальні рядки (по словах з врахуванням ширини)
      // Використовуємо smartSplit щоб не розривати теги форматування
      const words = smartSplit(line);
      const visualLines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        
        const fits = await page.evaluate(
          ({ text }: { text: string }) => {
            const container = document.querySelector('.letter-text');
            if (!container) return false;
            
            const testSpan = document.createElement('span');
            testSpan.style.visibility = 'hidden';
            testSpan.style.position = 'absolute';
            testSpan.style.whiteSpace = 'nowrap';
            // Використовуємо innerHTML замість textContent щоб врахувати теги форматування
            testSpan.innerHTML = text;
            
            container.appendChild(testSpan);
            const width = testSpan.getBoundingClientRect().width;
            const containerWidth = container.getBoundingClientRect().width;
            container.removeChild(testSpan);
            
            return width <= containerWidth;
          },
          { text: testLine }
        );
        
        if (fits) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            visualLines.push(currentLine);
          }
          currentLine = word;
        }
      }
      
      if (currentLine) {
        visualLines.push(currentLine);
      }
      
      console.log(`  Рядок ${lineIndex + 1}: ${visualLines.length} візуальних рядків`);
      
      // Додаємо візуальні рядки
      for (let visualLineIndex = 0; visualLineIndex < visualLines.length; visualLineIndex++) {
        let visualLine = visualLines[visualLineIndex];
        const isLastVisualLine = visualLineIndex === visualLines.length - 1;
        
        if (currentLineCount + 1 <= maxLines) {
          // Рядок вміщується
          
          // Якщо це перший візуальний рядок першого рядка, відкриваємо <p>
          if (isFirstLineInParagraph && visualLineIndex === 0) {
            paragraphHTML += '<p>';
            isFirstParagraphOnPage = false;
            isFirstLineInParagraph = false;
          }
          
          paragraphHTML += visualLine;
          
          // Визначаємо що додати після рядка
          if (isLastVisualLine && isLastLine) {
            // Це останній візуальний рядок останнього рядка абзацу - закриваємо </p>
            paragraphHTML += '</p>';
          } else if (isLastVisualLine && !isLastLine) {
            // Це останній візуальний рядок, але є ще рядки - додаємо <br> (один Enter)
            paragraphHTML += '<br>';
          } else {
            // Не останній візуальний рядок - додаємо пробіл
            paragraphHTML += ' ';
          }
          
          currentLineCount += 1;
          console.log(`    ✅ Візуальний рядок додано (${currentLineCount}/${maxLines})`);
        } else {
          // Рядок не вміщується - зберігаємо поточну сторінку і починаємо нову
          
          if ((currentPageHTML + paragraphHTML).trim()) {
            pages.push((currentPageHTML + paragraphHTML).trim());
            console.log(`    📄 Сторінка ${pageIndex + 1} завершена`);
            pageIndex++;
          }
          
          // Починаємо нову сторінку з поточного візуального рядка
          currentPageHTML = '';
          paragraphHTML = '<p>' + visualLine;
          currentLineCount = 1;
          isFirstParagraphOnPage = true;
          isFirstLineInParagraph = false;
          
          if (isLastVisualLine && isLastLine) {
            paragraphHTML += '</p>';
          } else if (isLastVisualLine && !isLastLine) {
            paragraphHTML += '<br>';
          } else {
            paragraphHTML += ' ';
          }
          
          console.log(`    📄 Нова сторінка ${pageIndex + 1}`);
        }
      }
    }
    
    // Додаємо завершений абзац до поточної сторінки
    currentPageHTML += paragraphHTML;
  }
  
  // Зберігаємо останню сторінку
  if (currentPageHTML.trim()) {
    pages.push(currentPageHTML.trim());
    console.log(`📄 Остання сторінка ${pages.length} завершена`);
  }
  
  await browser.close();
  
  console.log(`✅ Всього створено ${pages.length} сторінок\n`);
  
  return pages;
}

/**
 * Генеруємо фінальний HTML для PDF
 */
function generateMultiPageHTML(
  formData: FormData, 
  textPages: string[], 
  template: typeof a6labsTemplate1 | typeof a6terravivaTemplate1
): string {
  const pages: string[] = [];
  const totalPages = textPages.length;
  
  // Перевіряємо чи підпис має бути схований
  const shouldHideSignature = formData.senderSignature === '___HIDE_SIGNATURE___';
  const actualSignature = shouldHideSignature ? undefined : formData.senderSignature;
  
  if (totalPages === 1) {
    // Одна сторінка з підписом (якщо не схована)
    pages.push(template.generateFirstPage({
      date: formData.date,
      letterTitle: formData.letterTitle,
      recipient: formData.recipient,
      letterText: textPages[0],
      signature: actualSignature
    }, 1, totalPages));
  } else {
    // Перша сторінка без підпису
    pages.push(template.generateFirstPage({
      date: formData.date,
      letterTitle: formData.letterTitle,
      recipient: formData.recipient,
      letterText: textPages[0]
    }, 1, totalPages));
    
    // Сторінки продовження
    for (let i = 1; i < totalPages; i++) {
      const isLastPage = i === totalPages - 1;
      pages.push(template.generateContinuationPage({
        date: formData.date,
        letterTitle: formData.letterTitle,
        recipient: formData.recipient,
        letterText: textPages[i],
        signature: isLastPage ? actualSignature : undefined
      }, i + 1, totalPages));
    }
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>${template.getStyles()}</style>
    </head>
    <body>
      ${pages.join('\n')}
    </body>
    </html>
  `;
}
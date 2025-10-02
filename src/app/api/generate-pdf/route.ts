// src/app/api/generate-pdf/route.ts

import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import * as a6labsTemplate1 from '@/templates/letterheads/a6labs/template1';

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
    
    let textPages: string[];
    
    if (shouldMeasure) {
      textPages = await splitTextByHeight(
        formData.letterText,
        513,
        580
      );
      console.log('Measured and split into', textPages.length, 'pages');
    } else {
      textPages = [formData.letterText];
    }
    
    let template;
    if (templateId === 'a6labs-letterhead-1') {
      template = a6labsTemplate1;
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

function isListItem(line: string): boolean {
  const trimmed = line.trim();
  return /^[•●○◦▪▫-]\s/.test(trimmed) || 
         /^\d+\.\s/.test(trimmed) ||
         /^[a-z]\.\s/.test(trimmed);
}

function getListItemText(line: string): string {
  const trimmed = line.trim();
  return trimmed.replace(/^[•●○◦▪▫-]\s/, '')
                .replace(/^\d+\.\s/, '')
                .replace(/^[a-z]\.\s/, '');
}

async function measureSingleListItem(page: any, itemText: string): Promise<string[]> {
  const words = itemText.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const bulletWidth = 15;
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    const fits = await page.evaluate(
      ({ text, bulletWidth }: { text: string; bulletWidth: number }) => {
        const container = document.querySelector('.letter-text');
        if (!container) return false;
        
        const testSpan = document.createElement('span');
        testSpan.style.visibility = 'hidden';
        testSpan.style.position = 'absolute';
        testSpan.style.whiteSpace = 'nowrap';
        testSpan.textContent = text;
        
        container.appendChild(testSpan);
        const width = testSpan.getBoundingClientRect().width;
        const containerWidth = container.getBoundingClientRect().width - bulletWidth;
        container.removeChild(testSpan);
        
        return width <= containerWidth;
      },
      { text: testLine, bulletWidth }
    );
    
    if (fits) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : [''];
}

async function measureTextInActualTemplate(
  page: any,
  paragraph: string
): Promise<Array<{text: string, isList: boolean}>> {
  const explicitLines = paragraph.split('\n');
  const allLines: Array<{text: string, isList: boolean}> = [];
  
  for (const explicitLine of explicitLines) {
    const trimmedLine = explicitLine.trim();
    if (!trimmedLine) {
      allLines.push({text: '', isList: false});
      continue;
    }
    
    const isList = isListItem(trimmedLine);
    const textToMeasure = isList ? getListItemText(trimmedLine) : trimmedLine;
    const bulletWidth = isList ? 10 : 0;
    
    const fitsOnLine = await page.evaluate(
      ({ text, bulletWidth }: { text: string; bulletWidth: number }) => {
        const container = document.querySelector('.letter-text');
        if (!container) return false;
        
        const testSpan = document.createElement('span');
        testSpan.style.visibility = 'hidden';
        testSpan.style.position = 'absolute';
        testSpan.style.whiteSpace = 'nowrap';
        testSpan.textContent = text;
        
        container.appendChild(testSpan);
        const width = testSpan.getBoundingClientRect().width;
        const containerWidth = container.getBoundingClientRect().width;
        container.removeChild(testSpan);
        
        return width + bulletWidth <= containerWidth;
      },
      { text: textToMeasure, bulletWidth }
    );
    
    if (fitsOnLine) {
      allLines.push({text: textToMeasure, isList});
    } else {
      const words = textToMeasure.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        
        const fits = await page.evaluate(
          ({ text, bulletWidth }: { text: string; bulletWidth: number }) => {
            const container = document.querySelector('.letter-text');
            if (!container) return false;
            
            const testSpan = document.createElement('span');
            testSpan.style.visibility = 'hidden';
            testSpan.style.position = 'absolute';
            testSpan.style.whiteSpace = 'nowrap';
            testSpan.textContent = text;
            
            container.appendChild(testSpan);
            const width = testSpan.getBoundingClientRect().width;
            const containerWidth = container.getBoundingClientRect().width;
            container.removeChild(testSpan);
            
            return width + bulletWidth <= containerWidth;
          },
          { text: testLine, bulletWidth }
        );
        
        if (fits) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            allLines.push({text: currentLine, isList});
          }
          currentLine = word;
        }
      }
      
      if (currentLine) {
        allLines.push({text: currentLine, isList});
      }
    }
  }
  
  return allLines.length > 0 ? allLines : [{text: '', isList: false}];
}

async function splitTextByHeight(
  text: string,
  firstPageMaxHeight: number,
  otherPageMaxHeight: number
): Promise<string[]> {
  const LINE_HEIGHT_PX = 15;
  const FIRST_PAGE_MAX_LINES = Math.floor(firstPageMaxHeight / LINE_HEIGHT_PX);
  const OTHER_PAGE_MAX_LINES = Math.floor(otherPageMaxHeight / LINE_HEIGHT_PX);
  
  console.log('=== Измерение в реальном Puppeteer ===');
  
  const puppeteer = require('puppeteer');
  const a6labsTemplate1 = require('@/templates/letterheads/a6labs/template1');
  
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
      <style>${a6labsTemplate1.getStyles()}</style>
    </head>
    <body>
      ${a6labsTemplate1.generateFirstPage({
        date: 'Test',
        letterTitle: 'Test',
        recipient: 'Test',
        letterText: 'Test'
      }, 1, 1)}
    </body>
    </html>
  `;
  
  await page.setContent(testHTML, { waitUntil: 'networkidle0' });
  
  const pages: string[] = [];
  const paragraphs = text
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  let currentPageHTML = '';
  let currentLineCount = 0;
  let pageIndex = 0;
  let isFirstLineOfParagraph = true;
  let inList = false;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const listItems = paragraph.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const isListParagraph = listItems.length > 0 && isListItem(listItems[0]);
    
    if (isListParagraph) {
        if (!inList) {
            currentPageHTML += '<ul>';
            inList = true;
        }
        
        for (const item of listItems) {
            const itemText = getListItemText(item);
            const maxLines = pageIndex === 0 ? FIRST_PAGE_MAX_LINES : OTHER_PAGE_MAX_LINES;
            const itemLines = await measureSingleListItem(page, itemText);
            const linesNeeded = itemLines.length;
            
            if (currentLineCount + linesNeeded <= maxLines) {
            currentPageHTML += `<li>${itemLines.join(' ')}</li>`;
            currentLineCount += linesNeeded;
            } else {
            if (inList) {
                currentPageHTML += '</ul>';
                inList = false;
            }
            
            if (currentPageHTML) {
                pages.push(currentPageHTML.trim());
                pageIndex++;
            }
            
            currentPageHTML = '<ul><li>' + itemLines.join(' ') + '</li>';
            currentLineCount = linesNeeded;
            inList = true;
            }
        }
        
        if (inList) {
            currentPageHTML += '</ul>';
            inList = false;
        }
        
        isFirstLineOfParagraph = true;
      } else {
      const lines = await measureTextInActualTemplate(page, paragraph);
      const maxLines = pageIndex === 0 ? FIRST_PAGE_MAX_LINES : OTHER_PAGE_MAX_LINES;
      
      for (const {text: lineText} of lines) {
        const needsParagraphSpacing = isFirstLineOfParagraph && currentPageHTML.length > 0;
        const spacingLines = needsParagraphSpacing ? 1 : 0;
        const totalLinesNeeded = 1 + spacingLines;
        
        if (currentLineCount + totalLinesNeeded <= maxLines) {
          if (needsParagraphSpacing) {
            currentPageHTML += '\n';
            currentLineCount++;
          }
          currentPageHTML += lineText + '\n';
          currentLineCount++;
          isFirstLineOfParagraph = false;
        } else {
          if (currentPageHTML) {
            pages.push(currentPageHTML.trim());
            pageIndex++;
          }
          currentPageHTML = lineText + '\n';
          currentLineCount = 1;
          isFirstLineOfParagraph = false;
        }
      }
      
      isFirstLineOfParagraph = true;
    }
  }
  
  if (currentPageHTML) {
    pages.push(currentPageHTML.trim());
  }
  
  await browser.close();
  
  console.log(`\n✅ Итого страниц: ${pages.length}`);
  
  return pages;
}

function generateMultiPageHTML(
  formData: FormData, 
  textPages: string[], 
  template: typeof a6labsTemplate1
): string {
  const pages: string[] = [];
  const totalPages = textPages.length;
  
  if (totalPages === 1) {
    pages.push(template.generateFirstPage({
      date: formData.date,
      letterTitle: formData.letterTitle,
      recipient: formData.recipient,
      letterText: textPages[0],
      signature: formData.senderSignature
    }, 1, totalPages));
  } else {
    pages.push(template.generateFirstPage({
      date: formData.date,
      letterTitle: formData.letterTitle,
      recipient: formData.recipient,
      letterText: textPages[0]
    }, 1, totalPages));
    
    for (let i = 1; i < totalPages; i++) {
      const isLastPage = i === totalPages - 1;
      pages.push(template.generateContinuationPage({
        date: formData.date,
        letterTitle: formData.letterTitle,
        recipient: formData.recipient,
        letterText: textPages[i],
        signature: isLastPage ? formData.senderSignature : undefined
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
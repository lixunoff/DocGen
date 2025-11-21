// src/templates/letterheads/a6terraviva/template1.ts

import fs from 'fs';
import path from 'path';

export interface A6TerravivaTemplateData {
  date: string;
  letterTitle: string;
  recipient: string;
  letterText: string;
  signature?: string;
  showStamps?: boolean;
}

function getImageBase64(imagePath: string): string {
  try {
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    const imageBuffer = fs.readFileSync(fullPath);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(imagePath).slice(1);
    return `data:image/${ext};base64,${base64}`;
  } catch (error) {
    console.error(`Failed to load image: ${imagePath}`, error);
    return '';
  }
}

export function generateFirstPage(
  data: A6TerravivaTemplateData, 
  pageNumber: number, 
  totalPages: number
): string {
  const { date, letterTitle, recipient, letterText, signature, showStamps = true } = data;
  
  const formattedDate = date.replace(/,\s*/g, ',<br>');
  const formattedRecipient = recipient.replace(/,\s*/g, ',<br>');
  
  // Format signature
  const formattedSignature = signature
    ? signature
        .replace(/\n/g, '<br>')
        .replace(/Sincerely,/gi, 'Sincerely,<br><br>')
        .replace(/\.\s+/g, '.<br>')
    : '';
  
  const logoA6Base64 = getImageBase64('/assets/a6terraviva/logo-1.png');
  const stampA6Base64 = getImageBase64('/assets/a6terraviva/stamp-1.png');
  const logoTerravivaBase64 = getImageBase64('/assets/a6terraviva/logo-2.png');
  const stampTerravivaBase64 = getImageBase64('/assets/a6terraviva/stamp-2.png');
  const bgBase64 = getImageBase64('/assets/a6terraviva/bg.png');
  
  const isOnePageWithSignature = totalPages === 1 && signature;
  const mainContentClass = isOnePageWithSignature ? 'main-content one-page-signature' : 'main-content';
  
  return `
    <div class="page a6terraviva-page">
      ${bgBase64 ? `<img src="${bgBase64}" class="background-image" alt="" />` : ''}
      <div class="content">
        <div class="header-dual">
          <div class="header-left">
            ${logoA6Base64 ? `<img src="${logoA6Base64}" class="logo-img" alt="A6 Labs" />` : '<div class="logo-text">A6 Labs</div>'}
            <div class="address">
              GV10, Dubai International Financial Centre,<br>
              Dubai, United Arab Emirates
            </div>
          </div>
          <div class="header-right">
            ${logoTerravivaBase64 ? `<img src="${logoTerravivaBase64}" class="logo-img-terraviva" alt="Terraviva" />` : '<div class="logo-text">Terraviva</div>'}
            <div class="address">
              JAFZA 15, Jebel Ali Dubai,<br>
              Dubai, United Arab Emirates
            </div>
          </div>
        </div>
        
        <div class="date-title">
          <div class="date">${formattedDate}</div>
          <div class="title">${letterTitle}</div>
        </div>
        
        <div class="${mainContentClass}">
          <div class="left-column-dual">
            <div class="recipient">${formattedRecipient}</div>
            ${showStamps ? `<div class="stamps-container">
              ${stampA6Base64 ? `<img src="${stampA6Base64}" class="stamp-img" alt="A6 Labs Stamp" />` : '<div class="stamp-placeholder">A6 LABS<br>STAMP</div>'}
              ${stampTerravivaBase64 ? `<img src="${stampTerravivaBase64}" class="stamp-img" alt="Terraviva Stamp" />` : '<div class="stamp-placeholder">TERRAVIVA<br>STAMP</div>'}
            </div>` : ''}
          </div>
          
          <div class="right-column">
            <div class="letter-text">${letterText}</div>
            ${signature ? `<div class="signature">${formattedSignature}</div>` : ''}
          </div>
        </div>
        
        <div class="page-number">${pageNumber}/${totalPages}</div>
      </div>
    </div>
  `;
}

export function generateContinuationPage(
  data: A6TerravivaTemplateData, 
  pageNumber: number, 
  totalPages: number
): string {
  const { letterText, signature, showStamps = true } = data;
  
  // Format signature
  const formattedSignature = signature
    ? signature
        .replace(/\n/g, '<br>')
        .replace(/Sincerely,/gi, 'Sincerely,<br><br>')
        .replace(/\.\s+/g, '.<br>')
    : '';
  
  const logoA6Base64 = getImageBase64('/assets/a6terraviva/logo-1.png');
  const stampA6Base64 = getImageBase64('/assets/a6terraviva/stamp-1.png');
  const logoTerravivaBase64 = getImageBase64('/assets/a6terraviva/logo-2.png');
  const stampTerravivaBase64 = getImageBase64('/assets/a6terraviva/stamp-2.png');
  const bgBase64 = getImageBase64('/assets/a6terraviva/bg.png');
  
  return `
    <div class="page a6terraviva-page">
      ${bgBase64 ? `<img src="${bgBase64}" class="background-image" alt="" />` : ''}
      <div class="content">
        <div class="header-dual">
          <div class="header-left">
            ${logoA6Base64 ? `<img src="${logoA6Base64}" class="logo-img" alt="A6 Labs" />` : '<div class="logo-text">A6 Labs</div>'}
            <div class="address">
              GV10, Dubai International Financial Centre,<br>
              Dubai, United Arab Emirates
            </div>
          </div>
          <div class="header-right">
            ${logoTerravivaBase64 ? `<img src="${logoTerravivaBase64}" class="logo-img-terraviva" alt="Terraviva" />` : '<div class="logo-text">Terraviva</div>'}
            <div class="address">
              JAFZA 15, Jebel Ali Dubai,<br>
              Dubai, United Arab Emirates
            </div>
          </div>
        </div>
        
        <div class="main-content continuation">
          <div class="left-column-dual">
            ${showStamps ? `<div class="stamps-container">
              ${stampA6Base64 ? `<img src="${stampA6Base64}" class="stamp-img" alt="A6 Labs Stamp" />` : '<div class="stamp-placeholder">A6 LABS<br>STAMP</div>'}
              ${stampTerravivaBase64 ? `<img src="${stampTerravivaBase64}" class="stamp-img" alt="Terraviva Stamp" />` : '<div class="stamp-placeholder">TERRAVIVA<br>STAMP</div>'}
            </div>` : ''}
          </div>
          
          <div class="right-column">
            <div class="letter-text">${letterText}</div>
            ${signature ? `<div class="signature">${formattedSignature}</div>` : ''}
          </div>
        </div>
        
        <div class="page-number">${pageNumber}/${totalPages}</div>
      </div>
    </div>
  `;
}

export function getStyles(): string {
  return `
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      color: #27272a;
    }
    
    .a6terraviva-page {
      width: 210mm;
      height: 297mm;
      position: relative;
      page-break-after: always;
      page-break-inside: avoid;
      background: #F0F5FB;
      overflow: hidden;
      box-sizing: border-box;
    }
    
    .background-image {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 100%;
      height: auto;
      z-index: 0;
      pointer-events: none;
    }
    
    .content {
      position: relative;
      z-index: 1;
      padding: 29pt;
      height: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    
    .header-dual {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 97pt;
      flex-shrink: 0;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
      padding-bottom: 15pt;
    }
    
    .header-left,
    .header-right {
      display: flex;
      flex-direction: column;
      gap: 8pt;
      align-items: flex-start;
    }
    
    .logo-img {
      height: 16pt;
      width: auto;
    }
    
    .logo-img-terraviva {
      height: 16pt;
      width: auto;
    }
    
    .logo-text {
      font-size: 24pt;
      font-weight: 700;
      color: #076143;
    }
    
    .address {
      max-width: 200pt;
      font-size: 9pt;
      color: #91B3C7;
      line-height: 1.667;
      text-align: left;
    }
    
    .date-title {
      display: flex;
      gap: 29pt;
      margin-bottom: 25pt;
      flex-shrink: 0;
    }
    
    .date {
      width: 113pt;
      font-size: 9pt;
      color: #91B3C7;
      line-height: 1.667;
    }
    
    .title {
      flex: 1;
      padding-right: 71pt;
      font-size: 9pt;
      line-height: 1.667;
    }
    
    .main-content {
      display: flex;
      gap: 29pt;
      flex: 1;
      min-height: 0;
      height: calc(100% - 180pt);
    }
    
    .main-content.one-page-signature {
      display: flex;
      gap: 29pt;
      flex: 1;
      min-height: 0;
    }
    
    .main-content.one-page-signature .right-column {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .main-content.one-page-signature .signature {
      margin-top: auto !important;
      padding-top: 20pt;
    }
    
    .main-content.continuation {
      margin-top: 0;
    }
    
    .left-column-dual {
      width: 113pt;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex-shrink: 0;
    }
    
    .recipient {
      font-size: 9pt;
      color: #91B3C7;
      line-height: 1.667;
    }
    
    .stamps-container {
      display: flex;
      flex-direction: column;
      gap: 15pt;
      margin-top: auto;
    }
    
    .stamp-img {
      width: 113pt;
      height: 113pt;
    }
    
    .stamp-placeholder {
      width: 113pt;
      height: 113pt;
      border: 2px solid #076143;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 10pt;
      color: #076143;
      font-weight: 600;
      line-height: 1.3;
    }
    
    .right-column {
      flex: 1;
      padding-right: 71pt;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
    
    .letter-text {
      font-size: 9pt;
      line-height: 1.667;
      overflow: hidden;
      flex: 1;
    }
    
    /* === БАЗОВІ СТИЛІ ДЛЯ ТЕКСТУ === */
    
    /* КЛЮЧОВЕ ПРАВИЛО: порожні параграфи <p><br></p> створюють відступ */
    .letter-text p {
      margin: 0;
      page-break-inside: avoid;
    }
    
    /* Якщо параграф містить тільки <br> (порожній) - додаємо відступ */
    .letter-text p:has(br:only-child) {
      height: 15pt;
      line-height: 15pt;
    }
    
    /* Форматування тексту */
    .letter-text strong,
    .letter-text b {
      font-weight: 700;
    }
    
    .letter-text em,
    .letter-text i {
      font-style: italic;
    }
    
    .letter-text u {
      text-decoration: underline;
    }
    
    /* === СПИСКИ === */
    
    /* Нумерований список */
    .letter-text ol {
      margin: 0 !important;
      padding: 0 !important;
      list-style: decimal !important;  /* Використовуємо стандартну нумерацію */
      list-style-position: outside !important;
      padding-left: 20pt !important;
    }
    
    .letter-text ol > li {
      margin: 0 !important;
      padding-left: 0 !important;
      text-indent: 0 !important;
      line-height: 1.667;
      list-style: decimal !important;
    }
    
    .letter-text ol > li::marker {
      /* Стилі для маркера (цифри) */
      font-weight: 400;
    }
    
    /* Ненумерований список */
    .letter-text ul {
      margin: 0 !important;
      padding: 0 !important;
      list-style: disc !important;  /* Використовуємо стандартні bullets */
      list-style-position: outside !important;
      padding-left: 15pt !important;
    }
    
    .letter-text ul > li {
      margin: 0 !important;
      padding-left: 0 !important;
      text-indent: 0 !important;
      line-height: 1.667;
      list-style: disc !important;
    }
    
    .letter-text ul > li::marker {
      /* Стилі для маркера (bullet) */
      font-weight: 400;
    }
    
    /* Quill додає data-list атрибути */
    .letter-text li[data-list="bullet"] {
      list-style: disc !important;
    }
    
    .letter-text li[data-list="ordered"] {
      list-style: decimal !important;
    }
    
    /* Заголовки */
    .letter-text h1 {
      font-size: 12pt;
      font-weight: 700;
      margin: 0 0 8pt 0;
      line-height: 1.4;
    }
    
    .letter-text h2 {
      font-size: 11pt;
      font-weight: 700;
      margin: 0 0 6pt 0;
      line-height: 1.4;
    }
    
    .letter-text h3 {
      font-size: 10pt;
      font-weight: 700;
      margin: 0 0 4pt 0;
      line-height: 1.4;
    }
    
    /* Посилання */
    .letter-text a {
      color: #076143;
      text-decoration: underline;
    }
    
    /* === ЗОБРАЖЕННЯ === */
    
    /* Зображення в тексті автоматично масштабуються */
    .letter-text img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 8pt 0;
    }
    
    /* Зображення в параграфі */
    .letter-text p img {
      margin: 4pt 0;
    }
    
    /* Зображення в списках */
    .letter-text li img {
      margin: 4pt 0;
      max-width: calc(100% - 20pt); /* Враховуємо padding списку */
    }
    
    /* Підпис */
    .signature {
      font-size: 9pt;
      line-height: 1.667;
      margin-top: 20pt;
      padding-top: 15pt;
      flex-shrink: 0;
    }

    /* Правила для сторінок продовження */
    .main-content.continuation .signature {
      margin-top: 20pt !important;
      padding-top: 15pt !important;
    }

    .main-content.continuation .right-column {
      justify-content: flex-start !important;
    }

    .main-content.continuation .letter-text {
      flex: 0 0 auto !important;
    }

    /* Номер сторінки */
    .page-number {
      position: absolute;
      bottom: 29pt;
      right: 29pt;
      font-size: 9pt;
      color: #91B3C7;
      text-align: right;
    }
  `;
}
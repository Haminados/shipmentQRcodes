import type { ShipmentData, EquipmentRow } from '../types';

interface LogoUrls {
  logoLeft2: string;
  logoRight: string;
}

/**
 * Generate the complete HTML string for PDF rendering
 * Modern, official A4 RTL Hebrew PDF design with:
 * - Professional header with logos
 * - Clean shipment details section
 * - Formatted equipment table
 * - QR codes at the bottom
 */
export function generatePdfHtml(
  shipment: ShipmentData,
  equipment: EquipmentRow[],
  shipmentQrDataUrl: string,
  rowQrDataUrls: string[],
  logos: LogoUrls
): string {
  const equipmentTableRows = equipment
    .map(
      (row, index) => `
      <tr class="${index % 2 === 0 ? 'row-even' : 'row-odd'}">
        <td>${escapeHtml(row.rowNum)}</td>
        <td>${escapeHtml(row.manufacturerNum)}</td>
        <td>${escapeHtml(row.manufacturerName)}</td>
        <td>${escapeHtml(row.equipmentVersion)}</td>
        <td>${escapeHtml(row.idfCatalog)}</td>
        <td>${escapeHtml(row.serialNum)}</td>
        <td>${escapeHtml(row.purchaseQty)}</td>
        <td>${escapeHtml(row.testQty)}</td>
        <td>${escapeHtml(row.purchaseOrder)}</td>
        <td class="qr-cell"><img src="${rowQrDataUrls[index]}" class="row-qr-code" alt="QR" /></td>
      </tr>
    `
    )
    .join('');

  const logoLeft2Html = logos.logoLeft2
    ? `<img src="${logos.logoLeft2}" alt="Logo" class="header-logo" />`
    : `<div class="logo-placeholder">LOGO</div>`;

  const logoRightHtml = logos.logoRight
    ? `<img src="${logos.logoRight}" alt="Logo" class="header-logo" />`
    : `<div class="logo-placeholder">LOGO</div>`;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>תעודת משלוח וציוד</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap');
    
    @page {
      size: landscape;
      margin: 5mm; /* Reduced from 10mm */
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Heebo', 'Arial', sans-serif;
      font-size: 11px;
      direction: rtl;
      background: #fff;
      color: #000;
      padding: 5mm; /* Reduced from 12mm 10mm */
      line-height: 1.4;
    }
    
    .container {
      max-width: 100%;
    }
    
    /* === HEADER === */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: #fff;
      border: 2px solid #000;
      border-radius: 8px;
      margin-bottom: 10px; /* Reduced from 20px */
    }
    
    .header-logos-left {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    
    .header-logos-right {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    
    .header-logo {
      max-height: 55px;
      max-width: 70px;
      object-fit: contain;
      background: #fff;
      padding: 0;
    }
    
    .logo-placeholder {
      width: 60px;
      height: 45px;
      background: #fff;
      border: 1px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #000;
      font-weight: 500;
    }
    
    .header-title {
      text-align: center;
      flex: 1;
    }
    
    .header-title h1 {
      font-size: 22px;
      font-weight: 700;
      color: #000;
      margin-bottom: 3px;
    }
    
    .header-title h2 {
      font-size: 12px;
      font-weight: 400;
      color: #000;
      letter-spacing: 1px;
    }
    
    /* === SECTIONS === */
    .section {
      margin-bottom: 10px; /* Reduced from 18px */
    }
    
    .section-header {
      background: #fff;
      color: #000;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 700;
      border: 1px solid #000;
      border-bottom: none;
      border-radius: 6px 6px 0 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .section-content {
      background: #fff;
      border: 1px solid #000;
      border-top: 1px solid #000;
      border-radius: 0 0 6px 6px;
      padding: 15px 18px;
    }
    
    /* === SHIPMENT GRID === */
    .shipment-grid {
      display: grid;
      /* Columns: Content, Content, QR (Left) */
      grid-template-columns: 1fr 1fr 140px;
      gap: 12px 20px;
      align-items: start;
    }
    
    .field-row {
      display: flex;
      align-items: center;
      background: #fff;
      border: 1px solid #000;
      border-radius: 6px;
    }
    
    .field-label {
      font-weight: 600;
      color: #000;
      padding: 10px 14px;
      min-width: 110px;
      background: #f0f0f0;
      border-left: 1px solid #000;
      font-size: 11px;
    }
    
    .field-value {
      flex: 1;
      padding: 10px 14px;
      font-size: 12px;
      font-weight: 500;
      color: #000;
      white-space: nowrap;
    }
    
    /* === EQUIPMENT TABLE === */
    .equipment-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 9px; /* Reduced from 11px */
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #000;
      table-layout: fixed; /* Ensure valid width calculation */
    }
    
    .equipment-table th {
      background: #f0f0f0;
      color: #000;
      padding: 6px 4px; /* Reduced padding */
      font-weight: 700;
      text-align: center;
      font-size: 9px; /* Reduced from 11px */
      border-left: 1px solid #000;
      border-bottom: 1px solid #000;
      white-space: nowrap; /* Prevent wrapping in headers if possible */
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .equipment-table th:last-child {
      border-left: none;
    }
    
    .equipment-table td {
      padding: 6px 4px; /* Reduced padding */
      text-align: center;
      border-bottom: 1px solid #000;
      border-left: 1px solid #000;
      font-size: 9px; /* Reduced from 11px */
      color: #000;
      word-break: break-all; /* Allow breaking long strings */
    }
    
    .equipment-table td:last-child {
      border-left: none;
    }
    
    .equipment-table tr:last-child td {
      border-bottom: none;
    }
    
    /* === FOOTER === */
    .footer {
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px solid #000;
      text-align: center;
      color: #000;
      font-size: 9px;
    }
    
    .row-qr-code {
      width: 60px;
      height: 60px;
      display: block;
      margin: 0 auto;
    }
    
    .qr-cell {
      padding: 2px !important;
      vertical-align: middle;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-logos-right">
        ${logoRightHtml}
      </div>
      <div class="header-title">
        <h1>תעודת משלוח וציוד</h1>
        <h2>SHIPMENT & EQUIPMENT CERTIFICATE</h2>
      </div>
      <div class="header-logos-left">
        ${logoLeft2Html}
      </div>
    </div>
    
    <!-- Shipment Details Section -->
    <div class="section">
      <div class="section-header">פרטי משלוח</div>
      <div class="section-content">
        <div class="shipment-grid">
          <div class="field-row">
            <span class="field-label">לקוח</span>
            <span class="field-value">${escapeHtml(shipment.customer)}</span>
          </div>
          <div class="field-row">
            <span class="field-label">מועד אספקת ציוד</span>
            <span class="field-value">${escapeHtml(shipment.supplyDate)}</span>
          </div>

          <!-- QR Code (Left Column, Spans 2 rows) -->
          <div class="qr-col" style="grid-row: span 2; grid-column: 3; display: flex; align-items: center; justify-content: center; padding-left: 10px;">
             <img src="${shipmentQrDataUrl}" style="width: 110px; height: 110px; image-rendering: pixelated;" alt="Shipment QR" />
          </div>

          <div class="field-row">
            <span class="field-label">POC - שם</span>
            <span class="field-value">${escapeHtml(shipment.pocName || '—')}</span>
          </div>

          <div class="field-row">
            <span class="field-label">POC - טלפון</span>
            <span class="field-value">${escapeHtml(shipment.pocPhone || '—')}</span>
          </div>

          <!-- Replaced POC Phone with Shipment Number -->
          <div class="field-row">
             <span class="field-label">מס' תעודת משלוח</span>
             <span class="field-value" style="font-weight: 700;">${escapeHtml(shipment.shipmentNumber)}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Equipment Section -->
    <div class="section">
      <div class="section-header">פרטי ציוד</div>
      <div class="section-content" style="padding: 0;">
        <table class="equipment-table">
          <thead>
            <tr>
              <th>מס"ד</th>
              <th>מס' יצרן</th>
              <th>שם יצרן</th>
              <th>גרסת הציוד</th>
              <th>מק"ט צהלי</th>
              <th>מס' סיריאלי</th>
              <th>כמות רכש</th>
              <th>כמות לבדיקה</th>
              <th>הזמנת רכש</th>
              <th>QR</th>
            </tr>
          </thead>
          <tbody>
            ${equipmentTableRows}
          </tbody>
        </table>
      </div>
    </div>
    
    
    <!-- Footer -->
    <div class="footer">
      מסמך זה הופק אוטומטית • ${new Date().toLocaleDateString('he-IL')}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

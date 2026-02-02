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
      color: #1a1a2e;
      padding: 12mm 10mm;
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
      background: linear-gradient(135deg, #0f4c75 0%, #1a5f7a 50%, #3282b8 100%);
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 4px 15px rgba(15, 76, 117, 0.3);
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
      padding: 5px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    
    .logo-placeholder {
      width: 60px;
      height: 45px;
      background: rgba(255,255,255,0.9);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #999;
      font-weight: 500;
    }
    
    .header-title {
      text-align: center;
      flex: 1;
    }
    
    .header-title h1 {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 3px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .header-title h2 {
      font-size: 12px;
      font-weight: 400;
      color: rgba(255,255,255,0.85);
      letter-spacing: 1px;
    }
    
    /* === SECTIONS === */
    .section {
      margin-bottom: 18px;
    }
    
    .section-header {
      background: linear-gradient(90deg, #0f4c75 0%, #3282b8 100%);
      color: #fff;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 6px 6px 0 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .section-header::before {
      content: '';
      width: 4px;
      height: 18px;
      background: #bbe1fa;
      border-radius: 2px;
    }
    
    .section-content {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-top: none;
      border-radius: 0 0 6px 6px;
      padding: 15px 18px;
    }
    
    /* === SHIPMENT GRID === */
    .shipment-grid {
      display: grid;
      grid-template-columns: 140px 1fr 1fr;
      gap: 12px 20px;
      align-items: center;
    }
    
    .field-row {
      display: flex;
      align-items: center;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    
    .field-label {
      font-weight: 600;
      color: #0f4c75;
      padding: 10px 14px;
      min-width: 110px;
      background: #e8f4f8;
      border-left: 1px solid #e2e8f0;
      font-size: 11px;
    }
    
    .field-value {
      flex: 1;
      padding: 10px 14px;
      font-size: 12px;
      font-weight: 500;
      color: #1a1a2e;
      white-space: nowrap;
    }
    
    /* === EQUIPMENT TABLE === */
    .equipment-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 11px;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .equipment-table th {
      background: linear-gradient(180deg, #0f4c75 0%, #1a5f7a 100%);
      color: #fff;
      color: #fff;
      padding: 12px 6px;
      font-weight: 600;
      text-align: center;
      font-size: 11px;
      border-left: 1px solid rgba(255,255,255,0.1);
    }
    
    .equipment-table th:first-child {
      border-radius: 0 6px 0 0;
    }
    
    .equipment-table th:last-child {
      border-radius: 6px 0 0 0;
      border-left: none;
    }
    
    .equipment-table td {
      padding: 12px 6px;
      text-align: center;
      border-bottom: 1px solid #e8eef3;
      border-left: 1px solid #e8eef3;
      font-size: 11px;
    }
    
    .equipment-table td:last-child {
      border-left: none;
    }
    
    .equipment-table .row-even td {
      background: #fff;
    }
    
    .equipment-table .row-odd td {
      background: #f8fafc;
    }
    
    .equipment-table tr:last-child td:first-child {
      border-radius: 0 0 6px 0;
    }
    
    .equipment-table tr:last-child td:last-child {
      border-radius: 0 0 0 6px;
    }
    
    
    /* === FOOTER === */
    .footer {
      margin-top: 20px;
      padding-top: 12px;
      border-top: 2px solid #e8f4f8;
      text-align: center;
      color: #888;
      font-size: 9px;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
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
          <div class="qr-col" style="grid-row: span 2; display: flex; align-items: center; justify-content: center; padding-left: 10px;">
             <img src="${shipmentQrDataUrl}" style="width: 110px; height: 110px; image-rendering: pixelated;" alt="Shipment QR" />
          </div>
          <div class="field-row">
            <span class="field-label">לקוח</span>
            <span class="field-value">${escapeHtml(shipment.customer)}</span>
          </div>
          <div class="field-row">
            <span class="field-label">מס' תעודת משלוח</span>
            <span class="field-value">${escapeHtml(shipment.shipmentNumber)}</span>
          </div>
          <div class="field-row">
            <span class="field-label">מועד אספקת ציוד</span>
            <span class="field-value">${escapeHtml(shipment.supplyDate)}</span>
          </div>
          <div class="field-row">
            <span class="field-label">POC - שם</span>
            <span class="field-value">${escapeHtml(shipment.pocName || '—')}</span>
          </div>
          <div class="field-row" style="grid-column: span 3;">
            <span class="field-label">POC - טלפון</span>
            <span class="field-value" style="font-size: 14px; font-weight: 700;">${escapeHtml(shipment.pocPhone || '—')}</span>
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

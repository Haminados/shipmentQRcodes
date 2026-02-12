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
  logos: LogoUrls,
  version: string
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
      padding: 5mm 5mm 15mm 5mm; /* Increased bottom padding for footer */
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
    .shipment-container {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }
    
    .shipment-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .detail-row {
      display: flex;
      gap: 12px;
      width: 100%;
    }
    
    .field-row {
      display: flex;
      align-items: center;
      background: #fff;
      border: 1px solid #000;
      border-radius: 6px;
      flex: 1;
      overflow: hidden;
    }
    
    .field-label {
      font-weight: 600;
      color: #000;
      padding: 8px 10px;
      min-width: 90px;
      background: #f0f0f0;
      border-left: 1px solid #000;
      font-size: 11px;
      white-space: nowrap;
    }
    
    .field-value {
      flex: 1;
      padding: 8px 10px;
      font-size: 12px;
      font-weight: 500;
      color: #000;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    /* === EQUIPMENT TABLE === */
    .equipment-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 9px; /* Increased from 9px */
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #000;
      table-layout: fixed;
    }
    
    .equipment-table th {
      background: #f0f0f0;
      color: #000;
      padding: 6px 4px; /* Reduced padding */
      font-weight: 700;
      text-align: center;
      font-size: 14px;
      border-left: 1px solid #000;
      border-bottom: 1px solid #000;
      white-space: normal;
      line-height: 1.2;
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
      font-size: 14px; /* Increased from 9px */
      color: #000;
      word-break: break-all;
    }
    
    .equipment-table td:last-child {
      border-left: none;
    }
    
    .equipment-table tr:last-child td {
      border-bottom: none;
    }
    
    /* === FOOTER === */
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 10px;
      border-top: 1px solid #000;
      text-align: center;
      color: #000;
      font-size: 9px;
      background: #fff;
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
        <div class="shipment-container">
          <div class="shipment-details">
            <!-- Row 1: Client, POC Name, POC Phone -->
            <div class="detail-row">
              <div class="field-row">
                <span class="field-label">לקוח</span>
                <span class="field-value">${escapeHtml(shipment.customer)}</span>
              </div>
              <div class="field-row">
                <span class="field-label">POC - שם</span>
                <span class="field-value">${escapeHtml(shipment.pocName || '—')}</span>
              </div>
              <div class="field-row">
                <span class="field-label">POC - טלפון</span>
                <span class="field-value">${escapeHtml(shipment.pocPhone || '—')}</span>
              </div>
            </div>

            <!-- Row 2: Supply Date, Shipment Number -->
            <div class="detail-row">
              <div class="field-row">
                <span class="field-label">מועד הפקת תעודת משלוח</span>
                <span class="field-value">${escapeHtml(shipment.supplyDate)}</span>
              </div>
              <div class="field-row">
                <span class="field-label">מס' תעודת משלוח</span>
                <span class="field-value" style="font-weight: 700;">${escapeHtml(shipment.shipmentNumber)}</span>
              </div>
            </div>
          </div>

          <!-- QR Code (Left Column) -->
          <div class="qr-col" style="display: flex; align-items: center; justify-content: center; padding-left: 10px;">
             <img src="${shipmentQrDataUrl}" style="width: 100px; height: 100px; image-rendering: pixelated;" alt="Shipment QR" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Equipment Section -->
    <div class="section">
      <div class="section-header">פרטי ציוד</div>
      <div class="section-content" style="padding: 0;">
        <table class="equipment-table">
          <colgroup>
            <col style="width: 4%;"> <!-- מס"ד - narrower -->
            <col style="width: 14%;"> <!-- מס' יצרן - wider -->
            <col style="width: 12%;"> <!-- שם יצרן - wider -->
            <col style="width: 7%;"> <!-- גרסת הציוד - narrower -->
            <col style="width: 10%;"> <!-- מק"ט צ״הלי -->
            <col style="width: 14%;"> <!-- מס' סריאלי - wider -->
            <col style="width: 6%;"> <!-- כמות רכש - narrower -->
            <col style="width: 6%;"> <!-- כמות לבדיקה - narrower -->
            <col style="width: 15%;"> <!-- הזמנת רכש -->
            <col style="width: 12%;"> <!-- QR -->
          </colgroup>
          <thead>
            <tr>
              <th>מס"ד</th>
              <th>מס' יצרן</th>
              <th>שם יצרן</th>
              <th>גרסת הציוד</th>
              <th>מק"ט צה"לי</th>
              <th>מס' סריאלי</th>
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
      מסמך זה הופק אוטומטית • ${new Date().toLocaleDateString('he-IL')} • v${version}
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

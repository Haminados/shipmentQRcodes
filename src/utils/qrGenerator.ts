import QRCode from 'qrcode';
import { cleanText } from './cleanText';
import type { ShipmentData, EquipmentRow } from '../types';

/**
 * Build shipment QR payload string
 * Format: "1|{shipmentNumber}|{customer}|{supplyDate}|{poc}"
 * 
 * @example
 * // With POC:
 * // "1|8564231|לקוח א|08/01/2026|דני כהן"
 * 
 * // Without POC (empty):
 * // "1|8564231|לקוח א|08/01/2026|"
 */
export function buildShipmentPayload(shipment: ShipmentData): string {
  const parts = [
    '1',
    cleanText(shipment.shipmentNumber),
    cleanText(shipment.customer),
    cleanText(shipment.supplyDate),
    cleanText(shipment.poc),
  ];

  return parts.join('|');
}

/**
 * Build equipment QR payload string
 * Format: "2^{row1}^{row2}^..."
 * Where each row: "{col1}|{col2}|...|{col9}" (no trailing |)
 * 
 * @example
 * // "2^1|123|SONY|145DL|16321545|8564231|1|2|PO-778^2|124|SONY|145DL|16321545|1254635|1|2|PO-779"
 */
export function buildEquipmentPayload(rows: EquipmentRow[]): string {
  if (rows.length === 0) return '2';

  const rowStrings = rows.map(row => {
    // Get all 9 columns in order (excluding internal id)
    const columns = [
      cleanText(row.rowNum),
      cleanText(row.manufacturerNum),
      cleanText(row.manufacturerName),
      cleanText(row.equipmentVersion),
      cleanText(row.idfCatalog),
      cleanText(row.serialNum),
      cleanText(row.purchaseQty),
      cleanText(row.testQty),
      cleanText(row.purchaseOrder),
    ];

    return columns.join('|');
  });

  return '2' + rowStrings.map(s => '^' + s).join('');
}

/**
 * Build payload for a single equipment row
 * Format: "2^{row_data}"
 */
export function buildSingleRowPayload(row: EquipmentRow): string {
  const columns = [
    cleanText(row.rowNum),
    cleanText(row.manufacturerNum),
    cleanText(row.manufacturerName),
    cleanText(row.equipmentVersion),
    cleanText(row.idfCatalog),
    cleanText(row.serialNum),
    cleanText(row.purchaseQty),
    cleanText(row.testQty),
    cleanText(row.purchaseOrder),
  ];

  return '2^' + columns.join('|');
}

/**
 * Generate QR code as PNG data URL
 * Uses error correction level L (equivalent to Word \q 1)
 * 
 * @param payload - The string data to encode in QR
 * @returns Promise with data URL for PNG image
 */
export async function generateQrDataUrl(payload: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'L',
      margin: 1,
      width: 150,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

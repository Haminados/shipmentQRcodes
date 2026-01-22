import type { ShipmentData, EquipmentRow } from '../types';

/**
 * Parse a shipment QR payload string back into ShipmentData
 * 
 * QR Format: "1|{shipmentNumber}|{customer}|{supplyDate}|{poc}"
 * 
 * @example
 * const qr = "1|345|45|07/01/2026|אטו";
 * const data = parseShipmentQr(qr);
 * // Returns: { shipmentNumber: "345", customer: "45", supplyDate: "07/01/2026", poc: "אטו" }
 * 
 * @param qrPayload - The scanned QR code string
 * @returns ShipmentData object or null if invalid format
 */
export function parseShipmentQr(qrPayload: string): ShipmentData | null {
  if (!qrPayload || typeof qrPayload !== 'string') {
    return null;
  }

  const parts = qrPayload.split('|');

  // Validate: must start with "1" and have at least 4 fields
  if (parts.length < 4 || parts[0] !== '1') {
    return null;
  }

  return {
    shipmentNumber: parts[1] || '',
    customer: parts[2] || '',
    supplyDate: parts[3] || '',
    poc: parts[4] || '', // May be empty
  };
}

/**
 * Validate if a string is a valid shipment QR payload
 * 
 * @param qrPayload - The string to validate
 * @returns true if valid shipment QR format
 */
export function isValidShipmentQr(qrPayload: string): boolean {
  if (!qrPayload || typeof qrPayload !== 'string') {
    return false;
  }

  const parts = qrPayload.split('|');
  return parts.length >= 4 && parts[0] === '1';
}

/**
 * Parse an equipment QR payload string back into EquipmentRow array
 * 
 * QR Format: "2^{row1}^{row2}^..."
 * Each row: "{rowNum}|{manufacturerNum}|{manufacturerName}|{equipmentVersion}|{idfCatalog}|{serialNum}|{purchaseQty}|{testQty}|{purchaseOrder}"
 * 
 * @example
 * const qr = "2^1|123|SONY|145DL|16321545|8564231|1|2|PO-778^2|124|SONY|145DL|16321545|1254635|1|2|PO-779";
 * const rows = parseEquipmentQr(qr);
 * // Returns array of EquipmentRow objects
 * 
 * @param qrPayload - The scanned QR code string
 * @returns Array of EquipmentRow objects or null if invalid format
 */
export function parseEquipmentQr(qrPayload: string): EquipmentRow[] | null {
  if (!qrPayload || typeof qrPayload !== 'string') {
    return null;
  }

  // Must start with "2"
  if (!qrPayload.startsWith('2')) {
    return null;
  }

  // Split by ^ to get rows (first element is "2")
  const rowStrings = qrPayload.split('^');
  
  if (rowStrings.length < 2) {
    return []; // No equipment rows
  }

  const equipmentRows: EquipmentRow[] = [];

  // Skip first element which is "2"
  for (let i = 1; i < rowStrings.length; i++) {
    const rowString = rowStrings[i];
    if (!rowString) continue;

    const columns = rowString.split('|');
    
    // Each row should have 9 columns
    equipmentRows.push({
      id: i, // Generate internal ID
      rowNum: columns[0] || '',
      manufacturerNum: columns[1] || '',
      manufacturerName: columns[2] || '',
      equipmentVersion: columns[3] || '',
      idfCatalog: columns[4] || '',
      serialNum: columns[5] || '',
      purchaseQty: columns[6] || '',
      testQty: columns[7] || '',
      purchaseOrder: columns[8] || '',
    });
  }

  return equipmentRows;
}

/**
 * Validate if a string is a valid equipment QR payload
 * 
 * @param qrPayload - The string to validate
 * @returns true if valid equipment QR format
 */
export function isValidEquipmentQr(qrPayload: string): boolean {
  if (!qrPayload || typeof qrPayload !== 'string') {
    return false;
  }

  return qrPayload.startsWith('2');
}

/**
 * Detect QR type from payload
 * 
 * @param qrPayload - The scanned QR code string
 * @returns 'shipment' | 'equipment' | 'unknown'
 */
export function detectQrType(qrPayload: string): 'shipment' | 'equipment' | 'unknown' {
  if (!qrPayload || typeof qrPayload !== 'string') {
    return 'unknown';
  }

  if (qrPayload.startsWith('1|')) {
    return 'shipment';
  }
  
  if (qrPayload.startsWith('2')) {
    return 'equipment';
  }

  return 'unknown';
}

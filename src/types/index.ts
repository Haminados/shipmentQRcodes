/**
 * Shipment data structure
 */
export interface ShipmentData {
  /** מס' תעודת משלוח - Shipment number (required) */
  shipmentNumber: string;
  /** לקוח - Customer name (required) */
  customer: string;
  /** מועד אספקת ציוד - Supply date in DD/MM/YYYY format (required) */
  supplyDate: string;
  /** פרטי POC - Name (optional) */
  pocName: string;
  /** פרטי POC - Phone (optional) */
  pocPhone: string;
}

/**
 * Equipment row data structure
 * The id field is internal only and NOT included in QR payload
 */
export interface EquipmentRow {
  /** Internal ID for React keys - NOT included in QR payload */
  id: number;
  /** מס"ד - Row sequence number (user editable) */
  rowNum: string;
  /** מס' יצרן - Manufacturer number */
  manufacturerNum: string;
  /** שם יצרן - Manufacturer name */
  manufacturerName: string;
  /** גרסת הציוד - Equipment version */
  equipmentVersion: string;
  /** מק"ט צהלי - IDF catalog number */
  idfCatalog: string;
  /** מס' סיריאלי - Serial number */
  serialNum: string;
  /** כמות רכש - Purchase quantity */
  purchaseQty: string;
  /** כמות לבדיקה - Test quantity */
  testQty: string;
  /** הזמנת רכש - Purchase order */
  purchaseOrder: string;
}

/**
 * Column definition for equipment table
 */
export interface EquipmentColumn {
  key: keyof Omit<EquipmentRow, 'id'>;
  header: string;
  width: string;
}

/**
 * Sticker API exposed via preload
 */
export interface StickerApi {
  savePdf: (html: string, filename?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  getAssetDataUrl: (name: string) => Promise<string>;
}

declare global {
  interface Window {
    stickerApi: StickerApi;
  }
}

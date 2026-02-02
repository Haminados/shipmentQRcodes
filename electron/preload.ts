import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('stickerApi', {
  /**
   * Save HTML content as PDF
   * @param html - The HTML content to convert to PDF
   * @returns Promise with success status and file path
   */
  savePdf: (html: string, shipmentNumber?: string): Promise<{ success: boolean; path?: string; error?: string }> => {
    return ipcRenderer.invoke('save-pdf', html, shipmentNumber);
  },

  /**
   * Get asset file as base64 data URL
   * @param name - The asset filename (e.g., 'logo_left_1.png')
   * @returns Promise with data URL or empty string if not found
   */
  getAssetDataUrl: (name: string): Promise<string> => {
    return ipcRenderer.invoke('get-asset-data-url', name);
  },
});

/// <reference types="vite/client" />

interface StickerApi {
    savePdf: (html: string, shipmentNumber?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    getAssetDataUrl: (name: string) => Promise<string>;
}

interface Window {
    stickerApi?: StickerApi;
}

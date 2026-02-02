import { app, BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

// Determine if running in development or production
const isDev = !app.isPackaged;

// Get assets path - different in dev vs packaged
function getAssetsPath(): string {
  if (isDev) {
    // In dev mode, assets are in the project root/assets folder
    // __dirname is dist-electron, so go up one level
    return path.join(process.cwd(), 'assets');
  } else {
    return path.join(process.resourcesPath, 'assets');
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(getAssetsPath(), 'icon.ico'),
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler: Get asset as data URL
ipcMain.handle('get-asset-data-url', async (_event: IpcMainInvokeEvent, assetName: string): Promise<string> => {
  try {
    const assetsPath = getAssetsPath();
    const filePath = path.join(assetsPath, assetName);

    if (!fs.existsSync(filePath)) {
      console.warn(`Asset not found: ${filePath}`);
      return '';
    }

    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');

    // Determine mime type based on extension
    const ext = path.extname(assetName).toLowerCase();
    let mimeType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') {
      mimeType = 'image/jpeg';
    } else if (ext === '.gif') {
      mimeType = 'image/gif';
    } else if (ext === '.svg') {
      mimeType = 'image/svg+xml';
    }

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error reading asset:', error);
    return '';
  }
});

// IPC Handler: Save PDF
ipcMain.handle('save-pdf', async (_event: IpcMainInvokeEvent, htmlContent: string): Promise<{ success: boolean; path?: string; error?: string }> => {
  try {
    // Show save dialog first
    // Show save dialog first
    // If htmlContent starts with a special marker, we could parse metadata,
    // but cleaner is to change signature. However, for quick fix without changing signature:
    // We'll rely on the renderer passing the filename or we default to timestamp.
    // Actually, to pass filename, we should update the IPC arguments.
    // Let's check how it's called in preload/App.

    // For now, let's assume the renderer sends a JSON string with { html, filename }
    // OR we just use a heuristic.
    // Wait, simpler: let's update the signature in main.ts to expect (event, payload)

    // But first, let's look at the implementation plan again.
    // The plan said: "Update the save-pdf IPC handler to accept a suggested filename."

    // Changing args...
    // The preload exposes: savePdf: (html: string) => ...
    // We should change preload too if we change main.

    const defaultPath = `shipment-${Date.now()}.pdf`;

    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'שמור PDF',
      defaultPath: defaultPath,
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] }
      ],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Cancelled by user' };
    }

    // Create hidden window for PDF generation
    const pdfWindow = new BrowserWindow({
      width: 794, // A4 width at 96 DPI
      height: 1123, // A4 height at 96 DPI
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Load HTML content
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate PDF
    const pdfData = await pdfWindow.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: {
        marginType: 'custom',
        top: 0.4,
        bottom: 0.4,
        left: 0.4,
        right: 0.4,
      },
    });

    // Save PDF file
    fs.writeFileSync(result.filePath, new Uint8Array(pdfData));

    // Close the hidden window
    pdfWindow.close();

    return { success: true, path: result.filePath };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: String(error) };
  }
});

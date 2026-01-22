# PDF Generator - הפקת PDF משלוח וציוד

Offline Windows desktop application for generating A4 RTL Hebrew PDFs with QR codes for shipment and equipment data.

## Tech Stack

- **Electron** - Desktop application framework
- **React + TypeScript** - UI framework
- **Vite** - Build tool
- **MUI (Material-UI)** - Component library
- **qrcode** - QR code generation
- **electron-builder** - Windows packaging

## Prerequisites

- Node.js 18+
- npm 9+

## Installation

```bash
npm install
```

## Development

Run the app in development mode:

```bash
npm run dev
```

This will:

1. Start the Vite dev server on `http://localhost:5173`
2. Wait for the server to be ready
3. Launch Electron with hot reload

## Build

Build the renderer and compile Electron TypeScript:

```bash
npm run build
```

## Create Windows Installer

Create Windows NSIS installer and portable executable:

```bash
npm run dist
```

Output will be in the `release/` directory:

- `PDF Generator Setup x.x.x.exe` - NSIS installer
- `PDF Generator x.x.x.exe` - Portable executable

---

## Logo Assets

### Required Files

Place your logo images in the `assets/` folder with these **exact filenames**:

| Filename          | Position in PDF      | Description                  |
| ----------------- | -------------------- | ---------------------------- |
| `logo_left_1.png` | Header left (first)  | First logo on the left side  |
| `logo_left_2.png` | Header left (second) | Second logo on the left side |
| `logo_right.png`  | Header right         | Logo on the right side       |

### Recommended Dimensions

- Maximum height: 60px
- Maximum width: 80px
- Format: PNG with transparent background

### Missing Logos

If a logo file is missing, the PDF will display a placeholder box with "LOGO MISSING" text. The layout will remain stable.

---

## Data Model

### Shipment Fields (4 fields)

| Field          | Hebrew Label    | Required            |
| -------------- | --------------- | ------------------- |
| shipmentNumber | מס' תעודת משלוח | ✅ Yes              |
| customer       | לקוח            | ✅ Yes              |
| supplyDate     | מועד אספקת ציוד | ✅ Yes (DD/MM/YYYY) |
| poc            | פרטי POC        | ❌ No               |

### Equipment Columns (9 columns)

| #   | Hebrew Header | Field Key        | Description         |
| --- | ------------- | ---------------- | ------------------- |
| 1   | מס"ד          | rowNum           | Row sequence number |
| 2   | מס' יצרן      | manufacturerNum  | Manufacturer number |
| 3   | שם יצרן       | manufacturerName | Manufacturer name   |
| 4   | גרסת הציוד    | equipmentVersion | Equipment version   |
| 5   | מק"ט צהלי     | idfCatalog       | IDF catalog number  |
| 6   | מס' סיריאלי   | serialNum        | Serial number       |
| 7   | כמות רכש      | purchaseQty      | Purchase quantity   |
| 8   | כמות לבדיקה   | testQty          | Test quantity       |
| 9   | הזמנת רכש     | purchaseOrder    | Purchase order      |

---

## QR Payload Format Specification

### CleanText Function

Before encoding, all values are processed through CleanText:

- Remove carriage returns (`\r`)
- Remove newlines (`\n`)
- Remove bell characters (`\x07`)
- Trim whitespace from start/end

### Shipment QR Payload

**Format:**

```
"1|{shipmentNumber}|{customer}|{supplyDate}|{poc}"
```

**Examples:**

With POC filled:

```
1|8564231|לקוח א|08/01/2026|דני כהן
```

With POC empty (note trailing separator):

```
1|8564231|לקוח א|08/01/2026|
```

### Equipment QR Payload

**Format:**

```
"2^{row1}^{row2}^..."
```

Where each row contains 9 column values separated by `|`:

```
{rowNum}|{manufacturerNum}|{manufacturerName}|{equipmentVersion}|{idfCatalog}|{serialNum}|{purchaseQty}|{testQty}|{purchaseOrder}
```

**Example (2 rows):**

```
2^1|123|SONY|145DL|16321545|8564231|1|2|PO-778^2|124|SONY|145DL|16321545|1254635|1|2|PO-779
```

---

## Verify Payload Examples

### Sample Input

**Shipment:**

- shipmentNumber: `8564231`
- customer: `לקוח א`
- supplyDate: `08/01/2026`
- poc: `` (empty)

**Equipment (2 rows):**

| מס"ד | מס' יצרן | שם יצרן | גרסת הציוד | מק"ט צהלי | מס' סיריאלי | כמות רכש | כמות לבדיקה | הזמנת רכש |
| ---- | -------- | ------- | ---------- | --------- | ----------- | -------- | ----------- | --------- |
| 1    | 123      | SONY    | 145DL      | 16321545  | 8564231     | 1        | 2           | PO-778    |
| 2    | 124      | SONY    | 145DL      | 16321545  | 1254635     | 1        | 2           | PO-779    |

### Expected Output

**Shipment QR String (str1):**

```
1|8564231|לקוח א|08/01/2026|
```

**Equipment QR String (str2):**

```
2^1|123|SONY|145DL|16321545|8564231|1|2|PO-778^2|124|SONY|145DL|16321545|1254635|1|2|PO-779
```

---

## Project Structure

```
Barcode-app/
├── electron/
│   ├── main.ts              # Electron main process
│   └── preload.ts           # Preload script (IPC bridge)
├── src/
│   ├── components/
│   │   ├── AppHeader.tsx    # App bar component
│   │   ├── ShipmentForm.tsx # Shipment form (4 fields)
│   │   ├── EquipmentTable.tsx # Equipment table (9 columns)
│   │   └── PreviewModal.tsx # PDF preview dialog
│   ├── utils/
│   │   ├── cleanText.ts     # CleanText function
│   │   ├── qrGenerator.ts   # QR payload builders
│   │   └── pdfTemplate.ts   # HTML template for PDF
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   ├── App.tsx              # Main application
│   ├── main.tsx             # React entry point
│   └── theme.ts             # MUI theme
├── assets/                  # Logo images (user-provided)
│   ├── logo_left_1.png
│   ├── logo_left_2.png
│   └── logo_right.png
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.electron.json
├── vite.config.ts
├── electron-builder.json
└── README.md
```

---

## Future Changes

The equipment table has 9 fixed columns. To add/modify columns:

1. Update `EquipmentRow` interface in `src/types/index.ts`
2. Update `columns` array in `src/components/EquipmentTable.tsx`
3. Update `buildEquipmentPayload()` in `src/utils/qrGenerator.ts`
4. Update table headers in `src/utils/pdfTemplate.ts`

The code is structured to make column changes relatively straightforward.

---

## License

MIT
# shipmentQRcodes

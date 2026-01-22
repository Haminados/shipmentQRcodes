import React, { useState, useCallback, useEffect } from 'react';
import {
  Container,
  Box,
  Alert,
  Snackbar,
} from '@mui/material';

import AppHeader from './components/AppHeader';
import ShipmentForm from './components/ShipmentForm';
import EquipmentTable from './components/EquipmentTable';
import PreviewModal from './components/PreviewModal';

import type { ShipmentData, EquipmentRow } from './types';
import {
  buildShipmentPayload,
  buildEquipmentPayload,
  buildSingleRowPayload,
  generateQrDataUrl,
} from './utils/qrGenerator';
import { generatePdfHtml } from './utils/pdfTemplate';

const App: React.FC = () => {
  // Shipment state
  const [shipment, setShipment] = useState<ShipmentData>({
    shipmentNumber: '',
    customer: '',
    supplyDate: '',
    poc: '',
  });

  // Equipment state
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [nextId, setNextId] = useState(1);

  // UI state
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Logo data URLs
  const [logos, setLogos] = useState({
    logoLeft1: '',
    logoLeft2: '',
    logoRight: '',
  });

  // Load logos on mount
  useEffect(() => {
    const loadLogos = async () => {
      try {
        const [left1, left2, right] = await Promise.all([
          window.stickerApi.getAssetDataUrl('logo_left_1.png'),
          window.stickerApi.getAssetDataUrl('logo_left_2.png'),
          window.stickerApi.getAssetDataUrl('logo_right.png'),
        ]);
        setLogos({
          logoLeft1: left1,
          logoLeft2: left2,
          logoRight: right,
        });
      } catch (error) {
        console.error('Error loading logos:', error);
      }
    };
    loadLogos();
  }, []);

  // Validation
  const isShipmentValid =
    shipment.shipmentNumber.trim() !== '' &&
    shipment.customer.trim() !== '' &&
    shipment.supplyDate.trim() !== '';

  const hasEquipmentData = equipment.some((row) =>
    Object.entries(row)
      .filter(([key]) => key !== 'id')
      .some(([, value]) => String(value).trim() !== '')
  );

  const canGeneratePdf = isShipmentValid && hasEquipmentData;

  // Generate HTML for PDF/Preview
  const generateHtml = useCallback(async (): Promise<string> => {
    // Generate QRs
    const shipmentPayload = buildShipmentPayload(shipment);

    // Generate main QRs and per-row QRs
    const rowQrPromises = equipment.map(row =>
      generateQrDataUrl(buildSingleRowPayload(row))
    );

    const [shipmentQr, equipmentQr, ...rowQrs] = await Promise.all([
      generateQrDataUrl(shipmentPayload),
      generateQrDataUrl(buildEquipmentPayload(equipment)),
      ...rowQrPromises
    ]);

    return generatePdfHtml(shipment, equipment, shipmentQr, equipmentQr, rowQrs, logos);
  }, [shipment, equipment, logos]);

  // Handle PDF generation
  const handleGeneratePdf = async () => {
    if (!canGeneratePdf) return;

    setLoading(true);
    try {
      const html = await generateHtml();
      const result = await window.stickerApi.savePdf(html);

      if (result.success) {
        setSnackbar({
          open: true,
          message: `PDF נשמר בהצלחה: ${result.path}`,
          severity: 'success',
        });
      } else if (result.error !== 'Cancelled by user') {
        setSnackbar({
          open: true,
          message: `שגיאה ביצירת PDF: ${result.error}`,
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `שגיאה: ${String(error)}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle preview
  const handlePreview = async () => {
    if (!canGeneratePdf) return;

    setLoading(true);
    try {
      const html = await generateHtml();
      setPreviewHtml(html);
      setPreviewOpen(true);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `שגיאה ביצירת תצוגה מקדימה: ${String(error)}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader
        onGeneratePdf={handleGeneratePdf}
        onPreview={handlePreview}
        canGenerate={canGeneratePdf}
        loading={loading}
      />

      <Container maxWidth="xl" sx={{ pb: 4 }}>
        {/* Validation Alert */}
        {!canGeneratePdf && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {!isShipmentValid && 'יש למלא את כל שדות המשלוח החובה (מס\' תעודה, לקוח, מועד אספקה). '}
            {!hasEquipmentData && 'יש להוסיף לפחות שורת ציוד אחת עם נתונים.'}
          </Alert>
        )}

        {/* Shipment Form */}
        <ShipmentForm shipment={shipment} onChange={setShipment} />

        {/* Equipment Table */}
        <EquipmentTable
          equipment={equipment}
          onChange={setEquipment}
          nextId={nextId}
          setNextId={setNextId}
        />
      </Container>

      {/* Preview Modal */}
      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        htmlContent={previewHtml}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default App;

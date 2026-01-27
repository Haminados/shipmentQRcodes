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
    pocName: '',
    pocPhone: '',
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
    logoLeft2: '',
    logoRight: '',
  });

  // Load logos on mount - use static paths for web
  useEffect(() => {
    setLogos({
      logoLeft2: './assets/logo_left_2.png',
      logoRight: './assets/logo_right.png',
    });
  }, []);

  // Validation
  const isShipmentValid =
    shipment.shipmentNumber.trim() !== '' &&
    shipment.customer.trim() !== '' &&
    shipment.supplyDate.trim() !== '';

  const areEquipmentRowsValid = equipment.every((row) =>
    row.manufacturerName.trim() !== '' &&
    row.manufacturerNum.trim() !== '' &&
    row.testQty.trim() !== ''
  );

  const hasEquipmentData = equipment.some((row) =>
    Object.entries(row)
      .filter(([key]) => key !== 'id')
      .some(([, value]) => String(value).trim() !== '')
  );

  const canGeneratePdf = isShipmentValid && hasEquipmentData && areEquipmentRowsValid;

  // Generate HTML for PDF/Preview
  const generateHtml = useCallback(async (): Promise<string> => {
    // Generate QRs
    const shipmentPayload = buildShipmentPayload(shipment);

    const rowQrPromises = equipment.map(row =>
      generateQrDataUrl(buildSingleRowPayload(row))
    );

    const [shipmentQr, ...rowQrs] = await Promise.all([
      generateQrDataUrl(shipmentPayload),
      ...rowQrPromises
    ]);

    return generatePdfHtml(shipment, equipment, shipmentQr, rowQrs, logos);
  }, [shipment, equipment, logos]);

  // Handle PDF generation - open print dialog in browser
  const handleGeneratePdf = async () => {
    if (!canGeneratePdf) return;

    setLoading(true);
    try {
      const html = await generateHtml();

      // Open a new window with the PDF content for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        setSnackbar({
          open: true,
          message: 'לא ניתן לפתוח חלון הדפסה. בדוק שחוסם חלונות קופצים מושבת.',
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
            {!areEquipmentRowsValid && 'חובה למלא בכל השורות: שם יצרן, מס׳ יצרן, כמות בדיקה. '}
            {(!hasEquipmentData && areEquipmentRowsValid) && 'יש להוסיף לפחות שורת ציוד אחת עם נתונים.'}
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

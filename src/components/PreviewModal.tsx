import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  htmlContent: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ open, onClose, htmlContent }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>תצוגה מקדימה</span>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'grey.500' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            bgcolor: '#f5f5f5',
            display: 'flex',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <Box
            sx={{
              width: '210mm',
              minHeight: '297mm',
              bgcolor: 'white',
              boxShadow: 3,
            }}
          >
            <iframe
              srcDoc={htmlContent}
              title="PDF Preview"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                minHeight: '297mm',
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          סגור
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PreviewModal;

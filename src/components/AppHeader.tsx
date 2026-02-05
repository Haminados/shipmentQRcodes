import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PreviewIcon from '@mui/icons-material/Preview';

interface AppHeaderProps {
  onGeneratePdf: () => void;
  onPreview: () => void;
  canGenerate: boolean;
  loading: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onGeneratePdf,
  onPreview,
  canGenerate,
  loading,
}) => {
  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar sx={{ gap: 2 }}>
        <DescriptionIcon />
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
          הפקת PDF משלוח וציוד
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={<PreviewIcon />}
            onClick={onPreview}
            disabled={!canGenerate || loading}
            sx={{
              bgcolor: 'rgba(255,255,255,0.15)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
            }}
          >
            תצוגה מקדימה
          </Button>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
            onClick={onGeneratePdf}
            disabled={!canGenerate || loading}
            sx={{
              bgcolor: '#4caf50',
              '&:hover': { bgcolor: '#45a049' }
            }}
          >
            צור תעודת משלוח
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;

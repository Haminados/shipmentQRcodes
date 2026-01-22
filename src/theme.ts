import { createTheme } from '@mui/material/styles';

/**
 * MUI Theme with RTL direction for Hebrew
 * Note: RTL is properly enforced via CacheProvider + stylis-plugin-rtl in main.tsx
 */
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: '"Rubik", "Arial", sans-serif',
  },
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiButton: {
      defaultProps: {
        variant: 'contained',
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          textAlign: 'right',
        },
      },
    },
  },
});

export default theme;

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0a0f2c', // Midnight Blue
      light: '#1a1f3c',
      dark: '#050a1c',
      contrastText: '#fdfdfd', // Snow White
    },
    secondary: {
      main: '#d4af37', // Champagne Gold
      light: '#e4bf47',
      dark: '#c49f27',
      contrastText: '#0a0f2c', // Midnight Blue
    },
    background: {
      default: '#0a0f2c', // Midnight Blue
      paper: '#1a1f3c', // Lighter Midnight Blue
    },
    text: {
      primary: '#fdfdfd', // Snow White
      secondary: '#d4af37', // Champagne Gold for secondary text
    },
    error: {
      main: '#d4af37', // Champagne Gold for errors
    },
    warning: {
      main: '#d4af37', // Champagne Gold for warnings
    },
    info: {
      main: '#d4af37', // Champagne Gold for info
      light: '#e4bf47',
      dark: '#c49f27',
      contrastText: '#0a0f2c',
    },
    success: {
      main: '#d4af37', // Champagne Gold for success
    },
    divider: 'rgba(255, 255, 255, 0.1)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      color: '#d4af37', // Champagne Gold for main headings
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      color: '#d4af37', // Champagne Gold for secondary headings
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      color: '#fdfdfd',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#fdfdfd',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      color: '#fdfdfd',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      color: '#fdfdfd',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: '#d4af37',
          color: '#d4af37',
          '&:hover': {
            borderColor: '#e4bf47',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1a1f3c',
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.1)',
          '&:hover': {
            border: '1px solid rgba(212, 175, 55, 0.2)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0a0f2c',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          borderColor: '#d4af37',
          '&.MuiChip-outlined': {
            borderColor: '#d4af37',
            color: '#d4af37',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(212, 175, 55, 0.2)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#d4af37',
          '&:hover': {
            color: '#e4bf47',
          },
        },
      },
    },
  },
}); 
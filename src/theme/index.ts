import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#e6c200',
      contrastText: '#181a20',
    },
    secondary: {
      main: '#e6c200',
      contrastText: '#181a20',
    },
    background: {
      default: '#181a20',
      paper: '#23262f',
    },
    text: {
      primary: '#f4f4f7',
      secondary: '#b0b3b8',
      disabled: '#393a40',
    },
    divider: '#3a3d4d',
    error: {
      main: '#ff5370',
    },
    warning: {
      main: '#e6c200',
    },
    info: {
      main: '#e6c200',
      contrastText: '#181a20',
    },
    success: {
      main: '#e6c200',
    },
    accent: {
      main: '#e6c200',
    },
    outline: '#3a3d4d',
    surface: '#23262f',
    surfaceVariant: '#2d303a',
    onSurface: '#f4f4f7',
    onBackground: '#f4f4f7',
    onPrimary: '#181a20',
    onSecondary: '#181a20',
    placeholder: '#6c6f7e',
    backdrop: 'rgba(20, 21, 26, 0.7)',
    disabled: '#393a40',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      color: '#e6c200',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      color: '#e6c200',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      color: '#f4f4f7',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#f4f4f7',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      color: '#f4f4f7',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      color: '#f4f4f7',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#f4f4f7',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#f4f4f7',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: '0 4px 12px rgba(24,26,32,0.12)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(24,26,32,0.18)',
          },
        },
        outlined: {
          borderColor: '#e6c200',
          color: '#e6c200',
          borderRadius: 10,
          '&:hover': {
            borderColor: '#e6c200',
            backgroundColor: 'rgba(230, 194, 0, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#23262f',
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(24,26,32,0.12)',
          border: '1px solid #3a3d4d',
          '&:hover': {
            border: '1px solid #e6c200',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#181a20',
          boxShadow: '0 2px 4px rgba(24,26,32,0.12)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          borderColor: '#e6c200',
          color: '#e6c200',
          backgroundColor: '#23262f',
          '&.MuiChip-outlined': {
            borderColor: '#e6c200',
            color: '#e6c200',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#3a3d4d',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:hover': {
            backgroundColor: 'rgba(230, 194, 0, 0.04)',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#e6c200',
          '&:hover': {
            color: '#f4f4f7',
          },
        },
      },
    },
  },
}); 
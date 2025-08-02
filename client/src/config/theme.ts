import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
        size: 'medium'
      },
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: '48px' // Ensure touch-friendly height
          }
        }
      }
    },
    MuiButton: {
      defaultProps: {
        size: 'large'
      },
      styleOverrides: {
        root: {
          minHeight: '48px', // Touch-friendly button height
          fontSize: '1rem'
        }
      }
    },
    MuiFab: {
      styleOverrides: {
        root: {
          minWidth: '48px',
          minHeight: '48px'
        }
      }
    }
  }
});
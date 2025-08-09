import { createTheme } from '@mui/material/styles';

// Common gradients used throughout the app
export const gradients = {
  primary: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
  headerWelcome: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  statsOverview: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  countriesCard: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  neighborhoodsCard: 'linear-gradient(135deg, #400B8B 0%, #B07FF6 100%)'
};

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  // Add custom gradients to theme
  gradients,
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
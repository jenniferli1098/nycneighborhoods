import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    gradients: {
      primary: string;
      headerWelcome: string;
      statsOverview: string;
      countriesCard: string;
      neighborhoodsCard: string;
    };
  }

  interface ThemeOptions {
    gradients?: {
      primary?: string;
      headerWelcome?: string;
      statsOverview?: string;
      countriesCard?: string;
      neighborhoodsCard?: string;
    };
  }
}
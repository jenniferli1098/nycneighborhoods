import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  CircularProgress,
  useMediaQuery,
  useTheme,
  IconButton
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CacheProvider } from './contexts/CacheContext';
import { SettingsProvider } from './contexts/SettingsContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import NeighborhoodsPage from './pages/NeighborhoodsPage';
import CountriesPage from './pages/CountriesPage';
import UserDashboard from './pages/UserDashboard';
import SettingsPage from './pages/SettingsPage';
import MobileDrawer from './components/Navigation/MobileDrawer';
import DesktopTabs from './components/Navigation/DesktopTabs';
import { useNavigation } from './hooks/useNavigation';
import { theme } from './config/theme';



const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const { 
    isMobile, 
    mobileDrawerOpen, 
    mobileNeighborhoodsOpen, 
    openMobileDrawer, 
    closeMobileDrawer, 
    toggleNeighborhoods 
  } = useNavigation();

  return (
    <>
      <AppBar position="sticky" sx={{ background: theme.gradients.primary, top: 0, zIndex: 1100 }}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {isMobile && user && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={openMobileDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            Travel Bucket List
          </Typography>
          {user && !isMobile && (
            <>
              <DesktopTabs />
              <Box className="flex items-center gap-4">
                <Typography variant="body1" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  Welcome, {user.username}!
                </Typography>
                <Button color="inherit" onClick={logout}>
                  Logout
                </Button>
              </Box>
            </>
          )}
          {user && isMobile && (
            <Button color="inherit" onClick={logout} size="small" sx={{ ml: 1 }}>
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>
      {isMobile && (
        <MobileDrawer 
          open={mobileDrawerOpen}
          onClose={closeMobileDrawer}
          neighborhoodsOpen={mobileNeighborhoodsOpen}
          onToggleNeighborhoods={toggleNeighborhoods}
        />
      )}
    </>
  );
};

const MainApp: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <SettingsProvider>
      <Box 
        className="h-screen flex flex-col" 
        sx={{ 
          overflow: 'hidden',
          '& .leaflet-container': {
            height: isMobile ? 'calc(100vh - 56px)' : 'calc(100vh - 64px)',
            touchAction: 'pan-x pan-y'
          }
        }}
      >
        <Navigation />
        <Box sx={{ 
          flex: 1, 
          overflow: 'hidden',
          '& > *': {
            height: '100%'
          }
        }}>
          <Routes>
            <Route path="/" element={<UserDashboard />} />
            <Route path="/neighborhoods/:mapName" element={<NeighborhoodsPage />} />
            <Route path="/countries" element={<CountriesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Box>
      </Box>
    </SettingsProvider>
  );
};

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <>
      {isLogin ? (
        <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CacheProvider>
          <Router>
            <AppContent />
          </Router>
        </CacheProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  return user ? <MainApp /> : <AuthScreen />;
};

export default App;

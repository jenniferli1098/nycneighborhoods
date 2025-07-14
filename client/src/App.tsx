import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  CircularProgress,
  Tabs,
  Tab,
  Menu,
  MenuItem
} from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CacheProvider } from './contexts/CacheContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import NeighborhoodsPage from './pages/NeighborhoodsPage';
import BostonNeighborhoodsPage from './pages/BostonNeighborhoodsPage';
import CountriesPage from './pages/CountriesPage';
import UserDashboard from './pages/UserDashboard';
import SettingsPage from './pages/SettingsPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});


const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { settings, availableMaps } = useSettings();
  const [neighborhoodMenuAnchor, setNeighborhoodMenuAnchor] = useState<null | HTMLElement>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'neighborhoods-menu') {
      return; // Don't navigate for the dropdown trigger
    }
    navigate(newValue);
  };

  const handleNeighborhoodMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setNeighborhoodMenuAnchor(event.currentTarget);
  };

  const handleNeighborhoodMenuClose = () => {
    setNeighborhoodMenuAnchor(null);
  };

  const handleNeighborhoodSelect = (route: string) => {
    navigate(route);
    handleNeighborhoodMenuClose();
  };

  // Separate neighborhoods from other maps
  const neighborhoodMaps = availableMaps.filter(map => 
    map.category === 'neighborhood' && settings.visibleMaps.includes(map.id)
  );
  const otherMaps = availableMaps.filter(map => 
    map.category === 'other' && settings.visibleMaps.includes(map.id)
  );

  // Check if current path is a neighborhood route
  const isNeighborhoodRoute = neighborhoodMaps.some(map => map.route === location.pathname);
  const currentNeighborhoodValue = isNeighborhoodRoute ? 'neighborhoods-menu' : location.pathname;

  return (
    <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)', top: 0, zIndex: 1100 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Travel Bucket List
        </Typography>
        {user && (
          <>
            <Tabs 
              value={currentNeighborhoodValue} 
              onChange={handleTabChange}
              sx={{ 
                mr: 3,
                '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .Mui-selected': { color: 'white !important' },
                '& .MuiTabs-indicator': { backgroundColor: 'white' }
              }}
            >
              <Tab label="Dashboard" value="/" />
              
              {/* Neighborhoods Dropdown */}
              {neighborhoodMaps.length > 0 && (
                <Tab 
                  label="Neighborhoods ▼" 
                  value="neighborhoods-menu"
                  onClick={handleNeighborhoodMenuClick}
                />
              )}
              
              {/* Other Maps */}
              {otherMaps.map(map => (
                <Tab key={map.id} label={map.name} value={map.route} />
              ))}
              
              <Tab label="Settings" value="/settings" />
            </Tabs>

            {/* Neighborhoods Dropdown Menu */}
            <Menu
              anchorEl={neighborhoodMenuAnchor}
              open={Boolean(neighborhoodMenuAnchor)}
              onClose={handleNeighborhoodMenuClose}
              sx={{
                '& .MuiPaper-root': {
                  backgroundColor: 'white',
                  boxShadow: 3
                }
              }}
            >
              {neighborhoodMaps.map(map => (
                <MenuItem 
                  key={map.id} 
                  onClick={() => handleNeighborhoodSelect(map.route)}
                  selected={location.pathname === map.route}
                >
                  {map.name}
                </MenuItem>
              ))}
            </Menu>

            <Box className="flex items-center gap-4">
              <Typography variant="body1">
                Welcome, {user.username}!
              </Typography>
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

const MainApp: React.FC = () => {
  return (
    <SettingsProvider>
      <Box className="h-screen flex flex-col" sx={{ overflow: 'hidden' }}>
        <Navigation />
        <Routes>
          <Route path="/" element={<UserDashboard />} />
          <Route path="/neighborhoods" element={<NeighborhoodsPage />} />
          <Route path="/boston" element={<BostonNeighborhoodsPage />} />
          <Route path="/countries" element={<CountriesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Box>
    </SettingsProvider>
  );
};

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <Box className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Box className="w-full max-w-md">
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </Box>
    </Box>
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

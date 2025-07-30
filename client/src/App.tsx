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
  MenuItem,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Collapse
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CacheProvider } from './contexts/CacheContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import NeighborhoodsPage from './pages/NeighborhoodsPage';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [neighborhoodMenuAnchor, setNeighborhoodMenuAnchor] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileNeighborhoodsOpen, setMobileNeighborhoodsOpen] = useState(false);

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
    setMobileDrawerOpen(false);
  };

  const handleMobileNavSelect = (route: string) => {
    navigate(route);
    setMobileDrawerOpen(false);
  };

  const toggleMobileNeighborhoods = () => {
    setMobileNeighborhoodsOpen(!mobileNeighborhoodsOpen);
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

  // Mobile Navigation Drawer Component
  const MobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileDrawerOpen}
      onClose={() => setMobileDrawerOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          backgroundColor: '#f8fafc',
          paddingTop: 2
        }
      }}
    >
      <Box sx={{ padding: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1E40AF', mb: 3 }}>
          Travel Bucket List
        </Typography>
        <List>
          <ListItem sx={{ p: 0 }}>
            <ListItemButton
              onClick={() => handleMobileNavSelect('/')}
              sx={{ 
                borderRadius: 2, 
                mb: 1,
                backgroundColor: location.pathname === '/' ? '#E0E7FF' : 'transparent',
                '&:hover': { backgroundColor: '#F1F5F9' }
              }}
            >
              <ListItemText 
                primary="Dashboard" 
                primaryTypographyProps={{ fontWeight: location.pathname === '/' ? 'bold' : 'normal' }}
              />
            </ListItemButton>
          </ListItem>
          
          {neighborhoodMaps.length > 0 && (
            <>
              <ListItem sx={{ p: 0 }}>
                <ListItemButton
                  onClick={toggleMobileNeighborhoods}
                  sx={{ 
                    borderRadius: 2, 
                    mb: 1,
                    backgroundColor: isNeighborhoodRoute ? '#E0E7FF' : 'transparent',
                    '&:hover': { backgroundColor: '#F1F5F9' }
                  }}
                >
                  <ListItemText 
                    primary="Neighborhoods" 
                    primaryTypographyProps={{ fontWeight: isNeighborhoodRoute ? 'bold' : 'normal' }}
                  />
                  {mobileNeighborhoodsOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={mobileNeighborhoodsOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {neighborhoodMaps.map(map => (
                    <ListItem key={map.id} sx={{ p: 0 }}>
                      <ListItemButton
                        onClick={() => handleNeighborhoodSelect(map.route)}
                        sx={{ 
                          pl: 4, 
                          borderRadius: 2, 
                          mb: 0.5,
                          backgroundColor: location.pathname === map.route ? '#DDD6FE' : 'transparent',
                          '&:hover': { backgroundColor: '#F1F5F9' }
                        }}
                      >
                        <ListItemText 
                          primary={map.name} 
                          primaryTypographyProps={{ 
                            fontSize: '0.9rem',
                            fontWeight: location.pathname === map.route ? 'bold' : 'normal'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </>
          )}
          
          {otherMaps.map(map => (
            <ListItem key={map.id} sx={{ p: 0 }}>
              <ListItemButton
                onClick={() => handleMobileNavSelect(map.route)}
                sx={{ 
                  borderRadius: 2, 
                  mb: 1,
                  backgroundColor: location.pathname === map.route ? '#E0E7FF' : 'transparent',
                  '&:hover': { backgroundColor: '#F1F5F9' }
                }}
              >
                <ListItemText 
                  primary={map.name} 
                  primaryTypographyProps={{ fontWeight: location.pathname === map.route ? 'bold' : 'normal' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          
          <ListItem sx={{ p: 0 }}>
            <ListItemButton
              onClick={() => handleMobileNavSelect('/settings')}
              sx={{ 
                borderRadius: 2, 
                mb: 1,
                backgroundColor: location.pathname === '/settings' ? '#E0E7FF' : 'transparent',
                '&:hover': { backgroundColor: '#F1F5F9' }
              }}
            >
              <ListItemText 
                primary="Settings" 
                primaryTypographyProps={{ fontWeight: location.pathname === '/settings' ? 'bold' : 'normal' }}
              />
            </ListItemButton>
          </ListItem>
        </List>
        
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #E2E8F0' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Welcome, {user?.username}!
          </Typography>
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={() => {
              logout();
              setMobileDrawerOpen(false);
            }}
            sx={{ 
              borderColor: '#EF4444',
              color: '#EF4444',
              '&:hover': {
                backgroundColor: '#FEF2F2',
                borderColor: '#DC2626'
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>
    </Drawer>
  );

  return (
    <>
      <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)', top: 0, zIndex: 1100 }}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {isMobile && user && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setMobileDrawerOpen(true)}
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
                <Typography variant="body1" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  Welcome, {user.username}!
                </Typography>
                <Button color="inherit" onClick={logout} size={isMobile ? 'small' : 'medium'}>
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
      {isMobile && <MobileDrawer />}
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
    <ThemeProvider theme={{
      ...theme,
      components: {
        ...theme.components,
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
    }}>
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

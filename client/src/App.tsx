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
  Tab
} from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import NeighborhoodsPage from './pages/NeighborhoodsPage';
import CountriesPage from './pages/CountriesPage';

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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  return (
    <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Travel Bucket List
        </Typography>
        {user && (
          <>
            <Tabs 
              value={location.pathname} 
              onChange={handleTabChange}
              sx={{ 
                mr: 3,
                '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .Mui-selected': { color: 'white !important' },
                '& .MuiTabs-indicator': { backgroundColor: 'white' }
              }}
            >
              <Tab label="NYC Neighborhoods" value="/" />
              <Tab label="Countries" value="/countries" />
            </Tabs>
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
    <Box className="h-screen flex flex-col" sx={{ overflow: 'hidden' }}>
      <Navigation />
      <Routes>
        <Route path="/" element={<NeighborhoodsPage />} />
        <Route path="/countries" element={<CountriesPage />} />
      </Routes>
    </Box>
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
        <Router>
          <AppContent />
        </Router>
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

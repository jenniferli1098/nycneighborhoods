import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Grid, 
  CircularProgress,
  Alert
} from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import NYCMap from './components/Map';
import NeighborhoodList from './components/NeighborhoodList';
import NeighborhoodDialog from './components/NeighborhoodDialog';
import axios from 'axios';

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

interface Neighborhood {
  _id: string;
  name: string;
  boroughId: string;
  description?: string;
  walkabilityScore?: number;
  averageVisitRating?: number;
  totalVisits?: number;
}

interface Borough {
  _id: string;
  name: string;
  description?: string;
}

const MainApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [geoJsonNeighborhoods, setGeoJsonNeighborhoods] = useState<any[]>([]);
  const [boroughs, setBoroughs] = useState<Borough[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<{ id: string; name: string; borough: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNeighborhoods();
    loadGeoJsonNeighborhoods();
    loadBoroughs();
  }, []);

  useEffect(() => {
    if (user) {
      fetchVisits();
    }
  }, [user]);

  const loadNeighborhoods = async () => {
    try {
      console.log('📡 App: Loading neighborhoods from API');
      const response = await axios.get('/api/neighborhoods');
      console.log('📝 App: Received neighborhoods data:', response.data);
      setNeighborhoods(response.data);
    } catch (err) {
      console.error('❌ App: Failed to load neighborhoods:', err);
      setError('Failed to load neighborhood data');
    } finally {
      setLoading(false);
    }
  };

  const loadGeoJsonNeighborhoods = async () => {
    try {
      console.log('📡 App: Loading GeoJSON neighborhoods for map');
      const response = await fetch('/data/nyc_neighborhoods_clean.geojson');
      const data = await response.json();
      console.log('📝 App: Received GeoJSON data:', data.features.length, 'features');
      setGeoJsonNeighborhoods(data.features);
    } catch (err) {
      console.error('❌ App: Failed to load GeoJSON neighborhoods:', err);
    }
  };

  const loadBoroughs = async () => {
    try {
      console.log('📡 App: Loading boroughs from API');
      const response = await axios.get('/api/boroughs');
      console.log('📝 App: Received boroughs data:', response.data);
      setBoroughs(response.data);
    } catch (err) {
      console.error('❌ App: Failed to load boroughs:', err);
    }
  };

  const fetchVisits = async () => {
    try {
      console.log('📡 App: Fetching visits from API');
      const response = await axios.get('/api/visits');
      console.log('📝 App: Received visits data:', response.data);
      console.log('📊 App: Number of visits:', response.data.length);
      
      // Log visited neighborhood IDs
      const visitedIds = response.data.filter(v => v.visited).map(v => v.neighborhoodId);
      console.log('🎯 App: Visited neighborhood IDs:', visitedIds);
      
      setVisits(response.data);
      console.log('✅ App: Visits state updated');
    } catch (err) {
      console.error('❌ App: Failed to fetch visits:', err);
    }
  };

  const handleNeighborhoodClick = (neighborhood: string, borough: string) => {
    console.log('🖱️ App: Neighborhood clicked (right-click for dialog):', neighborhood, borough);
    console.log('🔍 App: Available neighborhoods count:', neighborhoods.length);
    console.log('🔍 App: Borough mapping size:', boroughIdToName.size);
    
    // Find the neighborhood ID from API neighborhoods
    const neighborhoodData = neighborhoods.find(n => {
      const mappedBorough = boroughIdToName.get(n.boroughId);
      console.log(`🔍 App: Comparing "${n.name}" === "${neighborhood}" && "${mappedBorough}" === "${borough}"`);
      return n.name === neighborhood && mappedBorough === borough;
    });
    
    if (neighborhoodData) {
      console.log('✅ App: Found neighborhood:', neighborhoodData);
      setSelectedNeighborhood({ 
        id: neighborhoodData._id, 
        name: neighborhood, 
        borough 
      });
    } else {
      console.error('❌ App: Could not find neighborhood ID for:', neighborhood, borough);
      console.log('📋 App: Available neighborhoods sample:', neighborhoods.slice(0, 5).map(n => `${n.name} - ${boroughIdToName.get(n.boroughId)}`));
      console.log('📋 App: Available boroughs:', Array.from(boroughIdToName.values()));
    }
  };

  const handleQuickVisit = async (neighborhood: string, borough: string) => {
    console.log('⚡ App: Quick visit (left-click) for:', neighborhood, borough);
    
    try {
      // Create a quick visit with just visited=true and today's date
      const visitData = {
        neighborhoodName: neighborhood,
        boroughName: borough,
        visited: true,
        notes: '',
        visitDate: new Date(),
        rating: null,
        walkabilityScore: null
      };
      
      console.log('📤 App: Creating quick visit:', visitData);
      const response = await axios.post('/api/visits', visitData);
      console.log('✅ App: Quick visit created successfully:', response.data);
      
      // Refresh data without page reload
      console.log('🔄 App: Refreshing visits data after quick visit...');
      await fetchVisits();
      console.log('🔄 App: Data refresh complete');
      
    } catch (error) {
      console.error('❌ App: Failed to create quick visit:', error);
    }
  };

  const handleCloseDialog = () => {
    console.log('❌ App: Dialog closed');
    setSelectedNeighborhood(null);
  };

  const handleSaveVisit = () => {
    console.log('💾 App: Visit saved, refetching visits');
    fetchVisits();
  };

  const visitedNeighborhoodIds = new Set(visits.filter(v => v.visited).map(v => v.neighborhoodId));
  console.log('🏠 App: Visited neighborhood IDs:', visitedNeighborhoodIds.size, Array.from(visitedNeighborhoodIds));

  // Create a set of visited neighborhood names for the map
  console.log('🔄 App: Creating visited neighborhood names mapping...');
  console.log('🏠 App: Available neighborhoods for mapping:', neighborhoods.length);
  console.log('🎯 App: Visited neighborhood IDs to map:', Array.from(visitedNeighborhoodIds));
  
  const visitedNeighborhoodNames = new Set(
    neighborhoods
      .filter(n => {
        const isVisited = visitedNeighborhoodIds.has(n._id);
        if (isVisited) {
          console.log(`✅ App: Mapping visited neighborhood: ${n.name} (ID: ${n._id})`);
        }
        return isVisited;
      })
      .map(n => n.name)
  );
  console.log('🏠 App: Final visited neighborhood names for map:', visitedNeighborhoodNames.size, Array.from(visitedNeighborhoodNames));

  const boroughIdToName = new Map<string, string>();

  for (const borough of boroughs) {
    boroughIdToName.set(borough._id, borough.name);
  }
  
  console.log('🏘️ App: Borough mapping complete:', boroughIdToName.size, 'boroughs loaded');

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="flex justify-center items-center h-screen">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box className="h-screen flex flex-col">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            NYC Neighborhood Bucket List
          </Typography>
          {user && (
            <Box className="flex items-center gap-4">
              <Typography variant="body1">
                Welcome, {user.username}!
              </Typography>
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box className="flex-1 p-4">
        <Grid container spacing={2} className="h-full">
          <Grid size={{ xs: 12, md: 4 }} className="h-full">
            <NeighborhoodList
              neighborhoods={neighborhoods}
              boroughs={boroughs}
              visits={visits}
              onNeighborhoodClick={handleNeighborhoodClick}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }} className="h-full">
            <Box className="h-full">
              <NYCMap
                neighborhoods={geoJsonNeighborhoods}
                visitedNeighborhoods={visitedNeighborhoodNames}
                onNeighborhoodClick={handleNeighborhoodClick}
                onNeighborhoodQuickVisit={handleQuickVisit}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {selectedNeighborhood && (
        <NeighborhoodDialog
          open={!!selectedNeighborhood}
          onClose={handleCloseDialog}
          neighborhoodId={selectedNeighborhood.id}
          neighborhood={selectedNeighborhood.name}
          borough={selectedNeighborhood.borough}
          onSave={handleSaveVisit}
        />
      )}
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
        <AppContent />
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

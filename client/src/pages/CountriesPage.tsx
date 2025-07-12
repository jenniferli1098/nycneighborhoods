import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { countriesApi, type Country } from '../services/countriesApi';
import { visitsApi, type Visit } from '../services/visitsApi';
import WorldMap from '../components/WorldMap';
import CountryDialog from '../components/CountryDialog';

const CountriesPage: React.FC = () => {
  const { user } = useAuth();
  const [countries, setCountries] = useState<Country[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [geoJsonCountries, setGeoJsonCountries] = useState<any[]>([]);
  const [continents, setContinents] = useState<string[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('');
  const [currentView, setCurrentView] = useState<'map' | 'grid'>('map');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  useEffect(() => {
    loadCountries();
    loadContinents();
    loadGeoJsonCountries();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCountryVisits();
    }
  }, [user]);

  useEffect(() => {
    filterCountries();
  }, [countries, searchQuery, selectedContinent]);

  const loadCountries = async () => {
    try {
      console.log('📡 CountriesPage: Loading countries from API');
      const countries = await countriesApi.getAllCountries();
      console.log('📝 CountriesPage: Received countries data:', countries.length, 'countries');
      setCountries(countries);
    } catch (err) {
      console.error('❌ CountriesPage: Failed to load countries:', err);
      setError('Failed to load countries data');
    } finally {
      setLoading(false);
    }
  };

  const loadContinents = async () => {
    try {
      console.log('📡 CountriesPage: Loading continents from API');
      const continents = await countriesApi.getContinents();
      console.log('📝 CountriesPage: Received continents data:', continents);
      setContinents(continents);
    } catch (err) {
      console.error('❌ CountriesPage: Failed to load continents:', err);
    }
  };

  const loadGeoJsonCountries = async () => {
    try {
      console.log('📡 CountriesPage: Loading GeoJSON countries for map');
      const data = await countriesApi.getGeoJsonCountries();
      console.log('📝 CountriesPage: Received GeoJSON data:', data.features.length, 'features');
      setGeoJsonCountries(data.features);
    } catch (err) {
      console.error('❌ CountriesPage: Failed to load GeoJSON countries:', err);
    }
  };

  const fetchCountryVisits = async () => {
    try {
      console.log('📡 CountriesPage: Fetching country visits from API');
      const allVisits = await visitsApi.getAllVisits();
      const countryVisits = allVisits.filter(visit => visit.visitType === 'country');
      console.log('📝 CountriesPage: Received country visits data:', countryVisits.length, 'visits');
      setVisits(countryVisits);
    } catch (err) {
      console.error('❌ CountriesPage: Failed to fetch country visits:', err);
    }
  };

  const filterCountries = () => {
    let filtered = [...countries];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by continent
    if (selectedContinent) {
      filtered = filtered.filter(country => country.continent === selectedContinent);
    }

    setFilteredCountries(filtered);
  };


  const getVisitedCountryIds = () => {
    return new Set(visits.filter(v => v.visited && v.countryId).map(v => v.countryId));
  };

  const getCountryStats = () => {
    const visitedIds = getVisitedCountryIds();
    const visitedByContinent: Record<string, number> = {};
    
    visitedIds.forEach(countryId => {
      const country = countries.find(c => c._id === countryId);
      if (country) {
        visitedByContinent[country.continent] = (visitedByContinent[country.continent] || 0) + 1;
      }
    });

    return {
      totalVisited: visitedIds.size,
      totalCountries: countries.length,
      visitedByContinent
    };
  };

  const handleCountryClick = (country: Country) => {
    console.log('🖱️ CountriesPage: Country clicked (right-click for dialog):', country.name);
    setSelectedCountry(country);
  };

  const handleCountryQuickVisit = async (country: Country) => {
    console.log('⚡ CountriesPage: Quick visit (left-click) for:', country.name);
    
    try {
      // Check if visit already exists
      const existingVisit = visits.find(v => v.countryId === country._id);
      
      if (existingVisit) {
        console.log('⚡ CountriesPage: Visit already exists, skipping to prevent data loss:', existingVisit);
        // Don't overwrite existing visit data - just return
        return;
      }

      // Only create new visit if none exists
      const visitData = {
        countryId: country._id,
        visited: true,
        notes: '',
        visitDate: new Date(),
        rating: null,
        category: null
      };
      
      console.log('📤 CountriesPage: Creating quick visit for:', country.name);
      const newVisit = await visitsApi.createCountryVisit(visitData);
      console.log('✅ CountriesPage: Quick visit created successfully:', newVisit);
      
      // Refresh visits data
      console.log('🔄 CountriesPage: Refreshing visits data after quick visit...');
      await fetchCountryVisits();
      console.log('🔄 CountriesPage: Data refresh complete');
      
    } catch (error) {
      console.error('❌ CountriesPage: Failed to create quick visit:', error);
    }
  };

  const handleCloseDialog = () => {
    console.log('❌ CountriesPage: Dialog closed');
    setSelectedCountry(null);
  };

  const handleSaveVisit = () => {
    console.log('💾 CountriesPage: Visit saved, refetching visits');
    fetchCountryVisits();
  };

  const stats = getCountryStats();
  const visitedCountryIds = getVisitedCountryIds();

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-full">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="flex justify-center items-center h-full">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box className="flex-1 flex">
      {/* Left Sidebar - Stats and Filters */}
      <Box className="w-80 border-r bg-white p-4" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Stats Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Countries Progress
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {stats.totalVisited} of {stats.totalCountries} countries visited
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                By Continent:
              </Typography>
              {Object.entries(stats.visitedByContinent).map(([continent, count]) => (
                <Chip
                  key={continent}
                  label={`${continent}: ${count}`}
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* View Toggle */}
        <Box sx={{ mb: 3 }}>
          <Tabs 
            value={currentView} 
            onChange={(_, newValue) => setCurrentView(newValue)}
            variant="fullWidth"
          >
            <Tab label="Map View" value="map" />
            <Tab label="Grid View" value="grid" />
          </Tabs>
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Search Countries"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth>
            <InputLabel>Filter by Continent</InputLabel>
            <Select
              value={selectedContinent}
              label="Filter by Continent"
              onChange={(e) => setSelectedContinent(e.target.value)}
            >
              <MenuItem value="">All Continents</MenuItem>
              {continents.map(continent => (
                <MenuItem key={continent} value={continent}>
                  {continent}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Typography variant="body2" color="text.secondary">
          {currentView === 'grid' 
            ? `Showing ${filteredCountries.length} countries`
            : `${stats.totalVisited} countries visited on map`
          }
        </Typography>
      </Box>
      
      {/* Main Content Area */}
      <Box className="flex-1" sx={{ overflow: 'hidden' }}>
        {currentView === 'map' ? (
          /* World Map */
          <WorldMap
            countries={geoJsonCountries}
            visitedCountries={visitedCountryIds}
            onCountryClick={handleCountryClick}
            onCountryQuickVisit={handleCountryQuickVisit}
            availableCountries={countries}
          />
        ) : (
          /* Countries Grid */
          <Box className="p-4" sx={{ overflow: 'auto', height: '100%' }}>
            <Grid container spacing={2}>
              {filteredCountries.map((country) => {
                const isVisited = visitedCountryIds.has(country._id);
                
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={country._id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        border: isVisited ? '2px solid #4caf50' : '1px solid #e0e0e0',
                        backgroundColor: isVisited ? '#f1f8e9' : 'white'
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" component="div" gutterBottom>
                          {country.name}
                        </Typography>
                        <Chip 
                          label={country.continent}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Code: {country.code}
                        </Typography>
                        {isVisited && (
                          <Chip 
                            label="Visited"
                            color="success"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </CardContent>
                      <CardActions>
                        {!isVisited ? (
                          <Button 
                            size="small" 
                            variant="contained"
                            onClick={() => handleQuickVisit(country)}
                          >
                            Mark as Visited
                          </Button>
                        ) : (
                          <Button size="small" variant="outlined" disabled>
                            Already Visited
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </Box>

      {selectedCountry && (
        <CountryDialog
          open={!!selectedCountry}
          onClose={handleCloseDialog}
          country={selectedCountry}
          onSave={handleSaveVisit}
          existingVisits={visits}
        />
      )}
    </Box>
  );
};

export default CountriesPage;
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
  InputLabel
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { countriesApi, type Country } from '../services/countriesApi';
import { visitsApi, type Visit } from '../services/visitsApi';
import WorldMap from '../components/WorldMap';
import CountryDialog from '../components/CountryDialog';
import CountryStatsCard from '../components/CountryStatsCard';

const CountriesPage: React.FC = () => {
  const { user } = useAuth();
  const [countries, setCountries] = useState<Country[]>([]);
  const [geoJsonCountries, setGeoJsonCountries] = useState<any[]>([]);
  const [continents, setContinents] = useState<string[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('');
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

  const getFilteredCountries = () => {
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

    return filtered;
  };


  const getVisitedCountryIds = () => {
    return new Set(visits.filter(v => v.visited && v.countryId).map(v => v.countryId!));
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
        countryName: country.name,
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
      <Box className="w-80 border-r bg-white" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, flexShrink: 0 }}>
          <CountryStatsCard 
            visits={visits}
            countries={countries}
            continents={continents}
          />
        </Box>


        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 2 }}>
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
            {stats.totalVisited} countries visited on map
          </Typography>
        </Box>
      </Box>
      
      {/* Main Content Area */}
      <Box className="flex-1" sx={{ overflow: 'hidden' }}>
        <WorldMap
          countries={geoJsonCountries}
          visitedCountries={visitedCountryIds}
          onCountryClick={handleCountryClick}
          onCountryQuickVisit={handleCountryQuickVisit}
          availableCountries={getFilteredCountries()}
        />
      </Box>

      {selectedCountry && (
        <CountryDialog
          open={!!selectedCountry}
          onClose={handleCloseDialog}
          country={selectedCountry}
          onSave={handleSaveVisit}
          existingVisits={visits}
          countries={countries}
          continents={continents}
        />
      )}
    </Box>
  );
};

export default CountriesPage;
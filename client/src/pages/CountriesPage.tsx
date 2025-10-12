import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { countriesApi, type Country } from '../services/countriesApi';
import { visitsApi, type Visit } from '../services/visitsApi';
import WorldMap from '../components/WorldMap';
import CountryDialog from '../components/CountryDialog';
import CountryStatsCard from '../components/CountryStatsCard';
import MapLegend from '../components/MapLegend';

/**
 * CountriesPage - Main page for country tracking and world map interaction
 * Features optimistic updates for fast user interactions
 * Uses country IDs throughout (unlike neighborhoods which use names)
 */
const CountriesPage: React.FC = () => {
  // Authentication context
  const { user } = useAuth();
  
  // Data state
  const [countries, setCountries] = useState<Country[]>([]); // Database countries
  const [geoJsonCountries, setGeoJsonCountries] = useState<any[]>([]); // GeoJSON for map rendering
  const [continents, setContinents] = useState<string[]>([]); // List of continents
  const [visits, setVisits] = useState<Visit[]>([]); // User visit data (optimistically updated)
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  // ============================================================================
  // DATA LOADING EFFECTS
  // ============================================================================
  
  // Load all static data on component mount
  useEffect(() => {
    loadCountries();
    loadContinents();
    loadGeoJsonCountries();
  }, []);

  // Load user visits when authentication state changes
  useEffect(() => {
    if (user) {
      fetchCountryVisits();
    }
  }, [user]);

  // ============================================================================
  // DATA LOADING FUNCTIONS
  // ============================================================================
  
  /**
   * Load country data from API
   */
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

  /**
   * Load continent list for statistics
   */
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

  /**
   * Load GeoJSON data for world map rendering
   */
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

  /**
   * Fetch user's country visits from server
   * Uses optimized getVisitsByType to only fetch country visits
   */
  const fetchCountryVisits = async () => {
    try {
      console.log('📡 CountriesPage: Fetching country visits from API');
      const countryVisits = await visitsApi.getVisitsByType('country');
      console.log('📝 CountriesPage: Received country visits data:', countryVisits.length, 'visits');

      setVisits(countryVisits);
    } catch (err) {
      console.error('❌ CountriesPage: Failed to fetch country visits:', err);
    }
  };



  // ============================================================================
  // DATA PROCESSING FUNCTIONS
  // ============================================================================
  
  /**
   * Get set of visited country IDs
   * Countries use IDs directly (unlike neighborhoods which convert to names)
   */
  const getVisitedCountryIds = () => {
    const visitedIds = visits
      .filter(v => v.visited && v.country)
      .map(v => {
        // Handle both populated country objects and string IDs
        const country = v.country!;
        return typeof country === 'string' ? country : (country as any)._id;
      });
    return new Set(visitedIds);
  };

  /**
   * Calculate country visit statistics
   * Groups visits by continent for stats display
   */
  const getCountryStats = () => {
    const visitedIds = getVisitedCountryIds();
    const visitedByContinent: Record<string, number> = {};
    
    // Get continent info directly from populated country data in visits
    visits
      .filter(v => v.visited && v.country)
      .forEach(visit => {
        const country = visit.country!;
        const continent = typeof country === 'string' 
          ? countries.find(c => c._id === country)?.continent
          : (country as any).continent;
        
        if (continent) {
          visitedByContinent[continent] = (visitedByContinent[continent] || 0) + 1;
        }
      });

    return {
      totalVisited: visitedIds.size,
      totalCountries: countries.length,
      visitedByContinent
    };
  };

  // ============================================================================
  // USER INTERACTION HANDLERS
  // ============================================================================
  
  /**
   * Handle country click (right-click for dialog)
   */
  const handleCountryClick = (country: Country) => {
    console.log('🖱️ CountriesPage: Country clicked (right-click for dialog):', country.name);
    setSelectedCountry(country);
  };
  
  /**
   * Check if visit has user-entered data (notes, rating, category)
   */
  const hasUserData = (visit: Visit): boolean => {
    return !!(visit.notes || visit.rating || visit.category);
  };
  
  /**
   * Apply optimistic update to local state
   */
  const applyOptimisticUpdate = (shouldDelete: boolean, existingVisit: Visit | undefined, country: Country) => {
    if (shouldDelete && existingVisit) {
      console.log('⚡ CountriesPage: Optimistically removing visit for:', country.name);
      setVisits(prevVisits => prevVisits.filter(v => v._id !== existingVisit._id));
    } else {
      console.log('⚡ CountriesPage: Optimistically adding visit for:', country.name);
      const optimisticVisit: Visit = {
        _id: `temp-${Date.now()}`,
        user: user?.id || '',
        visitType: 'country',
        country: country._id,
        visited: true,
        notes: '',
        visitDate: new Date().toISOString(),
        rating: null,
        category: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setVisits(prevVisits => [...prevVisits, optimisticVisit]);
    }
  };
  
  /**
   * Sync changes with server
   */
  const syncWithServer = async (shouldDelete: boolean, existingVisit: Visit | undefined, country: Country) => {
    if (shouldDelete && existingVisit) {
      await visitsApi.deleteVisit(existingVisit._id);
      console.log('✅ CountriesPage: Visit deleted successfully on server');
    } else {
      const visitData = {
        countryName: country.name,
        visited: true,
        notes: '',
        visitDate: new Date(),
        rating: null,
        category: null
      };
      
      const newVisit = await visitsApi.createCountryVisit(visitData);
      console.log('✅ CountriesPage: Visit created successfully on server:', newVisit);
      
      // Replace optimistic visit with real server data
      setVisits(prevVisits => 
        prevVisits.map(v => {
          const visitCountry = v.country;
          const countryId = typeof visitCountry === 'string' ? visitCountry : (visitCountry as any)?._id;
          return v._id.startsWith('temp-') && countryId === country._id
            ? newVisit 
            : v;
        })
      );
    }
  };
  
  /**
   * Handle quick country visit (left-click or tap)
   * Uses optimistic updates for instant UI feedback
   * Supports both create and delete operations
   */
  const handleCountryQuickVisit = async (country: Country) => {
    console.log('⚡ CountriesPage: Quick visit (left-click) for:', country.name);
    
    // Find existing visit
    const existingVisit = visits.find(v => {
      const visitCountry = v.country;
      const countryId = typeof visitCountry === 'string' ? visitCountry : (visitCountry as any)?._id;
      return countryId === country._id;
    });
    
    // Determine what action to take
    const shouldDelete = existingVisit && !hasUserData(existingVisit);
    const shouldSkip = existingVisit && !shouldDelete;
    
    if (shouldSkip) {
      console.log('⚡ CountriesPage: Visit already exists with user data, skipping to prevent data loss:', existingVisit);
      return;
    }
    
    try {
      // Step 1: OPTIMISTIC UPDATE - Update UI immediately
      applyOptimisticUpdate(!!shouldDelete, existingVisit, country);
      
      // Step 2: BACKGROUND SYNC - Sync with server
      await syncWithServer(!!shouldDelete, existingVisit, country);
      
    } catch (error) {
      console.error('❌ CountriesPage: Failed to sync quick visit with server:', error);
      
      // ROLLBACK: Revert optimistic update on error
      console.log('🔄 CountriesPage: Rolling back optimistic update due to error');
      await fetchCountryVisits();
    }
  };

  /**
   * Handle dialog close
   */
  const handleCloseDialog = () => {
    console.log('❌ CountriesPage: Dialog closed');
    setSelectedCountry(null);
  };

  /**
   * Handle visit save from dialog
   * Uses optimistic update when visit data is provided
   */
  const handleSaveVisit = async (updatedVisit?: Visit) => {
    console.log('💾 CountriesPage: Visit saved, optimistically updating local state');
    
    if (updatedVisit) {
      setVisits(prevVisits => 
        prevVisits.map(v => 
          v._id === updatedVisit._id ? updatedVisit : v
        )
      );
    } else {
      console.log('🔄 CountriesPage: No visit data provided, refetching from server');
      await fetchCountryVisits();
    }
  };

  // ============================================================================
  // DATA FOR RENDERING
  // ============================================================================
  
  const stats = getCountryStats();
  const visitedCountryIds = getVisitedCountryIds();

  // ============================================================================
  // LOADING AND ERROR STATES
  // ============================================================================
  
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

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <Box className="flex-1 flex">
      {/* Left Sidebar - Stats and country information */}
      <Box className="w-80 border-r bg-white" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, flexShrink: 0 }}>
          <CountryStatsCard 
            visits={visits}
            countries={countries}
            continents={continents}
          />
        </Box>


        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {stats.totalVisited} countries visited on map
          </Typography>
        </Box>
      </Box>
      
      {/* Main Content Area */}
      <Box className="flex-1" sx={{ overflow: 'hidden', position: 'relative' }}>
        {/* Map Legend Overlay */}
        <MapLegend
          legendItems={[
            { label: 'Visited Countries', color: '#4caf50' }
          ]}
          unvisitedColor="#e0e0e0"
          unvisitedLabel="Unvisited Countries"
          showInstructions={true}
          isAuthenticated={!!user}
        />
        
        <WorldMap
          countries={geoJsonCountries}
          visitedCountries={visitedCountryIds}
          onCountryClick={handleCountryClick}
          onCountryQuickVisit={handleCountryQuickVisit}
          availableCountries={countries}
        />
      </Box>

      {selectedCountry && (
        <CountryDialog
          open={!!selectedCountry}
          onClose={handleCloseDialog}
          country={selectedCountry}
          onSave={handleSaveVisit}
        />
      )}
    </Box>
  );
};

export default CountriesPage;
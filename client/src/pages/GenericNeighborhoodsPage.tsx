import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { BarChart, List } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import GenericMap from '../components/GenericMap';
import NeighborhoodList from '../components/NeighborhoodList';
import NeighborhoodDialog from '../components/NeighborhoodDialog';
import StatsCard from '../components/StatsCard';
import MapLegend from '../components/MapLegend';
import { visitsApi } from '../services/visitsApi';
import type { Visit } from '../services/visitsApi';
import {neighborhoodsApi} from '../services/neighborhoodsApi';
import { mapsApi } from '../services/mapsApi';
import { districtsApi } from '../services/districtsApi';
import { type CachedNeighborhood } from '../services/neighborhoodCache';
import { referenceDataService } from '../services/referenceDataService';
import type { MapConfig } from '../config/mapConfigs';
import { getCategoryColor, DEFAULT_COLOR } from '../utils/colorPalette';

// Type definitions
export type CategoryType = 'borough' | 'city';

interface GenericNeighborhoodsPageProps {
  mapConfig: MapConfig;
}

interface SelectedNeighborhood {
  id: string;
  name: string;
  borough: string;
}

/**
 * GenericNeighborhoodsPage - A reusable page component for displaying neighborhood maps
 * Supports both borough-based (NYC) and city-based (Boston) categorization
 * Features optimistic updates for fast UI interactions
 */
const GenericNeighborhoodsPage: React.FC<GenericNeighborhoodsPageProps> = ({ mapConfig }) => {
  
  // Authentication context
  const { user } = useAuth();
  
  // Data state - split by source and purpose for clarity
  const [neighborhoods, setNeighborhoods] = useState<CachedNeighborhood[]>([]); // Database neighborhoods
  const [geoJsonNeighborhoods, setGeoJsonNeighborhoods] = useState<any[]>([]); // GeoJSON for map rendering
  const [districts, setDistricts] = useState<any[]>([]); // Districts (boroughs or cities)
  const [mapId, setMapId] = useState<string | null>(null); // Map ID from database
  const [mapData, setMapData] = useState<any | null>(null); // Full map data from database
  const [visits, setVisits] = useState<Visit[]>([]); // User visit data (optimistically updated)
  
  // Initialize data loading
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Step 1: Load map data to get mapId
        const currentMapId = await loadMapData();
        if (!currentMapId) return;
        
        // Step 2: Load all data in parallel using the mapId
        await Promise.all([
          loadNeighborhoods(currentMapId),
          loadDistricts(currentMapId),
          loadGeoJsonNeighborhoods()
        ]);
        
        // Step 3: Load visits (all neighborhood visits)
        await fetchVisits();
        
        // Step 4: Populate reference data service for fast lookups
        populateReferenceData();
        
      } catch (error) {
        console.error(`❌ ${mapConfig.name}: Failed to initialize data:`, error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, [mapConfig.slug]);

  // Compute unique categories from GeoJSON data for legend
  const uniqueCategories = React.useMemo(() => {
    const categories = new Set<string>();
    geoJsonNeighborhoods.forEach(feature => {
      const category = feature.properties?.[mapConfig.categoryType];
      if (category) {
        categories.add(category);
      }
    });
    return categories;
  }, [geoJsonNeighborhoods, mapConfig.categoryType]);
  
  // UI state
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<SelectedNeighborhood | null>(null);
  const [activeTab, setActiveTab] = useState(0); // 0 = Stats, 1 = List
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ============================================================================
  // DATA LOADING EFFECTS
  // ============================================================================
  

  // Load user visits when authentication state changes
  useEffect(() => {
    if (user) {
      fetchVisits();
    }
  }, [user]);

  // ============================================================================
  // DATA LOADING FUNCTIONS
  // ============================================================================
  
  /**
   * Load map data to get mapId
   */
  const loadMapData = async () => {
    try {
      const map = await mapsApi.getMapBySlug(mapConfig.slug);
      setMapId(map._id);
      setMapData(map);
      return map._id;
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to load map data:`, err);
      setError('Failed to load map data');
      return null;
    }
  };

  /**
   * Load neighborhood data from cache
   * - For DB-backed maps: loads from neighborhood cache with city filter
   * - For GeoJSON-only maps: uses empty array (data comes from GeoJSON)
   */
  const loadNeighborhoods = async (currentMapId?: string) => {
    try {
      if (currentMapId) {
        // Load neighborhoods directly from API for this map
        const neighborhoodsData = await mapsApi.getMapNeighborhoods(currentMapId);
        
        // Transform to CachedNeighborhood format
        const neighborhoods = neighborhoodsData.map(n => ({
          id: n._id,
          name: n.name,
          districtId: n.district
        } as CachedNeighborhood));
        
        setNeighborhoods(neighborhoods);
      }
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to load neighborhoods:`, err);
      setError('Failed to load neighborhood data');
    }
  };

  /**
   * Load GeoJSON data for map rendering
   * This contains the actual geographic boundaries and properties for visualization
   */
  const loadGeoJsonNeighborhoods = async () => {
    try {
      const data = await neighborhoodsApi.getGeoJsonNeighborhoods(mapConfig.slug);
      setGeoJsonNeighborhoods(data.features || []);
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to load GeoJSON neighborhoods:`, err);
    }
  };

  const loadDistricts = async (currentMapId?: string) => {
    try {
      if (currentMapId) {
        const districtsData = await districtsApi.getDistrictsByMap(currentMapId);
        setDistricts(districtsData);
      }
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to load districts:`, err);
    }
  };


  /**
   * Fetch user's neighborhood visits from server
   * Uses general neighborhood visits to show all visits across maps
   */
  const fetchVisits = async () => {
    try {
      const visits = await visitsApi.getVisitsByType('neighborhood');
      setVisits(visits);
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to fetch neighborhood visits:`, err);
    }
  };

  /**
   * Populate the reference data service with loaded data for fast lookups
   */
  const populateReferenceData = () => {
    try {
      // Convert CachedNeighborhood back to Neighborhood format for the service
      const neighborhoodData = neighborhoods.map(n => ({
        _id: n.id,
        name: n.name,
        district: n.districtId,
        createdAt: '',
        updatedAt: ''
      }));

      // Convert districts to proper format  
      const districtData = districts.map(d => ({
        _id: d._id,
        name: d.name,
        mapData: mapData ? { 
          _id: mapData._id, 
          name: mapData.name, 
          slug: mapData.slug, 
          type: mapData.type 
        } : undefined,
        createdAt: d.createdAt || '',
        updatedAt: d.updatedAt || ''
      }));

      referenceDataService.populate(neighborhoodData, districtData);
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to populate reference data:`, err);
    }
  };

  const handleNeighborhoodClick = (neighborhood: string, category: string) => {
    if (!user) {
      alert('Please log in to interact with neighborhoods');
      return;
    }
    
    // For maps with database neighborhoods, find actual neighborhood ID
    const neighborhoodData = neighborhoods.find(n => {
      const categoryId = n.districtId;
      const mappedCategory = categoryIdToName.get(categoryId || '');
      return n.name === neighborhood && mappedCategory === category;
    });
    
    if (neighborhoodData) {
      setSelectedNeighborhood({ 
        id: neighborhoodData.id, 
        name: neighborhood, 
        borough: category 
      });
    } else {
      console.error(`❌ ${mapConfig.name}: Could not find neighborhood ID for:`, neighborhood, category);
    }
  };

  // ============================================================================
  // USER INTERACTION HANDLERS
  // ============================================================================
  
  // ============================================================================
  // HELPER FUNCTIONS FOR QUICK VISIT
  // ============================================================================
  
  /**
   * Find neighborhood data and existing visit
   */
  const findNeighborhoodData = async (neighborhood: string, category: string) => {
    let neighborhoodObj: CachedNeighborhood | null = null;
    let existingVisit: Visit | undefined = undefined;
    
      const category_obj = districts.find(d => d.name === category);
      if (!category_obj) {
        console.error(`❌ ${mapConfig.name}: district not found:`, category);
        return { neighborhoodObj: null, existingVisit: undefined };
      }

      neighborhoodObj = neighborhoods.find(n => {
        return n.name === neighborhood && n.districtId === category_obj._id;
      }) || null;
      
      if (!neighborhoodObj) {
        console.error(`❌ ${mapConfig.name}: Neighborhood not found:`, neighborhood);
        return { neighborhoodObj: null, existingVisit: undefined };
      }

      existingVisit = visits.find(v => v.neighborhood === neighborhoodObj!.id);
    
    
    return { neighborhoodObj, existingVisit };
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
  const applyOptimisticUpdate = async (
    shouldDelete: boolean, 
    existingVisit: Visit | undefined, 
    _neighborhoodObj: CachedNeighborhood | null, 
    neighborhood: string, 
    _category: string
  ) => {
    if (shouldDelete && existingVisit) {
      setVisits(prevVisits => prevVisits.filter(v => v._id !== existingVisit._id));
    } else {
      const optimisticVisit: Visit = {
        _id: `temp-${Date.now()}`,
        user: user!.id,
        visitType: 'neighborhood',
        neighborhood: neighborhood,
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
  const syncWithServer = async (
    shouldDelete: boolean, 
    existingVisit: Visit | undefined, 
    neighborhood: string, 
    _category: string, 
    _neighborhoodObj: CachedNeighborhood | null
  ) => {
    if (shouldDelete && existingVisit) {
      await visitsApi.deleteVisit(existingVisit._id);
    } else {
      const visitData = {
        neighborhoodName: neighborhood,
        districtName: _category,
        visited: true,
        notes: '',
        visitDate: new Date(),
        rating: null,
        category: null
      };
      
      const newVisit = await visitsApi.createNeighborhoodVisit(visitData);
      
      // Replace optimistic visit with real server data
      setVisits(prevVisits => 
        prevVisits.map(v => 
          v._id.startsWith('temp-') && 
          (v.neighborhood === neighborhood)
            ? newVisit 
            : v
        )
      );
    }
  };
  
  /**
   * Rollback optimistic update on error
   */
  const rollbackOptimisticUpdate = async () => {
    await fetchVisits();
  };
  
  /**
   * Handle quick neighborhood visit (left-click or tap)
   * Uses optimistic updates for instant UI feedback
   * Supports both create and delete operations
   */
  const handleQuickVisit = async (neighborhood: string, category: string) => {
    // Authentication check
    if (!user) {
      alert('Please log in to mark neighborhoods as visited');
      return;
    }
    
    // Find neighborhood and existing visit data
    const { neighborhoodObj, existingVisit } = await findNeighborhoodData(neighborhood, category);
    if (!neighborhoodObj) {
      return; // Error already logged in findNeighborhoodData
    }
    
    // Determine what action to take
    const shouldDelete = existingVisit && !hasUserData(existingVisit);
    const shouldSkip = existingVisit && !shouldDelete;
    
    if (shouldSkip) {
      return;
    }
    
    try {
      // Step 1: OPTIMISTIC UPDATE - Update UI immediately
      await applyOptimisticUpdate(!!shouldDelete, existingVisit, neighborhoodObj, neighborhood, category);
      
      // Step 2: BACKGROUND SYNC - Sync with server
      await syncWithServer(!!shouldDelete, existingVisit, neighborhood, category, neighborhoodObj);
      
    } catch (error) {
      console.error(`❌ ${mapConfig.name}: Failed to sync quick visit with server:`, error);
      await rollbackOptimisticUpdate();
    }
  };

  /**
   * Handle dialog close
   */
  const handleCloseDialog = () => {
    setSelectedNeighborhood(null);
  };

  /**
   * Handle visit save from dialog
   * Uses optimistic update when visit data is provided
   */
  const handleSaveVisit = async (updatedVisit?: Visit) => {
    if (updatedVisit) {
      setVisits(prevVisits => 
        prevVisits.map(v => 
          v._id === updatedVisit._id ? updatedVisit : v
        )
      );
    } else {
      await fetchVisits();
    }
  };

  // ============================================================================
  // DATA PROCESSING FOR MAP RENDERING
  // ============================================================================
  
  /**
   * Extract visited neighborhood IDs from visits
   * Only includes visits that are marked as visited and have a neighborhood
   */
  const visitedNeighborhoodIds = new Set(
    visits
      .filter(v => v.visited && v.neighborhood)
      .map(v => v.neighborhood!)
  );

  /**
   * Convert visited neighborhood IDs to names for map rendering
   * The map component works with neighborhood names, not database IDs
   */
  const visitedNeighborhoodNames = new Set<string>();
  
  for (const neighborhoodId of visitedNeighborhoodIds) {
    const neighborhood = neighborhoods.find(n => n.id === neighborhoodId);
    if (neighborhood) {
      visitedNeighborhoodNames.add(neighborhood.name);
    }
  }

  /**
   * Create category ID to name mapping for neighborhood lookup
   * Used to match neighborhood clicks to the correct category
   */
  const categoryIdToName = new Map<string, string>();
  for (const district of districts) {
    categoryIdToName.set(district._id, district.name);
  }

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
      {/* Left Sidebar - Stats and Neighborhood List */}
      <Box className="border-r bg-white" sx={{ width: 400, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Tab Navigation */}
        <Box sx={{ borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                fontSize: '0.875rem',
                fontWeight: 500
              }
            }}
          >
            <Tab 
              icon={<BarChart />} 
              label="Stats" 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            <Tab 
              icon={<List />} 
              label="List" 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
          </Tabs>
        </Box>

        {/* Content Area - Takes remaining space */}
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {activeTab === 0 && (
            <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
              <StatsCard 
                visits={visits as any}
                neighborhoods={neighborhoods}
                districts={districts}
                categoryType={mapData?.type || mapConfig.categoryType}
                areaName={mapConfig.name}
              />
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box sx={{ height: '100%' }}>
              <NeighborhoodList
                neighborhoods={neighborhoods}
                districts={districts}
                categoryType={mapData?.type || mapConfig.categoryType}
                visits={visits as any}
                onNeighborhoodClick={handleNeighborhoodClick}
              />
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Map takes remaining space */}
      <Box className="flex-1" sx={{ position: 'relative' }}>
        {/* Map Legend Overlay */}
        <MapLegend
          legendItems={Array.from(uniqueCategories).map(category => ({
            label: category,
            color: getCategoryColor(category)
          }))}
          unvisitedColor={DEFAULT_COLOR}
          unvisitedLabel="Unvisited"
          showInstructions={true}
          isAuthenticated={!!user}
        />
        
        <GenericMap
          neighborhoods={geoJsonNeighborhoods}
          visitedNeighborhoods={visitedNeighborhoodNames}
          onNeighborhoodClick={handleNeighborhoodClick}
          onNeighborhoodQuickVisit={handleQuickVisit}
          isAuthenticated={!!user}
          mapConfig={{
            center: [mapConfig.coordinates.latitude, mapConfig.coordinates.longitude],
            zoom: mapConfig.zoom || 11,
            categoryType: mapData?.type || mapConfig.categoryType
          }}
        />
      </Box>

      {selectedNeighborhood && (
        <NeighborhoodDialog
          open={!!selectedNeighborhood}
          onClose={handleCloseDialog}
          neighborhoodId={selectedNeighborhood.id}
          neighborhood={selectedNeighborhood.name}
          borough={selectedNeighborhood.borough}
          onSave={handleSaveVisit}
          mapId={mapId || undefined}
        />
      )}
    </Box>
  );
};

export default GenericNeighborhoodsPage;
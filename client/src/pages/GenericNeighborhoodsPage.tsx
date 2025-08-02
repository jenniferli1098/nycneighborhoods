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
  console.log('🏗️ GenericNeighborhoodsPage: Component rendering with mapConfig:', mapConfig.name);
  
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
        
        // Step 3: Load visits after mapId is set
        await fetchVisits();
        
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
      console.log(`📡 ${mapConfig.name}: Loading map data from API`);
      const map = await mapsApi.getMapBySlug(mapConfig.slug);
      console.log(`📝 ${mapConfig.name}: Received map data:`, map);
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
      console.log(`📡 ${mapConfig.name}: Loading neighborhoods from API`);
      
      if (currentMapId) {
        // Load neighborhoods directly from API for this map
        const neighborhoodsData = await mapsApi.getMapNeighborhoods(currentMapId);
        
        // Transform to CachedNeighborhood format
        const neighborhoods = neighborhoodsData.map(n => ({
          id: n._id,
          name: n.name,
          districtId: n.district
        } as CachedNeighborhood));
        
        console.log(`📝 ${mapConfig.name}: Received neighborhoods data:`, neighborhoods.length, 'neighborhoods');
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
      console.log(`📡 ${mapConfig.name}: Loading GeoJSON neighborhoods for map`);
      const data = await neighborhoodsApi.getGeoJsonNeighborhoods(mapConfig.slug);
      console.log(`📝 ${mapConfig.name}: Received GeoJSON data:`, data.features?.length || 0, 'features');
      console.log(`📝 ${mapConfig.name}: Sample feature:`, data.features?.[0]?.properties);
      setGeoJsonNeighborhoods(data.features || []);
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to load GeoJSON neighborhoods:`, err);
    }
  };

  const loadDistricts = async (currentMapId?: string) => {
    try {
      console.log(`📡 ${mapConfig.name}: Loading districts from API`);
      
      if (currentMapId) {
        const districtsData = await districtsApi.getDistrictsByMap(currentMapId);
        console.log(`📝 ${mapConfig.name}: Received districts data:`, districtsData.length, 'districts');
        setDistricts(districtsData);
      }
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to load districts:`, err);
    }
  };


  /**
   * Fetch user's neighborhood visits from server
   * Uses map-specific endpoint for better performance
   */
  const fetchVisits = async () => {
    if (!mapId) {
      console.warn(`⚠️ ${mapConfig.name}: MapId not available, skipping visits fetch`);
      return;
    }

    try {
      console.log(`📡 ${mapConfig.name}: Using map-specific visits endpoint for mapId:`, mapId);
      const visits = await visitsApi.getVisitsByMap(mapId);
      
      console.log(`📝 ${mapConfig.name}: Received neighborhood visits data:`, visits);
      console.log(`📊 ${mapConfig.name}: Number of neighborhood visits:`, visits.length);
      
      const visitedIds = visits.filter((v: Visit) => v.visited && v.neighborhood).map((v: Visit) => v.neighborhood);
      console.log(`🎯 ${mapConfig.name}: Visited neighborhood IDs:`, visitedIds);
      
      setVisits(visits);
      console.log(`✅ ${mapConfig.name}: Visits state updated`);
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to fetch neighborhood visits:`, err);
    }
  };

  const handleNeighborhoodClick = (neighborhood: string, category: string) => {
    console.log(`🖱️ ${mapConfig.name}: handleNeighborhoodClick called with:`, { neighborhood, category, user: !!user });
    console.log(`🖱️ ${mapConfig.name}: Available categoryIdToName mapping:`, Array.from(categoryIdToName.entries()));
    console.log(`🖱️ ${mapConfig.name}: Available neighborhoods sample:`, neighborhoods.slice(0, 3).map(n => ({name: n.name, districtId: n.districtId})));
    
    if (!user) {
      console.log(`⚠️ ${mapConfig.name}: User not authenticated, skipping neighborhood click`);
      alert('Please log in to interact with neighborhoods');
      return;
    }
    
      // For maps with database neighborhoods, find actual neighborhood ID
      console.log(`🔍 ${mapConfig.name}: Available neighborhoods count:`, neighborhoods.length);
      console.log(`🔍 ${mapConfig.name}: ${mapConfig.categoryType} mapping size:`, categoryIdToName.size);
      
      const neighborhoodData = neighborhoods.find(n => {
        const categoryId = n.districtId;
        const mappedCategory = categoryIdToName.get(categoryId || '');
        console.log(`🔍 ${mapConfig.name}: Comparing "${n.name}" === "${neighborhood}" && "${mappedCategory}" === "${category}"`);
        return n.name === neighborhood && mappedCategory === category;
      });
      
      if (neighborhoodData) {
        console.log(`✅ ${mapConfig.name}: Found neighborhood:`, neighborhoodData);
        setSelectedNeighborhood({ 
          id: neighborhoodData.id, 
          name: neighborhood, 
          borough: category 
        });
      } else {
        console.error(`❌ ${mapConfig.name}: Could not find neighborhood ID for:`, neighborhood, category);
        console.log(`📋 ${mapConfig.name}: Available neighborhoods sample:`, neighborhoods.slice(0, 5).map(n => {
          const categoryId = n.districtId;
          return `${n.name} - ${categoryIdToName.get(categoryId || '')}`;
        }));
        console.log(`📋 ${mapConfig.name}: Available ${mapConfig.categoryType}s:`, Array.from(categoryIdToName.values()));
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
        console.log(`📋 ${mapConfig.name}: Available districts:`, districts.map(d => d.name));
        return { neighborhoodObj: null, existingVisit: undefined };
      }

      console.log(`🔍 ${mapConfig.name}: Looking for neighborhood "${neighborhood}" in district "${category}" (ID: ${category_obj._id})`);
      console.log(`📋 ${mapConfig.name}: Available neighborhoods in this district:`, neighborhoods.filter(n => n.districtId === category_obj._id).map(n => n.name));
      console.log(`📋 ${mapConfig.name}: Sample neighborhood structure:`, neighborhoods[0]);

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
    neighborhoodObj: CachedNeighborhood | null, 
    neighborhood: string, 
    _category: string
  ) => {
    if (shouldDelete && existingVisit) {
      console.log(`⚡ ${mapConfig.name}: Optimistically removing visit for:`, neighborhood);
      setVisits(prevVisits => prevVisits.filter(v => v._id !== existingVisit._id));
    } else {
      console.log(`⚡ ${mapConfig.name}: Optimistically adding visit for:`, neighborhood);
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
    neighborhoodObj: CachedNeighborhood | null
  ) => {
    if (shouldDelete && existingVisit) {
      await visitsApi.deleteVisit(existingVisit._id);
      console.log(`✅ ${mapConfig.name}: Visit deleted successfully on server`);
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
      console.log(`✅ ${mapConfig.name}: Visit created successfully on server:`, newVisit);
      
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
    console.log(`🔄 ${mapConfig.name}: Rolling back optimistic update due to error`);
    await fetchVisits();
  };
  
  /**
   * Handle quick neighborhood visit (left-click or tap)
   * Uses optimistic updates for instant UI feedback
   * Supports both create and delete operations
   */
  const handleQuickVisit = async (neighborhood: string, category: string) => {
    console.log(`⚡ ${mapConfig.name}: handleQuickVisit called with:`, { neighborhood, category, user: !!user });
    
    // Authentication check
    if (!user) {
      console.log(`⚠️ ${mapConfig.name}: User not authenticated, skipping quick visit`);
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
      console.log(`⚡ ${mapConfig.name}: Visit already exists with user data, skipping to prevent data loss:`, existingVisit);
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
    console.log(`❌ ${mapConfig.name}: Dialog closed`);
    setSelectedNeighborhood(null);
  };

  /**
   * Handle visit save from dialog
   * Uses optimistic update when visit data is provided
   */
  const handleSaveVisit = async (updatedVisit?: Visit) => {
    console.log(`💾 ${mapConfig.name}: Visit saved, optimistically updating local state`);
    
    if (updatedVisit) {
      setVisits(prevVisits => 
        prevVisits.map(v => 
          v._id === updatedVisit._id ? updatedVisit : v
        )
      );
    } else {
      console.log(`🔄 ${mapConfig.name}: No visit data provided, refetching from server`);
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
  console.log(`🏠 ${mapConfig.name}: Visited neighborhood IDs:`, visitedNeighborhoodIds.size, Array.from(visitedNeighborhoodIds));

  /**
   * Convert visited neighborhood IDs to names for map rendering
   * The map component works with neighborhood names, not database IDs
   */
  const visitedNeighborhoodNames = new Set<string>();
  console.log(`🔄 ${mapConfig.name}: Creating visited neighborhood names mapping from loaded data...`);
  
  for (const neighborhoodId of visitedNeighborhoodIds) {
    const neighborhood = neighborhoods.find(n => n.id === neighborhoodId);
    if (neighborhood) {
      visitedNeighborhoodNames.add(neighborhood.name);
    }
  }
  console.log(`🏠 ${mapConfig.name}: Final visited neighborhood names for map:`, visitedNeighborhoodNames.size, Array.from(visitedNeighborhoodNames));

  /**
   * Create category ID to name mapping for neighborhood lookup
   * Used to match neighborhood clicks to the correct category
   */
  const categoryIdToName = new Map<string, string>();
  for (const district of districts) {
    categoryIdToName.set(district._id, district.name);
  }
  
  console.log(`🏘️ ${mapConfig.name}: ${mapConfig.categoryType} mapping complete:`, categoryIdToName.size, `${mapConfig.categoryType}s loaded`);

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
          mapId={mapId}
        />
      )}
    </Box>
  );
};

export default GenericNeighborhoodsPage;
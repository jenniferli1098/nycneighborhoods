import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import NYCMap from '../components/Map';
import BostonMap from '../components/BostonMap';
import NeighborhoodList from '../components/NeighborhoodList';
import NeighborhoodDialog from '../components/NeighborhoodDialog';
import StatsCard from '../components/StatsCard';
import { neighborhoodsApi, type Neighborhood } from '../services/neighborhoodsApi';
import { boroughsApi, type Borough } from '../services/boroughsApi';
import { visitsApi, type Visit } from '../services/visitsApi';
import { neighborhoodCache, type CachedNeighborhood, type CachedBorough } from '../services/neighborhoodCache';

export type CategoryType = 'borough' | 'city';

export interface MapConfig {
  name: string;
  geoJsonEndpoint: () => Promise<any>;
  mapComponent: 'NYC' | 'Boston';
  center?: [number, number];
  zoom?: number;
  categoryType: CategoryType;
  apiFilters?: {
    city?: string;
  };
  getCategoryFromFeature: (feature: any) => string;
  getNeighborhoodFromFeature: (feature: any) => string;
  hasDbNeighborhoods: boolean;
}

interface GenericNeighborhoodsPageProps {
  mapConfig: MapConfig;
}

const GenericNeighborhoodsPage: React.FC<GenericNeighborhoodsPageProps> = ({ mapConfig }) => {
  const { user } = useAuth();
  const [neighborhoods, setNeighborhoods] = useState<CachedNeighborhood[]>([]);
  const [geoJsonNeighborhoods, setGeoJsonNeighborhoods] = useState<any[]>([]);
  const [boroughs, setBoroughs] = useState<CachedBorough[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<{ id: string; name: string; borough: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNeighborhoods();
    loadGeoJsonNeighborhoods();
    loadBoroughs();
  }, [mapConfig]);

  useEffect(() => {
    if (user) {
      fetchVisits();
    }
  }, [user]);

  const loadNeighborhoods = async () => {
    try {
      console.log(`📡 ${mapConfig.name}: Loading neighborhoods from cache`);
      let neighborhoods: CachedNeighborhood[] = [];
      
      if (mapConfig.hasDbNeighborhoods) {
        // Load from cache for maps that have neighborhood data
        neighborhoods = await neighborhoodCache.getNeighborhoods(mapConfig.apiFilters?.city);
      } else {
        // For GeoJSON-only maps, we'll create empty array and handle in-memory
        console.log(`📝 ${mapConfig.name}: Using GeoJSON-only mode, no database neighborhoods`);
      }
      
      console.log(`📝 ${mapConfig.name}: Received neighborhoods data:`, neighborhoods.length, 'neighborhoods');
      setNeighborhoods(neighborhoods);
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to load neighborhoods:`, err);
      setError('Failed to load neighborhood data');
    } finally {
      setLoading(false);
    }
  };

  const loadGeoJsonNeighborhoods = async () => {
    try {
      console.log(`📡 ${mapConfig.name}: Loading GeoJSON neighborhoods for map`);
      const data = await mapConfig.geoJsonEndpoint();
      console.log(`📝 ${mapConfig.name}: Received GeoJSON data:`, data.features.length, 'features');
      setGeoJsonNeighborhoods(data.features);
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to load GeoJSON neighborhoods:`, err);
    }
  };

  const loadBoroughs = async () => {
    try {
      console.log(`📡 ${mapConfig.name}: Loading ${mapConfig.categoryType}s from cache`);
      let boroughs: CachedBorough[] = [];
      
      if (mapConfig.categoryType === 'borough') {
        // Load boroughs from cache
        boroughs = await neighborhoodCache.getBoroughs(mapConfig.apiFilters?.city);
      } else if (mapConfig.categoryType === 'city') {
        // For city-based maps, we'll create virtual boroughs from GeoJSON data
        console.log(`📝 ${mapConfig.name}: Using city-based categorization, will create virtual ${mapConfig.categoryType}s`);
      }
      
      console.log(`📝 ${mapConfig.name}: Received ${mapConfig.categoryType}s data:`, boroughs.length, `${mapConfig.categoryType}s`);
      setBoroughs(boroughs);
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to load ${mapConfig.categoryType}s:`, err);
    }
  };

  const fetchVisits = async () => {
    try {
      console.log(`📡 ${mapConfig.name}: Fetching visits from API`);
      const visits = await visitsApi.getAllVisits();
      console.log(`📝 ${mapConfig.name}: Received visits data:`, visits);
      console.log(`📊 ${mapConfig.name}: Number of visits:`, visits.length);
      
      // Log visited neighborhood IDs
      const visitedIds = visits.filter((v: Visit) => v.visited && v.neighborhoodId).map((v: Visit) => v.neighborhoodId);
      console.log(`🎯 ${mapConfig.name}: Visited neighborhood IDs:`, visitedIds);
      
      setVisits(visits);
      console.log(`✅ ${mapConfig.name}: Visits state updated`);
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to fetch visits:`, err);
    }
  };

  const handleNeighborhoodClick = (neighborhood: string, category: string) => {
    console.log(`🖱️ ${mapConfig.name}: Neighborhood clicked (right-click for dialog):`, neighborhood, category);
    
    if (mapConfig.hasDbNeighborhoods) {
      // For maps with database neighborhoods, find actual neighborhood ID
      console.log(`🔍 ${mapConfig.name}: Available neighborhoods count:`, neighborhoods.length);
      console.log(`🔍 ${mapConfig.name}: ${mapConfig.categoryType} mapping size:`, categoryIdToName.size);
      
      const neighborhoodData = neighborhoods.find(n => {
        const mappedCategory = categoryIdToName.get(n.boroughId);
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
        console.log(`📋 ${mapConfig.name}: Available neighborhoods sample:`, neighborhoods.slice(0, 5).map(n => `${n.name} - ${categoryIdToName.get(n.boroughId)}`));
        console.log(`📋 ${mapConfig.name}: Available ${mapConfig.categoryType}s:`, Array.from(categoryIdToName.values()));
      }
    } else {
      // For GeoJSON-only maps, create placeholder ID
      setSelectedNeighborhood({ 
        id: `${neighborhood}-${category}`, // Placeholder ID
        name: neighborhood, 
        borough: category // Use category as borough for API compatibility
      });
    }
  };

  const handleQuickVisit = async (neighborhood: string, category: string) => {
    console.log(`⚡ ${mapConfig.name}: Quick visit (left-click) for:`, neighborhood, category);
    
    try {
      if (!mapConfig.hasDbNeighborhoods) {
        // For GeoJSON-only maps, create visits directly
        const existingVisit = visits.find(v => 
          v.neighborhoodName === neighborhood || 
          (v.neighborhoodId && neighborhoods.find(n => n._id === v.neighborhoodId && n.name === neighborhood))
        );
        
        if (existingVisit) {
          console.log(`⚡ ${mapConfig.name}: Visit already exists, skipping to prevent data loss:`, existingVisit);
          return;
        }

        const visitData = {
          neighborhoodName: neighborhood,
          boroughName: category, // Use category as borough for API compatibility
          visited: true,
          notes: '',
          visitDate: new Date(),
          rating: null,
          category: null
        };
        
        console.log(`📤 ${mapConfig.name}: Creating quick visit:`, visitData);
        const newVisit = await visitsApi.createNeighborhoodVisit(visitData);
        console.log(`✅ ${mapConfig.name}: Quick visit created successfully:`, newVisit);
      } else {
        // For database-backed maps, lookup neighborhood ID
        const category_obj = boroughs.find(b => b.name === category);
        if (!category_obj) {
          console.error(`❌ ${mapConfig.name}: ${mapConfig.categoryType} not found:`, category);
          return;
        }

        const neighborhood_obj = neighborhoods.find(n => 
          n.name === neighborhood && n.boroughId === category_obj.id
        );
        if (!neighborhood_obj) {
          console.error(`❌ ${mapConfig.name}: Neighborhood not found:`, neighborhood);
          return;
        }

        const existingVisit = visits.find(v => v.neighborhoodId === neighborhood_obj.id);
        
        if (existingVisit) {
          console.log(`⚡ ${mapConfig.name}: Visit already exists, skipping to prevent data loss:`, existingVisit);
          return;
        }

        const visitData = {
          neighborhoodName: neighborhood,
          boroughName: category,
          visited: true,
          notes: '',
          visitDate: new Date(),
          rating: null,
          category: null
        };
        
        console.log(`📤 ${mapConfig.name}: Creating quick visit:`, visitData);
        const newVisit = await visitsApi.createNeighborhoodVisit(visitData);
        console.log(`✅ ${mapConfig.name}: Quick visit created successfully:`, newVisit);
      }
      
      // Refresh data without page reload
      console.log(`🔄 ${mapConfig.name}: Refreshing visits data after quick visit...`);
      await fetchVisits();
      console.log(`🔄 ${mapConfig.name}: Data refresh complete`);
      
    } catch (error) {
      console.error(`❌ ${mapConfig.name}: Failed to create quick visit:`, error);
    }
  };

  const handleCloseDialog = () => {
    console.log(`❌ ${mapConfig.name}: Dialog closed`);
    setSelectedNeighborhood(null);
  };

  const handleSaveVisit = () => {
    console.log(`💾 ${mapConfig.name}: Visit saved, refetching visits`);
    fetchVisits();
  };

  const visitedNeighborhoodIds = new Set(visits.filter(v => v.visited && v.neighborhoodId).map(v => v.neighborhoodId));
  console.log(`🏠 ${mapConfig.name}: Visited neighborhood IDs:`, visitedNeighborhoodIds.size, Array.from(visitedNeighborhoodIds));

  // Create a set of visited neighborhood names for the map using cache for fast lookups
  console.log(`🔄 ${mapConfig.name}: Creating visited neighborhood names mapping using cache...`);
  
  const visitedNeighborhoodNames = new Set<string>();
  
  // For visits with neighborhoodId, use cache lookup
  for (const visitId of visitedNeighborhoodIds) {
    const cachedNeighborhood = neighborhoodCache.getNeighborhoodById(visitId);
    if (cachedNeighborhood) {
      visitedNeighborhoodNames.add(cachedNeighborhood.name);
      console.log(`✅ ${mapConfig.name}: Cached lookup: ${cachedNeighborhood.name} (ID: ${visitId})`);
    }
  }
  
  // For visits with only neighborhoodName (GeoJSON-only), add them directly
  visits
    .filter(v => v.visited && v.neighborhoodName && !v.neighborhoodId)
    .forEach(v => {
      if (v.neighborhoodName) {
        visitedNeighborhoodNames.add(v.neighborhoodName);
        console.log(`✅ ${mapConfig.name}: Direct name lookup: ${v.neighborhoodName}`);
      }
    });
  
  console.log(`🏠 ${mapConfig.name}: Final visited neighborhood names for map:`, visitedNeighborhoodNames.size, Array.from(visitedNeighborhoodNames));

  const categoryIdToName = new Map<string, string>();

  for (const borough of boroughs) {
    categoryIdToName.set(borough.id, borough.name);
  }
  
  console.log(`🏘️ ${mapConfig.name}: ${mapConfig.categoryType} mapping complete:`, categoryIdToName.size, `${mapConfig.categoryType}s loaded`);

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

  const MapComponent = mapConfig.mapComponent === 'Boston' ? BostonMap : NYCMap;

  return (
    <Box className="flex-1 flex">
      {/* Left Sidebar - Stats and Neighborhood List */}
      <Box className="w-80 border-r bg-white" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, flexShrink: 0 }}>
          <StatsCard 
            visits={visits}
            neighborhoods={neighborhoods}
            boroughs={boroughs}
          />
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <NeighborhoodList
            neighborhoods={neighborhoods}
            boroughs={boroughs}
            visits={visits}
            onNeighborhoodClick={handleNeighborhoodClick}
          />
        </Box>
      </Box>
      
      {/* Map takes remaining space */}
      <Box className="flex-1">
        <MapComponent
          neighborhoods={geoJsonNeighborhoods}
          visitedNeighborhoods={visitedNeighborhoodNames}
          onNeighborhoodClick={(neighborhood: string, category: string) => {
            // Use configurable data extraction
            handleNeighborhoodClick(neighborhood, category);
          }}
          onNeighborhoodQuickVisit={(neighborhood: string, category: string) => {
            // Use configurable data extraction
            handleQuickVisit(neighborhood, category);
          }}
          center={mapConfig.center}
          zoom={mapConfig.zoom}
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
          existingVisits={visits}
          neighborhoods={neighborhoods}
          boroughs={boroughs}
        />
      )}
    </Box>
  );
};

export default GenericNeighborhoodsPage;
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
import { neighborhoodCache, type CachedNeighborhood, type CachedBorough, type CachedCity } from '../services/neighborhoodCache';
import type { MapConfig } from '../config/mapConfigs';

export type CategoryType = 'borough' | 'city';

interface GenericNeighborhoodsPageProps {
  mapConfig: MapConfig;
}

const GenericNeighborhoodsPage: React.FC<GenericNeighborhoodsPageProps> = ({ mapConfig }) => {
  console.log('🏗️ GenericNeighborhoodsPage: Component rendering with mapConfig:', mapConfig.name);
  
  const { user } = useAuth();
  const [neighborhoods, setNeighborhoods] = useState<CachedNeighborhood[]>([]);
  const [geoJsonNeighborhoods, setGeoJsonNeighborhoods] = useState<any[]>([]);
  const [boroughs, setBoroughs] = useState<CachedBorough[]>([]);
  const [cities, setCities] = useState<CachedCity[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<{ id: string; name: string; borough: string } | null>(null);
  const [activeTab, setActiveTab] = useState(0); // 0 = Stats, 1 = List
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNeighborhoods();
    loadGeoJsonNeighborhoods();
    loadBoroughs();
    loadCities();
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
        const cityFilter = mapConfig.apiFilters?.city;
        neighborhoods = await neighborhoodCache.getNeighborhoods(cityFilter);
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
      console.log(`📝 ${mapConfig.name}: Received GeoJSON data:`, data.features?.length || 0, 'features');
      console.log(`📝 ${mapConfig.name}: Sample feature:`, data.features?.[0]?.properties);
      setGeoJsonNeighborhoods(data.features || []);
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
        const cityFilter = mapConfig.apiFilters?.city;
        boroughs = await neighborhoodCache.getBoroughs(cityFilter);
      } else if (mapConfig.categoryType === 'city') {
        // For city-based maps, load cities but put them in boroughs array for compatibility
        console.log(`📝 ${mapConfig.name}: Loading cities for city-based categorization`);
        const cities = await neighborhoodCache.getCities('Massachusetts');
        boroughs = cities.map(city => ({
          id: city.id,
          name: city.name,
          cityId: city.id,
          city: city.name // Required field for CachedBorough
        }));
      }
      
      console.log(`📝 ${mapConfig.name}: Received ${mapConfig.categoryType}s data:`, boroughs.length, `${mapConfig.categoryType}s`);
      setBoroughs(boroughs);
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to load ${mapConfig.categoryType}s:`, err);
    }
  };

  const loadCities = async () => {
    try {
      console.log(`📡 ${mapConfig.name}: Loading cities from cache`);
      let cities: CachedCity[] = [];
      
      if (mapConfig.categoryType === 'city') {
        // Load cities for city-based maps
        cities = await neighborhoodCache.getCities('Massachusetts'); // For Boston area
      }
      
      console.log(`📝 ${mapConfig.name}: Received cities data:`, cities.length, 'cities');
      setCities(cities);
    } catch (err) {
      console.error(`❌ ${mapConfig.name}: Failed to load cities:`, err);
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
    console.log(`🖱️ ${mapConfig.name}: handleNeighborhoodClick called with:`, { neighborhood, category, user: !!user });
    console.log(`🖱️ ${mapConfig.name}: Available categoryIdToName mapping:`, Array.from(categoryIdToName.entries()));
    console.log(`🖱️ ${mapConfig.name}: Available neighborhoods sample:`, neighborhoods.slice(0, 3).map(n => ({name: n.name, boroughId: n.boroughId, cityId: n.cityId})));
    
    if (!user) {
      console.log(`⚠️ ${mapConfig.name}: User not authenticated, skipping neighborhood click`);
      alert('Please log in to interact with neighborhoods');
      return;
    }
    
    if (mapConfig.hasDbNeighborhoods) {
      // For maps with database neighborhoods, find actual neighborhood ID
      console.log(`🔍 ${mapConfig.name}: Available neighborhoods count:`, neighborhoods.length);
      console.log(`🔍 ${mapConfig.name}: ${mapConfig.categoryType} mapping size:`, categoryIdToName.size);
      
      const neighborhoodData = neighborhoods.find(n => {
        const categoryId = mapConfig.categoryType === 'borough' ? n.boroughId : n.cityId;
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
          const categoryId = mapConfig.categoryType === 'borough' ? n.boroughId : n.cityId;
          return `${n.name} - ${categoryIdToName.get(categoryId || '')}`;
        }));
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
    console.log(`⚡ ${mapConfig.name}: handleQuickVisit called with:`, { neighborhood, category, user: !!user });
    
    if (!user) {
      console.log(`⚠️ ${mapConfig.name}: User not authenticated, skipping quick visit`);
      alert('Please log in to mark neighborhoods as visited');
      return;
    }
    
    try {
      if (!mapConfig.hasDbNeighborhoods) {
        // For GeoJSON-only maps, create visits directly
        const existingVisit = visits.find(v => 
          v.neighborhoodId === neighborhood || 
          (v.neighborhoodId && neighborhoods.find(n => n.id === v.neighborhoodId && n.name === neighborhood))
        );
        
        if (existingVisit) {
          // Check if visit has user data (notes, rating, category) - if not, toggle to unvisited
          if (!existingVisit.notes && !existingVisit.rating && !existingVisit.category) {
            console.log(`⚡ ${mapConfig.name}: Toggling visit to unvisited (no user data):`, existingVisit);
            await visitsApi.deleteVisit(existingVisit._id);
            await fetchVisits();
            return;
          }
          console.log(`⚡ ${mapConfig.name}: Visit already exists with user data, skipping to prevent data loss:`, existingVisit);
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
      } else {
        // For database-backed maps, lookup neighborhood ID
        console.log(`🔍 ${mapConfig.name}: Looking for ${mapConfig.categoryType} "${category}" in:`, boroughs.map(b => b.name));
        const category_obj = boroughs.find(b => b.name === category);
        if (!category_obj) {
          console.error(`❌ ${mapConfig.name}: ${mapConfig.categoryType} not found:`, category);
          console.log(`📋 ${mapConfig.name}: Available ${mapConfig.categoryType}s:`, boroughs.map(b => b.name));
          return;
        }
        console.log(`✅ ${mapConfig.name}: Found ${mapConfig.categoryType}:`, category_obj);

        console.log(`🔍 ${mapConfig.name}: Looking for neighborhood "${neighborhood}" with ${mapConfig.categoryType}Id "${category_obj.id}"`);
        const neighborhood_obj = neighborhoods.find(n => {
          const matches = mapConfig.categoryType === 'borough' 
            ? n.name === neighborhood && n.boroughId === category_obj.id
            : n.name === neighborhood && n.cityId === category_obj.id;
          
          if (n.name === neighborhood) {
            console.log(`🔍 ${mapConfig.name}: Found matching name "${n.name}", checking ${mapConfig.categoryType}Id: "${mapConfig.categoryType === 'borough' ? n.boroughId : n.cityId}" === "${category_obj.id}" = ${matches}`);
          }
          
          return matches;
        });
        if (!neighborhood_obj) {
          console.error(`❌ ${mapConfig.name}: Neighborhood not found:`, neighborhood);
          console.log(`📋 ${mapConfig.name}: Available neighborhoods with name "${neighborhood}":`, 
            neighborhoods.filter(n => n.name === neighborhood).map(n => ({
              name: n.name, 
              boroughId: n.boroughId, 
              cityId: n.cityId,
              boroughName: n.boroughName,
              cityName: n.cityName
            }))
          );
          return;
        }

        const existingVisit = visits.find(v => v.neighborhoodId === neighborhood_obj.id);
        
        if (existingVisit) {
          // Check if visit has user data (notes, rating, category) - if not, toggle to unvisited
          if (!existingVisit.notes && !existingVisit.rating && !existingVisit.category) {
            console.log(`⚡ ${mapConfig.name}: Toggling visit to unvisited (no user data):`, existingVisit);
            await visitsApi.deleteVisit(existingVisit._id);
            await fetchVisits();
            return;
          }
          console.log(`⚡ ${mapConfig.name}: Visit already exists with user data, skipping to prevent data loss:`, existingVisit);
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

  const visitedNeighborhoodIds = new Set(visits.filter(v => v.visited && v.neighborhoodId).map(v => v.neighborhoodId!));
  console.log(`🏠 ${mapConfig.name}: Visited neighborhood IDs:`, visitedNeighborhoodIds.size, Array.from(visitedNeighborhoodIds));

  // Create a set of visited neighborhood names for the map using cache for fast lookups
  console.log(`🔄 ${mapConfig.name}: Creating visited neighborhood names mapping using cache...`);
  
  const visitedNeighborhoodNames = new Set<string>();
  
  // For visits with neighborhoodId, use cache lookup
  for (const visitId of visitedNeighborhoodIds) {
    const cachedNeighborhood = neighborhoodCache.getNeighborhoodById(visitId);
    if (cachedNeighborhood) {
      visitedNeighborhoodNames.add(cachedNeighborhood.name);
    }
  }


  console.log(`🏠 ${mapConfig.name}: Final visited neighborhood names for map:`, visitedNeighborhoodNames.size, Array.from(visitedNeighborhoodNames));

  const categoryIdToName = new Map<string, string>();

  for (const borough of boroughs) {
    categoryIdToName.set(borough.id, borough.name);
  }
  
  console.log(`🏘️ ${mapConfig.name}: ${mapConfig.categoryType} mapping complete:`, categoryIdToName.size, `${mapConfig.categoryType}s loaded`);
  console.log(`🏘️ ${mapConfig.name}: categoryIdToName contents:`, Array.from(categoryIdToName.entries()));
  console.log(`🏘️ ${mapConfig.name}: neighborhoods sample:`, neighborhoods.slice(0, 5).map(n => ({name: n.name, boroughId: n.boroughId, boroughName: n.boroughName})));

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

  // Use GenericMap with configuration from mapConfig

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
                categories={mapConfig.categoryType === 'borough' ? boroughs : cities}
                categoryType={mapConfig.categoryType}
                areaName={mapConfig.name}
              />
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box sx={{ height: '100%' }}>
              <NeighborhoodList
                neighborhoods={neighborhoods}
                categories={mapConfig.categoryType === 'borough' ? boroughs : cities}
                categoryType={mapConfig.categoryType}
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
          legendItems={Object.entries(mapConfig.categoryColors || {}).map(([category, color]) => ({
            label: category,
            color: color
          }))}
          unvisitedColor={mapConfig.defaultColor || '#E8E8E8'}
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
            center: mapConfig.center || [40.8, -73.9],
            zoom: mapConfig.zoom || 11,
            getCategoryFromFeature: mapConfig.getCategoryFromFeature,
            getNeighborhoodFromFeature: mapConfig.getNeighborhoodFromFeature,
            categoryColors: mapConfig.categoryColors || {},
            defaultColor: mapConfig.defaultColor
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
        />
      )}
    </Box>
  );
};

export default GenericNeighborhoodsPage;
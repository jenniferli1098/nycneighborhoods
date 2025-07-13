import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import BostonMap from '../components/BostonMap';
import NeighborhoodList from '../components/NeighborhoodList';
import NeighborhoodDialog from '../components/NeighborhoodDialog';
import StatsCard from '../components/StatsCard';
import { neighborhoodsApi, type Neighborhood } from '../services/neighborhoodsApi';
import { boroughsApi, type Borough } from '../services/boroughsApi';
import { visitsApi, type Visit } from '../services/visitsApi';

const BostonNeighborhoodsPage: React.FC = () => {
  const { user } = useAuth();
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [geoJsonNeighborhoods, setGeoJsonNeighborhoods] = useState<any[]>([]);
  const [boroughs, setBoroughs] = useState<Borough[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
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
      console.log('📡 BostonNeighborhoodsPage: Loading neighborhoods from API');
      const neighborhoods = await neighborhoodsApi.getAllNeighborhoods();
      console.log('📝 BostonNeighborhoodsPage: Received neighborhoods data:', neighborhoods);
      setNeighborhoods(neighborhoods);
    } catch (err) {
      console.error('❌ BostonNeighborhoodsPage: Failed to load neighborhoods:', err);
      setError('Failed to load neighborhood data');
    } finally {
      setLoading(false);
    }
  };

  const loadGeoJsonNeighborhoods = async () => {
    try {
      console.log('📡 BostonNeighborhoodsPage: Loading Boston GeoJSON neighborhoods for map');
      const data = await neighborhoodsApi.getBostonGeoJsonNeighborhoods();
      console.log('📝 BostonNeighborhoodsPage: Received Boston GeoJSON data:', data.features.length, 'features');
      setGeoJsonNeighborhoods(data.features);
    } catch (err) {
      console.error('❌ BostonNeighborhoodsPage: Failed to load Boston GeoJSON neighborhoods:', err);
    }
  };

  const loadBoroughs = async () => {
    try {
      console.log('📡 BostonNeighborhoodsPage: Loading boroughs from API');
      const boroughs = await boroughsApi.getAllBoroughs();
      console.log('📝 BostonNeighborhoodsPage: Received boroughs data:', boroughs);
      setBoroughs(boroughs);
    } catch (err) {
      console.error('❌ BostonNeighborhoodsPage: Failed to load boroughs:', err);
    }
  };

  const fetchVisits = async () => {
    try {
      console.log('📡 BostonNeighborhoodsPage: Fetching visits from API');
      const visits = await visitsApi.getAllVisits();
      console.log('📝 BostonNeighborhoodsPage: Received visits data:', visits);
      console.log('📊 BostonNeighborhoodsPage: Number of visits:', visits.length);
      
      // Log visited neighborhood IDs
      const visitedIds = visits.filter((v: Visit) => v.visited && v.neighborhoodId).map((v: Visit) => v.neighborhoodId);
      console.log('🎯 BostonNeighborhoodsPage: Visited neighborhood IDs:', visitedIds);
      
      setVisits(visits);
      console.log('✅ BostonNeighborhoodsPage: Visits state updated');
    } catch (err) {
      console.error('❌ BostonNeighborhoodsPage: Failed to fetch visits:', err);
    }
  };

  const handleNeighborhoodClick = (neighborhood: string, borough: string) => {
    console.log('🖱️ BostonNeighborhoodsPage: Neighborhood clicked (right-click for dialog):', neighborhood, borough);
    console.log('🔍 BostonNeighborhoodsPage: Available neighborhoods count:', neighborhoods.length);
    console.log('🔍 BostonNeighborhoodsPage: Borough mapping size:', boroughIdToName.size);
    
    // Find the neighborhood ID from API neighborhoods
    const neighborhoodData = neighborhoods.find(n => {
      const mappedBorough = boroughIdToName.get(n.boroughId);
      console.log(`🔍 BostonNeighborhoodsPage: Comparing "${n.name}" === "${neighborhood}" && "${mappedBorough}" === "${borough}"`);
      return n.name === neighborhood && mappedBorough === borough;
    });
    
    if (neighborhoodData) {
      console.log('✅ BostonNeighborhoodsPage: Found neighborhood:', neighborhoodData);
      setSelectedNeighborhood({ 
        id: neighborhoodData._id, 
        name: neighborhood, 
        borough 
      });
    } else {
      console.error('❌ BostonNeighborhoodsPage: Could not find neighborhood ID for:', neighborhood, borough);
      console.log('📋 BostonNeighborhoodsPage: Available neighborhoods sample:', neighborhoods.slice(0, 5).map(n => `${n.name} - ${boroughIdToName.get(n.boroughId)}`));
      console.log('📋 BostonNeighborhoodsPage: Available boroughs:', Array.from(boroughIdToName.values()));
    }
  };

  const handleQuickVisit = async (neighborhood: string, borough: string) => {
    console.log('⚡ BostonNeighborhoodsPage: Quick visit (left-click) for:', neighborhood, borough);
    
    try {
      // Find the neighborhood ID first
      const borough_obj = boroughs.find(b => b.name === borough);
      if (!borough_obj) {
        console.error('❌ BostonNeighborhoodsPage: Borough not found:', borough);
        return;
      }

      const neighborhood_obj = neighborhoods.find(n => 
        n.name === neighborhood && n.boroughId === borough_obj._id
      );
      if (!neighborhood_obj) {
        console.error('❌ BostonNeighborhoodsPage: Neighborhood not found:', neighborhood);
        return;
      }

      // Check if visit already exists
      const existingVisit = visits.find(v => v.neighborhoodId === neighborhood_obj._id);
      
      if (existingVisit) {
        console.log('⚡ BostonNeighborhoodsPage: Visit already exists, skipping to prevent data loss:', existingVisit);
        // Don't overwrite existing visit data - just return
        return;
      }

      // Only create new visit if none exists
      const visitData = {
        neighborhoodName: neighborhood,
        boroughName: borough,
        visited: true,
        notes: '',
        visitDate: new Date(),
        rating: null,
        category: null
      };
      
      console.log('📤 BostonNeighborhoodsPage: Creating quick visit:', visitData);
      const newVisit = await visitsApi.createNeighborhoodVisit(visitData);
      console.log('✅ BostonNeighborhoodsPage: Quick visit created successfully:', newVisit);
      
      // Refresh data without page reload
      console.log('🔄 BostonNeighborhoodsPage: Refreshing visits data after quick visit...');
      await fetchVisits();
      console.log('🔄 BostonNeighborhoodsPage: Data refresh complete');
      
    } catch (error) {
      console.error('❌ BostonNeighborhoodsPage: Failed to create quick visit:', error);
    }
  };

  const handleCloseDialog = () => {
    console.log('❌ BostonNeighborhoodsPage: Dialog closed');
    setSelectedNeighborhood(null);
  };

  const handleSaveVisit = () => {
    console.log('💾 BostonNeighborhoodsPage: Visit saved, refetching visits');
    fetchVisits();
  };

  const visitedNeighborhoodIds = new Set(visits.filter(v => v.visited && v.neighborhoodId).map(v => v.neighborhoodId));
  console.log('🏠 BostonNeighborhoodsPage: Visited neighborhood IDs:', visitedNeighborhoodIds.size, Array.from(visitedNeighborhoodIds));

  // Create a set of visited neighborhood names for the map
  console.log('🔄 BostonNeighborhoodsPage: Creating visited neighborhood names mapping...');
  console.log('🏠 BostonNeighborhoodsPage: Available neighborhoods for mapping:', neighborhoods.length);
  console.log('🎯 BostonNeighborhoodsPage: Visited neighborhood IDs to map:', Array.from(visitedNeighborhoodIds));
  
  const visitedNeighborhoodNames = new Set(
    neighborhoods
      .filter((n: Neighborhood) => {
        const isVisited = visitedNeighborhoodIds.has(n._id);
        if (isVisited) {
          console.log(`✅ BostonNeighborhoodsPage: Mapping visited neighborhood: ${n.name} (ID: ${n._id})`);
        }
        return isVisited;
      })
      .map((n: Neighborhood) => n.name)
  );
  console.log('🏠 BostonNeighborhoodsPage: Final visited neighborhood names for map:', visitedNeighborhoodNames.size, Array.from(visitedNeighborhoodNames));

  const boroughIdToName = new Map<string, string>();

  for (const borough of boroughs) {
    boroughIdToName.set(borough._id, borough.name);
  }
  
  console.log('🏘️ BostonNeighborhoodsPage: Borough mapping complete:', boroughIdToName.size, 'boroughs loaded');

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
        <BostonMap
          neighborhoods={geoJsonNeighborhoods}
          visitedNeighborhoods={visitedNeighborhoodNames}
          onNeighborhoodClick={handleNeighborhoodClick}
          onNeighborhoodQuickVisit={handleQuickVisit}
          center={[42.3601, -71.0589]}
          zoom={12}
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

export default BostonNeighborhoodsPage;
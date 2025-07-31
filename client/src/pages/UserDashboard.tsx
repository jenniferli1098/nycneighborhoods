import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { LocationOn, Star, Public } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { visitsApi, type Visit } from '../services/visitsApi';
import { countriesApi, type Country } from '../services/countriesApi';
import { mapsApi, type Map } from '../services/mapsApi';
import StatsCard from '../components/StatsCard';
import { type CachedNeighborhood, type CachedBorough, type CachedCity } from '../services/neighborhoodCache';

interface UserStats {
  totalVisits: number;
  totalNeighborhoods: number;
  totalCountries: number;
  averageRating: number | null;
  boroughsVisited: number;
  continentsVisited: number;
  visitsByCategory: {
    Good: number;
    Mid: number;
    Bad: number;
  };
  recentNeighborhoods: Visit[];
  recentCountries: Visit[];
  topRatedNeighborhoods: Visit[];
  topRatedCountries: Visit[];
}

interface MapAreaData {
  map: Map;
  neighborhoods: CachedNeighborhood[];
  categories: (CachedBorough | CachedCity)[];
  isLoaded: boolean;
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [mapAreas, setMapAreas] = useState<{ [key: string]: MapAreaData }>({});


  /**
   * Load neighborhoods for a specific map using Maps API
   */
  const loadMapNeighborhoods = useCallback(async (map: Map): Promise<CachedNeighborhood[]> => {
    try {
      // First try the map-specific API endpoint - this should be the primary method
      console.log(`📝 UserDashboard: Loading neighborhoods for ${map.name} via Maps API`);
      const neighborhoods = await mapsApi.getMapNeighborhoods(map._id);
      console.log(`📝 UserDashboard: Maps API returned ${neighborhoods.length} neighborhoods for ${map.name}`);
      
      // Convert to CachedNeighborhood format
      return neighborhoods.map(n => ({
        id: n._id,
        name: n.name,
        boroughId: n.boroughId,
        boroughName: n.borough?.name || 'Unknown',
        cityId: n.cityId,
        cityName: n.city?.name || 'Unknown',
        categoryType: map.categoryType,
        city: n.city?.name || 'Unknown'
      }));
    } catch (err) {
      console.error(`❌ UserDashboard: Map API failed for ${map.name}, this indicates a data loading issue:`, err);
      
      // Return empty array when Maps API fails
      console.warn(`⚠️ UserDashboard: Returning empty neighborhoods for ${map.name} due to API failure`);
      return [];
    }
  }, []);

  /**
   * Load categories (boroughs or cities) for a specific map using Maps API
   */
  const loadMapCategories = useCallback(async (map: Map): Promise<(CachedBorough | CachedCity)[]> => {
    try {
      if (map.categoryType === 'borough') {
        // Load boroughs for this map
        const boroughs = await mapsApi.getMapBoroughs(map._id);
        return boroughs.map(b => ({
          id: b._id,
          name: b.name,
          cityId: b.cityId,
          cityName: b.city?.name || 'Unknown',
          city: b.city?.name || 'Unknown'
        } as CachedBorough));
      } else {
        // Load cities for this map
        const cities = await mapsApi.getMapCities(map._id);
        return cities.map(c => ({
          id: c._id,
          name: c.name,
          cityId: c._id,
          city: c.name
        } as CachedBorough)); // Map to borough-compatible structure
      }
    } catch (err) {
      console.error(`❌ UserDashboard: Map categories API failed for ${map.name}, this indicates a data loading issue:`, err);
      
      // Return empty array when Maps API fails
      console.warn(`⚠️ UserDashboard: Returning empty categories for ${map.name} due to API failure`);
      return [];
    }
  }, []);

  const loadUserStats = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📊 UserDashboard: Loading user statistics');
      
      // Fetch all visits (optimized: get both neighborhood and country visits)
      const [neighborhoodVisits, countryVisits] = await Promise.all([
        visitsApi.getVisitsByType('neighborhood'),
        visitsApi.getVisitsByType('country')
      ]);
      const visits = [...neighborhoodVisits, ...countryVisits];
      console.log('📝 UserDashboard: Received visits:', visits.length);
      console.log('📝 UserDashboard: Sample visit:', visits[0]);
      setAllVisits(visits);
      
      // Fetch countries for lookup
      const countriesData = await countriesApi.getAllCountries();
      console.log('📝 UserDashboard: Received countries:', countriesData.length);
      setCountries(countriesData);
      
      
      // Dynamically load data for all maps from Maps API
      const areasData: { [key: string]: MapAreaData } = {};
      
      try {
        // Get all active maps from the API
        const maps = await mapsApi.getAllMaps();
        console.log(`📝 UserDashboard: Received ${maps.length} maps from API:`, maps.map(m => m.name));
        
        for (const map of maps) {

          try {
            console.log(`📝 UserDashboard: Loading data for ${map.name} (category: ${map.categoryType})`);
            
            // Load neighborhoods and categories using Maps API with fallback to cache
            const neighborhoods = await loadMapNeighborhoods(map);
            const categories = await loadMapCategories(map);
            
            areasData[map.name] = {
              map,
              neighborhoods,
              categories,
              isLoaded: true
            };
            
            console.log(`📝 UserDashboard: ${map.name} - neighborhoods: ${neighborhoods.length}, categories: ${categories.length}`);
            console.log(`📝 UserDashboard: ${map.name} - sample neighborhood:`, neighborhoods[0]);
            console.log(`📝 UserDashboard: ${map.name} - sample category:`, categories[0]);
            
          } catch (error) {
            console.error(`❌ UserDashboard: ${map.name} data loading failed:`, error);
            areasData[map.name] = {
              map,
              neighborhoods: [],
              categories: [],
              isLoaded: false
            };
          }
        }
      } catch (error) {
        console.error(`❌ UserDashboard: Failed to load maps from API:`, error);
      }
      
      setMapAreas(areasData);
      
      // Calculate statistics
      const userStats = calculateUserStats(visits, countriesData);
      setStats(userStats);
      
    } catch (err: unknown) {
      console.error('❌ UserDashboard: Error loading stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [loadMapCategories, loadMapNeighborhoods]);

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user, loadUserStats]);

  const calculateUserStats = (visits: Visit[], countries: Country[]): UserStats => {
    const visitedVisits = visits.filter(v => v.visited);
    const neighborhoodVisits = visitedVisits.filter(v => v.visitType === 'neighborhood');
    const countryVisits = visitedVisits.filter(v => v.visitType === 'country');
    
    // Calculate ratings
    const ratedVisits = visitedVisits.filter(v => v.rating !== null && v.rating !== undefined);
    const averageRating = ratedVisits.length > 0 
      ? ratedVisits.reduce((sum, v) => sum + v.rating!, 0) / ratedVisits.length 
      : null;
    
    // Calculate categories
    const visitsByCategory = {
      Good: visitedVisits.filter(v => v.category === 'Good').length,
      Mid: visitedVisits.filter(v => v.category === 'Mid').length,
      Bad: visitedVisits.filter(v => v.category === 'Bad').length,
    };
    
    // Calculate unique continents
    const visitedCountryIds = countryVisits.map(v => v.countryId).filter(Boolean);
    const visitedCountries = countries.filter(c => visitedCountryIds.includes(c._id));
    const continentsVisited = new Set(visitedCountries.map(c => c.continent)).size;
    
    // Get recent neighborhood visits (last 5)
    const recentNeighborhoods = [...neighborhoodVisits]
      .sort((a, b) => new Date(b.visitDate || b.updatedAt || '').getTime() - new Date(a.visitDate || a.updatedAt || '').getTime())
      .slice(0, 5);
    
    // Get recent country visits (last 5)
    const recentCountries = [...countryVisits]
      .sort((a, b) => new Date(b.visitDate || b.updatedAt || '').getTime() - new Date(a.visitDate || a.updatedAt || '').getTime())
      .slice(0, 5);
    
    // Get top rated neighborhood visits (top 5)
    const ratedNeighborhoods = ratedVisits.filter(v => v.visitType === 'neighborhood');
    const topRatedNeighborhoods = [...ratedNeighborhoods]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
    
    // Get top rated country visits (top 5)
    const ratedCountries = ratedVisits.filter(v => v.visitType === 'country');
    const topRatedCountries = [...ratedCountries]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
    
    
    return {
      totalVisits: visitedVisits.length,
      totalNeighborhoods: neighborhoodVisits.length,
      totalCountries: countryVisits.length,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      boroughsVisited: 0, // Would need borough data to calculate this
      continentsVisited,
      visitsByCategory,
      recentNeighborhoods,
      recentCountries,
      topRatedNeighborhoods,
      topRatedCountries
    };
  };


  const formatVisitName = (visit: Visit, countries: Country[] = []) => {
    if (visit.visitType === 'neighborhood') {
      // For neighborhoods, we'll need to look up the name by ID from the cache
      // For now, just return a placeholder
      return `Neighborhood ${visit.neighborhoodId || 'Unknown'}`;
    } else {
      // Lookup country by ID
      const country = countries.find(c => c._id === visit.countryId);
      return country ? `${country.name}, ${country.continent}` : 'Unknown Country';
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center sizes-center h-full">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="flex justify-center sizes-center h-full">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box className="flex justify-center sizes-center h-full">
        <Alert severity="info">No data available</Alert>
      </Box>
    );
  }

  // Calculate total possible score for future features
  // const totalPossibleScore = stats.totalVisits * 10;
  // const currentScore = stats.averageRating ? stats.averageRating * stats.totalVisits : 0;
  // const scorePercentage = totalPossibleScore > 0 ? (currentScore / totalPossibleScore) * 100 : 0;

  return (
    <Box 
      className="h-full overflow-auto bg-gray-50" 
      sx={{ 
        width: '100vw', 
        maxWidth: 'none', 
        padding: '32px',
        margin: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* Header Section */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 6,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 4,
        p: 4,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background element */}
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            borderRadius: '50%'
          }}
        />
        
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, position: 'relative' }}>
          Welcome back, {user?.firstName && user?.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user?.username || 'User'}!
        </Typography>
        
        {user?.email && (
          <Chip 
            label={user.email}
            size="medium"
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 500,
              position: 'relative'
            }}
          />
        )}
        
        <Typography variant="body1" sx={{ mt: 2, opacity: 0.9, position: 'relative' }}>
          Your exploration journey continues...
        </Typography>
      </Box>
      
      {/* Overview Stats Card */}
      <Card sx={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: 4,
        mb: 4,
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#374151' }}>
            Your Exploration Overview
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: '1 1 200px' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e3c72', mb: 1 }}>
                  {stats.totalVisits}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Total Visits
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ flex: '1 1 200px' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#400B8B', mb: 1 }}>
                  {stats.totalNeighborhoods}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Neighborhoods
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ flex: '1 1 200px' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e3c72', mb: 1 }}>
                  {stats.totalCountries}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Countries
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ flex: '1 1 200px' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#059669', mb: 1 }}>
                  {stats.averageRating?.toFixed(1) || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Avg. Rating
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, width: '100%', justifyContent: 'center' }}>
        {/* Countries StatsCard */}
        <Box sx={{ flex: '1 1 300px', maxWidth: Object.keys(mapAreas).length > 0 ? '400px' : '600px' }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
            color: 'white',
            height: 'fit-content'
          }}>
            <CardContent>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Public sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Your World Exploration Stats
                </Typography>
              </Box>

              {/* Main Stats Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stats.totalCountries}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Countries Visited
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                    <LocationOn sx={{ mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {stats.continentsVisited} Continents
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Continents Explored
                  </Typography>
                </Box>
              </Box>

              {/* Top Countries */}
              {stats.topRatedCountries.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Star sx={{ mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Top Countries
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {stats.topRatedCountries.slice(0, 3).map((visit, index) => (
                      <Box 
                        key={visit._id}
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderRadius: 1,
                          px: 2,
                          py: 1
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 'bold', 
                              mr: 1,
                              fontSize: '1.2em',
                              opacity: index === 0 ? 1 : index === 1 ? 0.9 : 0.8
                            }}
                          >
                            {index + 1}.
                          </Typography>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                              {formatVisitName(visit, countries)}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label={visit.rating?.toFixed(1) || 'N/A'}
                          size="small"
                          sx={{ 
                            backgroundColor: index === 0 ? '#4fc3f7' : 'rgba(255,255,255,0.2)', 
                            color: index === 0 ? '#1e3c72' : 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Category Distribution */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip 
                  label={`Good: ${stats.visitsByCategory.Good}`}
                  size="small"
                  sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  label={`Mid: ${stats.visitsByCategory.Mid}`}
                  size="small"
                  sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  label={`Bad: ${stats.visitsByCategory.Bad}`}
                  size="small"
                  sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Dynamic Neighborhood StatsCards for all configured maps */}
        {Object.entries(mapAreas)
          .filter(([mapName, areaData]) => {
            const isValid = areaData.isLoaded && areaData.neighborhoods.length > 0 && areaData.categories.length > 0;
            console.log(`📊 UserDashboard: ${mapName} StatsCard filter - isLoaded: ${areaData.isLoaded}, neighborhoods: ${areaData.neighborhoods.length}, categories: ${areaData.categories.length}, showing: ${isValid}`);
            return isValid;
          })
          .map(([mapName, areaData]) => {
            console.log(`📊 UserDashboard: Rendering StatsCard for ${mapName}`, {
              visits: allVisits.length,
              neighborhoods: areaData.neighborhoods.length,
              categories: areaData.categories.length,
              categoryType: areaData.map.categoryType
            });
            return (
              <Box key={mapName} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
                <StatsCard
                  visits={allVisits}
                  neighborhoods={areaData.neighborhoods}
                  categories={areaData.categories}
                  categoryType={areaData.map.categoryType}
                  areaName={areaData.map.name}
                />
              </Box>
            );
          })
        }
      </Box>
    </Box>
  );
};

export default UserDashboard;
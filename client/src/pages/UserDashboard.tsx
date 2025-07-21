import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
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
import StatsCard from '../components/StatsCard';
import { neighborhoodCache, type CachedNeighborhood, type CachedBorough, type CachedCity } from '../services/neighborhoodCache';
import { mapConfigs, type MapConfig } from '../config/mapConfigs';

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
  config: MapConfig;
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

  // Helper function to determine city from map config API filters
  const getCityFromMapConfig = (config: MapConfig): string | undefined => {
    if (config.name === 'New York') return 'NYC';
    if (config.name === 'Boston Greater Area') return 'Boston';
    return config.apiFilters?.city;
  };

  const loadUserStats = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📊 UserDashboard: Loading user statistics');
      
      // Fetch all visits
      const visits = await visitsApi.getAllVisits();
      console.log('📝 UserDashboard: Received visits:', visits.length);
      console.log('📝 UserDashboard: Sample visit:', visits[0]);
      setAllVisits(visits);
      
      // Fetch countries for lookup
      const countriesData = await countriesApi.getAllCountries();
      console.log('📝 UserDashboard: Received countries:', countriesData.length);
      setCountries(countriesData);
      
      
      // Dynamically load data for all map configurations
      const areasData: { [key: string]: MapAreaData } = {};
      
      for (const [mapName, config] of Object.entries(mapConfigs)) {
        if (!config.hasDbNeighborhoods) {
          console.log(`📝 UserDashboard: Skipping ${mapName} - no DB neighborhoods`);
          continue;
        }

        try {
          const city = getCityFromMapConfig(config);
          console.log(`📝 UserDashboard: Loading data for ${mapName} (city: ${city})`);
          
          // Fetch neighborhoods for this area
          const neighborhoods = city ? 
            await neighborhoodCache.getNeighborhoods(city) : 
            await neighborhoodCache.getNeighborhoods();
          
          // Fetch categories (boroughs or cities) for this area
          let categories: (CachedBorough | CachedCity)[] = [];
          if (config.categoryType === 'borough') {
            categories = city ? 
              await neighborhoodCache.getBoroughs(city) : 
              await neighborhoodCache.getBoroughs();
          } else {
            // For city-based configs, get relevant cities
            if (mapName === 'Boston Greater Area') {
              const allCities = await neighborhoodCache.getCities('Massachusetts');
              categories = allCities.filter(city => 
                ['Boston', 'Cambridge', 'Somerville'].includes(city.name)
              );
            } else {
              categories = await neighborhoodCache.getCities();
            }
          }
          
          areasData[mapName] = {
            config,
            neighborhoods,
            categories,
            isLoaded: true
          };
          
          console.log(`📝 UserDashboard: ${mapName} - neighborhoods: ${neighborhoods.length}, categories: ${categories.length}`);
          
        } catch (error) {
          console.log(`📝 UserDashboard: ${mapName} data not available:`, error);
          areasData[mapName] = {
            config,
            neighborhoods: [],
            categories: [],
            isLoaded: false
          };
        }
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
  }, []);

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

  // Category color mapping for future use
  // const getCategoryColor = (category: string) => {
  //   switch (category) {
  //     case 'Good': return 'success';
  //     case 'Mid': return 'warning';
  //     case 'Bad': return 'error';
  //     default: return 'default';
  //   }
  // };

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

  if (!stats) {
    return (
      <Box className="flex justify-center items-center h-full">
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
          
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e3c72', mb: 1 }}>
                  {stats.totalVisits}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Total Visits
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#400B8B', mb: 1 }}>
                  {stats.totalNeighborhoods}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Neighborhoods
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e3c72', mb: 1 }}>
                  {stats.totalCountries}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Countries
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#059669', mb: 1 }}>
                  {stats.averageRating?.toFixed(1) || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Avg. Rating
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={4} sx={{ width: '100%', margin: 0, justifyContent: 'center' }}>
        {/* Countries StatsCard */}
        <Grid item xs={12} lg={Object.keys(mapAreas).length > 0 ? 4 : 6}>
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
        </Grid>

        {/* Dynamic Neighborhood StatsCards for all configured maps */}
        {Object.entries(mapAreas)
          .filter(([, areaData]) => areaData.isLoaded && areaData.neighborhoods.length > 0 && areaData.categories.length > 0)
          .map(([mapName, areaData]) => (
            <Grid item xs={12} lg={4} key={mapName}>
              <StatsCard
                visits={allVisits}
                neighborhoods={areaData.neighborhoods}
                categories={areaData.categories}
                categoryType={areaData.config.categoryType}
                areaName={areaData.config.name === 'Boston Greater Area' ? 'Boston Greater Area' : areaData.config.name}
              />
            </Grid>
          ))
        }
      </Grid>
    </Box>
  );
};

export default UserDashboard;
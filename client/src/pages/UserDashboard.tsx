import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Paper
} from '@mui/material';
import { TrendingUp, LocationOn, Star, Public, Explore } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { visitsApi, type Visit } from '../services/visitsApi';
import { countriesApi, type Country } from '../services/countriesApi';

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

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [boroughs, setBoroughs] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      console.log('📊 UserDashboard: Loading user statistics');
      
      // Fetch all visits
      const visits = await visitsApi.getAllVisits();
      console.log('📝 UserDashboard: Received visits:', visits.length);
      console.log('📝 UserDashboard: Sample visit:', visits[0]);
      
      // Fetch countries for lookup
      const countriesData = await countriesApi.getAllCountries();
      console.log('📝 UserDashboard: Received countries:', countriesData.length);
      setCountries(countriesData);
      
      // Fetch neighborhoods and boroughs for lookup
      let neighborhoodsData: any[] = [];
      let boroughsData: any[] = [];
      try {
        // Try to fetch neighborhood data - this might not exist yet
        const neighborhoodResponse = await fetch('/api/neighborhoods');
        if (neighborhoodResponse.ok) {
          neighborhoodsData = await neighborhoodResponse.json();
        }
        const boroughResponse = await fetch('/api/boroughs');
        if (boroughResponse.ok) {
          boroughsData = await boroughResponse.json();
        }
      } catch (err) {
        console.log('📝 UserDashboard: Neighborhood/borough data not available');
      }
      setNeighborhoods(neighborhoodsData);
      setBoroughs(boroughsData);
      
      // Calculate statistics
      const userStats = calculateUserStats(visits, countriesData, neighborhoodsData, boroughsData);
      setStats(userStats);
      
    } catch (err: any) {
      console.error('❌ UserDashboard: Error loading stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = (visits: Visit[], countries: Country[], neighborhoods: any[] = [], boroughs: any[] = []): UserStats => {
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Good': return 'success';
      case 'Mid': return 'warning';
      case 'Bad': return 'error';
      default: return 'default';
    }
  };

  const formatVisitName = (visit: Visit, countries: Country[] = [], neighborhoods: any[] = [], boroughs: any[] = []) => {
    if (visit.visitType === 'neighborhood') {
      // Try to get the name from the visit first, then lookup
      if (visit.neighborhoodName) {
        return visit.neighborhoodName;
      }
      
      // Lookup neighborhood by ID
      const neighborhood = neighborhoods.find(n => n._id === visit.neighborhoodId);
      if (neighborhood) {
        const borough = boroughs.find(b => b._id === neighborhood.boroughId);
        return `${neighborhood.name}${borough ? `, ${borough.name}` : ''}`;
      }
      
      return 'Unknown Neighborhood';
    } else {
      // Try to get the name from the visit first, then lookup
      if (visit.countryName) {
        return visit.countryName;
      }
      
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

  const totalPossibleScore = stats.totalVisits * 10;
  const currentScore = stats.averageRating ? stats.averageRating * stats.totalVisits : 0;
  const scorePercentage = totalPossibleScore > 0 ? (currentScore / totalPossibleScore) * 100 : 0;

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
      <Typography variant="h4" className="mb-8 font-bold text-gray-800" sx={{ textAlign: 'center' }}>
        Welcome back, {user?.username}!
      </Typography>
      
      <Grid container spacing={4} sx={{ width: '100%', margin: 0, justifyContent: 'center' }}>
        {/* Countries StatsCard */}
        <Grid item xs={12} lg={6}>
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
                              {formatVisitName(visit, countries, neighborhoods, boroughs)}
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

        {/* Neighborhoods StatsCard */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #400B8B 0%, #B07FF6 100%)', 
            color: 'white',
            height: 'fit-content'
          }}>
            <CardContent>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Explore sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Your NYC Exploration Stats
                </Typography>
              </Box>

              {/* Main Stats Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stats.totalNeighborhoods}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Neighborhoods Visited
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                    <LocationOn sx={{ mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      5 Boroughs
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    NYC Area Explored
                  </Typography>
                </Box>
              </Box>

              {/* Top Neighborhoods */}
              {stats.topRatedNeighborhoods.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Star sx={{ mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Top Neighborhoods
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {stats.topRatedNeighborhoods.slice(0, 3).map((visit, index) => (
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
                              {formatVisitName(visit, countries, neighborhoods, boroughs)}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label={visit.rating?.toFixed(1) || 'N/A'}
                          size="small"
                          sx={{ 
                            backgroundColor: index === 0 ? '#FEF504' : 'rgba(255,255,255,0.2)', 
                            color: index === 0 ? '#400B8B' : 'white',
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
      </Grid>
    </Box>
  );
};

export default UserDashboard;
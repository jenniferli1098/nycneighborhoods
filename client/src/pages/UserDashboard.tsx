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
        padding: '48px 64px',
        margin: 0,
        boxSizing: 'border-box'
      }}
    >
      <Typography variant="h4" className="mb-12 font-bold text-gray-800">
        Welcome back, {user?.username}!
      </Typography>
      
      <Grid container spacing={6} sx={{ width: '100%', margin: 0 }}>

        {/* NYC Neighborhoods Module */}
        <Grid item xs={12} sx={{ width: '100%' }}>
          <Card sx={{ 
            backgroundColor: '#f8fafc', 
            border: '2px solid #e2e8f0', 
            width: '100%',
            height: '100%',
            minHeight: 'fit-content',
            paddingY: '24px'
          }}>
            <CardContent sx={{ padding: '48px', height: '100%' }}>
              <Typography variant="h4" className="mb-6 font-bold text-gray-800">
                🏙️ NYC Neighborhoods
              </Typography>
              
              {/* NYC Neighborhoods Stats */}
              <Grid item xs={12}>
                <Card className="mb-8" sx={{ paddingY: '16px' }}>
                <CardContent sx={{ padding: '32px' }}>
                  <Typography variant="h6" className="mb-4 font-semibold text-gray-700">
                    Statistics
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box className="text-center">
                        <Typography variant="h3" className="font-bold text-purple-600 mb-2">
                          {stats.totalNeighborhoods}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Neighborhoods Visited
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box className="text-center">
                        <Typography variant="h3" className="font-bold text-indigo-600 mb-2">
                          {stats.boroughsVisited || 5}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Boroughs Explored
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box className="text-center">
                        <Typography variant="h3" className="font-bold text-blue-600 mb-2">
                          {stats.recentNeighborhoods.length}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Recent Visits
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box className="text-center">
                        <Typography variant="h3" className="font-bold text-cyan-600 mb-2">
                          {stats.topRatedNeighborhoods.length}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Top Rated
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
                </Card>
              </Grid>

              {/* Recent and Top Rated Neighborhoods */}
              <Grid container spacing={6}>
                {/* Recent Neighborhoods */}
                <Grid item xs={12}>
                  <Grid item xs={12} md={6}>
                  <Card sx={{ height: '320px', paddingY: '12px' }}>
                    <CardContent sx={{ height: '100%', padding: '24px' }}>
                      <Typography variant="h6" className="mb-3">
                        Recent Visits
                      </Typography>
                      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <Box className="space-y-2 h-full overflow-y-auto">
                          {stats.recentNeighborhoods.length > 0 ? (
                            stats.recentNeighborhoods.map((visit, index) => (
                              <Paper key={visit._id} className="p-2" variant="outlined" sx={{ minHeight: 'fit-content' }}>
                                <Box className="flex justify-between items-center">
                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="body2" className="font-medium" sx={{ 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis', 
                                      whiteSpace: 'nowrap' 
                                    }}>
                                      {formatVisitName(visit, countries, neighborhoods, boroughs)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : 'No date'}
                                    </Typography>
                                  </Box>
                                  <Box className="flex items-center gap-1 ml-2" sx={{ flexShrink: 0 }}>
                                    {visit.category && (
                                      <Chip 
                                        label={visit.category} 
                                        color={getCategoryColor(visit.category) as any}
                                        size="small" 
                                      />
                                    )}
                                    {visit.rating && (
                                      <Typography variant="body2" className="font-mono">
                                        {visit.rating}/10
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </Paper>
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No neighborhood visits yet
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                  </Grid>
                </Grid>

                {/* Top Rated Neighborhoods */}
                <Grid item xs={12}>
                  <Grid item xs={12} md={6}>
                  <Card sx={{ height: '320px', paddingY: '12px' }}>
                    <CardContent sx={{ height: '100%', padding: '24px' }}>
                      <Typography variant="h6" className="mb-3">
                        Top Rated
                      </Typography>
                      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <Box className="space-y-2 h-full overflow-y-auto">
                          {stats.topRatedNeighborhoods.length > 0 ? (
                            stats.topRatedNeighborhoods.map((visit, index) => (
                              <Paper key={visit._id} className="p-2" variant="outlined" sx={{ minHeight: 'fit-content' }}>
                                <Box className="flex justify-between items-center">
                                  <Box className="flex items-center gap-2" sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="body2" className="font-mono text-gray-500" sx={{ flexShrink: 0 }}>
                                      #{index + 1}
                                    </Typography>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                      <Typography variant="body2" className="font-medium" sx={{ 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap' 
                                      }}>
                                        {formatVisitName(visit, countries, neighborhoods, boroughs)}
                                      </Typography>
                                      {visit.notes && (
                                        <Typography variant="caption" color="text.secondary" sx={{ 
                                          overflow: 'hidden', 
                                          textOverflow: 'ellipsis', 
                                          whiteSpace: 'nowrap',
                                          display: 'block'
                                        }}>
                                          "{visit.notes}"
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                  <Box className="flex items-center gap-1 ml-2" sx={{ flexShrink: 0 }}>
                                    {visit.category && (
                                      <Chip 
                                        label={visit.category} 
                                        color={getCategoryColor(visit.category) as any}
                                        size="small" 
                                      />
                                    )}
                                    <Typography variant="body2" className="font-bold text-blue-600">
                                      {visit.rating}/10
                                    </Typography>
                                  </Box>
                                </Box>
                              </Paper>
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No rated neighborhoods yet
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Countries Module */}
        <Grid item xs={12} sx={{ width: '100%' }}>
          <Card sx={{ 
            backgroundColor: '#f0fdf4', 
            border: '2px solid #bbf7d0', 
            width: '100%',
            height: '100%',
            minHeight: 'fit-content',
            paddingY: '24px'
          }}>
            <CardContent sx={{ padding: '48px', height: '100%' }}>
              <Typography variant="h4" className="mb-6 font-bold text-gray-800">
                🌍 Countries
              </Typography>
              
              {/* Countries Stats */}
              <Grid item xs={12}>
                <Card className="mb-8" sx={{ paddingY: '16px' }}>
                <CardContent sx={{ padding: '32px' }}>
                  <Typography variant="h6" className="mb-4 font-semibold text-gray-700">
                    Statistics
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box className="text-center">
                        <Typography variant="h3" className="font-bold text-green-600 mb-2">
                          {stats.totalCountries}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Countries Visited
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box className="text-center">
                        <Typography variant="h3" className="font-bold text-emerald-600 mb-2">
                          {stats.continentsVisited}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Continents Explored
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box className="text-center">
                        <Typography variant="h3" className="font-bold text-teal-600 mb-2">
                          {stats.recentCountries.length}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Recent Visits
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box className="text-center">
                        <Typography variant="h3" className="font-bold text-lime-600 mb-2">
                          {stats.topRatedCountries.length}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Top Rated
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
                </Card>
              </Grid>

              {/* Recent and Top Rated Countries */}
              <Grid container spacing={6}>
                {/* Recent Countries */}
                <Grid item xs={12}>
                  <Grid item xs={12} md={6}>
                  <Card sx={{ height: '320px', paddingY: '12px' }}>
                    <CardContent sx={{ height: '100%', padding: '24px' }}>
                      <Typography variant="h6" className="mb-3">
                        Recent Visits
                      </Typography>
                      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <Box className="space-y-2 h-full overflow-y-auto">
                          {stats.recentCountries.length > 0 ? (
                            stats.recentCountries.map((visit, index) => (
                              <Paper key={visit._id} className="p-2" variant="outlined" sx={{ minHeight: 'fit-content' }}>
                                <Box className="flex justify-between items-center">
                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="body2" className="font-medium" sx={{ 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis', 
                                      whiteSpace: 'nowrap' 
                                    }}>
                                      {formatVisitName(visit, countries, neighborhoods, boroughs)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : 'No date'}
                                    </Typography>
                                  </Box>
                                  <Box className="flex items-center gap-1 ml-2" sx={{ flexShrink: 0 }}>
                                    {visit.category && (
                                      <Chip 
                                        label={visit.category} 
                                        color={getCategoryColor(visit.category) as any}
                                        size="small" 
                                      />
                                    )}
                                    {visit.rating && (
                                      <Typography variant="body2" className="font-mono">
                                        {visit.rating}/10
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </Paper>
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No country visits yet
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                  </Grid>
                </Grid>

                {/* Top Rated Countries */}
                <Grid item xs={12}>
                  <Grid item xs={12} md={6}>
                  <Card sx={{ height: '320px', paddingY: '12px' }}>
                    <CardContent sx={{ height: '100%', padding: '24px' }}>
                      <Typography variant="h6" className="mb-3">
                        Top Rated
                      </Typography>
                      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <Box className="space-y-2 h-full overflow-y-auto">
                          {stats.topRatedCountries.length > 0 ? (
                            stats.topRatedCountries.map((visit, index) => (
                              <Paper key={visit._id} className="p-2" variant="outlined" sx={{ minHeight: 'fit-content' }}>
                                <Box className="flex justify-between items-center">
                                  <Box className="flex items-center gap-2" sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="body2" className="font-mono text-gray-500" sx={{ flexShrink: 0 }}>
                                      #{index + 1}
                                    </Typography>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                      <Typography variant="body2" className="font-medium" sx={{ 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap' 
                                      }}>
                                        {formatVisitName(visit, countries, neighborhoods, boroughs)}
                                      </Typography>
                                      {visit.notes && (
                                        <Typography variant="caption" color="text.secondary" sx={{ 
                                          overflow: 'hidden', 
                                          textOverflow: 'ellipsis', 
                                          whiteSpace: 'nowrap',
                                          display: 'block'
                                        }}>
                                          "{visit.notes}"
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                  <Box className="flex items-center gap-1 ml-2" sx={{ flexShrink: 0 }}>
                                    {visit.category && (
                                      <Chip 
                                        label={visit.category} 
                                        color={getCategoryColor(visit.category) as any}
                                        size="small" 
                                      />
                                    )}
                                    <Typography variant="body2" className="font-bold text-blue-600">
                                      {visit.rating}/10
                                    </Typography>
                                  </Box>
                                </Box>
                              </Paper>
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No rated countries yet
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDashboard;
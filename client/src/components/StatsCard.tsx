import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress
} from '@mui/material';
import { TrendingUp, LocationOn, Star } from '@mui/icons-material';

interface Visit {
  _id: string;
  userId: string;
  neighborhoodId: string;
  visited: boolean;
  notes: string;
  visitDate: string;
  rating: number;
  category: 'Bad' | 'Mid' | 'Good';
  walkabilityScore: number;
}

interface Borough {
  _id: string;
  name: string;
  description?: string;
}

interface Neighborhood {
  _id: string;
  name: string;
  boroughId: string;
  description?: string;
  walkabilityScore?: number;
  averageVisitRating?: number;
  totalVisits?: number;
}

interface StatsCardProps {
  visits: Visit[];
  neighborhoods: Neighborhood[];
  boroughs: Borough[];
}

const StatsCard: React.FC<StatsCardProps> = ({ visits, neighborhoods, boroughs }) => {
  // Calculate total neighborhoods visited
  const totalVisited = visits.filter(v => v.visited).length;
  const totalNeighborhoods = neighborhoods.length;
  const completionPercentage = totalNeighborhoods > 0 ? (totalVisited / totalNeighborhoods) * 100 : 0;

  // Create borough mapping
  const boroughMap = new Map(boroughs.map(b => [b._id, b.name]));
  const neighborhoodMap = new Map(neighborhoods.map(n => [n._id, n]));

  // Calculate favorite borough (highest average rating)
  const boroughStats = new Map<string, { totalRating: number; count: number; name: string }>();
  
  visits
    .filter(v => v.visited && v.rating != null)
    .forEach(visit => {
      const neighborhood = neighborhoodMap.get(visit.neighborhoodId);
      if (neighborhood) {
        const boroughName = boroughMap.get(neighborhood.boroughId);
        if (boroughName) {
          const current = boroughStats.get(boroughName) || { totalRating: 0, count: 0, name: boroughName };
          current.totalRating += visit.rating;
          current.count += 1;
          boroughStats.set(boroughName, current);
        }
      }
    });

  // Find favorite borough
  let favoriteBorough = 'None';
  let highestAvgRating = 0;

  boroughStats.forEach((stats, boroughName) => {
    const avgRating = stats.totalRating / stats.count;
    if (avgRating > highestAvgRating) {
      highestAvgRating = avgRating;
      favoriteBorough = boroughName;
    }
  });

  // Calculate top 3 neighborhoods
  const ratedVisits = visits.filter(v => v.visited && v.rating != null);
  const topNeighborhoods = ratedVisits
    .map(visit => {
      const neighborhood = neighborhoodMap.get(visit.neighborhoodId);
      const boroughName = neighborhood ? boroughMap.get(neighborhood.boroughId) : 'Unknown';
      return {
        name: neighborhood?.name || 'Unknown',
        borough: boroughName || 'Unknown',
        rating: visit.rating
      };
    })
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  const categoryDistribution = {
    Bad: visits.filter(v => v.category === 'Bad').length,
    Mid: visits.filter(v => v.category === 'Mid').length,
    Good: visits.filter(v => v.category === 'Good').length
  };

  return (
    <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #400B8B 0%, #B07FF6 100%)', color: 'white' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUp sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Your NYC Exploration Stats
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          {/* Total Visited */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              {totalVisited}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Neighborhoods Visited
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              out of {totalNeighborhoods}
            </Typography>
          </Box>

          {/* Favorite Borough */}
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
              <LocationOn sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {favoriteBorough}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Favorite Borough
            </Typography>
            {highestAvgRating > 0 && (
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {highestAvgRating.toFixed(1)}/10 avg rating
              </Typography>
            )}
          </Box>
        </Box>

        {/* Top 3 Neighborhoods */}
        {topNeighborhoods.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Star sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Top Neighborhoods
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {topNeighborhoods.map((neighborhood, index) => (
                <Box 
                  key={`${neighborhood.name}-${neighborhood.borough}`}
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
                        {neighborhood.name}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, lineHeight: 1 }}>
                        {neighborhood.borough}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={neighborhood.rating.toFixed(1)}
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

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              NYC Exploration Progress
            </Typography>
            <Typography variant="body2">
              {completionPercentage.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={completionPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#FEF504',
                borderRadius: 4
              }
            }}
          />
        </Box>

        {/* Category Distribution */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Chip 
            label={`Good: ${categoryDistribution.Good}`}
            size="small"
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
          <Chip 
            label={`Mid: ${categoryDistribution.Mid}`}
            size="small"
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
          <Chip 
            label={`Bad: ${categoryDistribution.Bad}`}
            size="small"
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
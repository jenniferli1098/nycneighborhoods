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
import type { Visit } from '../services/visitsApi';
import type { CachedNeighborhood, CachedBorough, CachedCity } from '../services/neighborhoodCache';
import type { CategoryType } from '../config/mapConfigs';


interface StatsCardProps {
  visits: Visit[];
  neighborhoods: CachedNeighborhood[];
  categories: (CachedBorough | CachedCity)[];
  categoryType: CategoryType;
  areaName: string; // e.g., "NYC", "Boston Greater Area"
}

const StatsCard: React.FC<StatsCardProps> = ({ visits, neighborhoods, categories, categoryType, areaName }) => {
  // Create category and neighborhood mappings
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const neighborhoodMap = new Map(neighborhoods.map(n => [n.id, n]));
  
  // Filter visits to only include those for neighborhoods in the current context
  const relevantVisits = visits.filter(visit => {
    if (!visit.neighborhoodId) return false;
    const neighborhood = neighborhoodMap.get(visit.neighborhoodId);
    if (!neighborhood) return false;
    
    // Check if neighborhood belongs to current area's categories
    const categoryId = categoryType === 'borough' ? neighborhood.boroughId : neighborhood.cityId;
    return categoryId && categoryMap.has(categoryId);
  });

  // Calculate total neighborhoods visited (only in current context)
  const totalVisited = relevantVisits.filter(v => v.visited).length;
  // Filter neighborhoods to only count those in current context
  const relevantNeighborhoods = neighborhoods.filter(neighborhood => {
    const categoryId = categoryType === 'borough' ? neighborhood.boroughId : neighborhood.cityId;
    return categoryId && categoryMap.has(categoryId);
  });
  const totalNeighborhoods = relevantNeighborhoods.length;
  const completionPercentage = totalNeighborhoods > 0 ? (totalVisited / totalNeighborhoods) * 100 : 0;

  // Calculate favorite category (highest average rating)
  const categoryStats = new Map<string, { totalRating: number; count: number; name: string }>();
  
  relevantVisits
    .filter(v => v.visited && v.rating != null && v.neighborhoodId)
    .forEach(visit => {
      const neighborhood = neighborhoodMap.get(visit.neighborhoodId!);
      if (neighborhood) {
        // Use appropriate ID field based on category type
        const categoryId = categoryType === 'borough' ? neighborhood.boroughId : neighborhood.cityId;
        const categoryName = categoryId ? categoryMap.get(categoryId) : undefined;
        if (categoryName && visit.rating !== null) {
          const current = categoryStats.get(categoryName) || { totalRating: 0, count: 0, name: categoryName };
          current.totalRating += visit.rating;
          current.count += 1;
          categoryStats.set(categoryName, current);
        }
      }
    });

  // Find favorite category
  let favoriteCategory = 'None';
  let highestAvgRating = 0;

  categoryStats.forEach((stats, categoryName) => {
    const avgRating = stats.totalRating / stats.count;
    if (avgRating > highestAvgRating) {
      highestAvgRating = avgRating;
      favoriteCategory = categoryName;
    }
  });

  // Calculate top 3 neighborhoods
  const ratedVisits = relevantVisits.filter(v => v.visited && v.rating != null && v.neighborhoodId);
  const topNeighborhoods = ratedVisits
    .map(visit => {
      const neighborhood = neighborhoodMap.get(visit.neighborhoodId!);
      const categoryId = categoryType === 'borough' ? neighborhood?.boroughId : neighborhood?.cityId;
      const categoryName = categoryId ? categoryMap.get(categoryId) : undefined;
      return {
        name: neighborhood?.name || 'Unknown',
        category: categoryName || 'Unknown',
        rating: visit.rating!
      };
    })
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  const categoryDistribution = {
    Bad: relevantVisits.filter(v => v.category === 'Bad').length,
    Mid: relevantVisits.filter(v => v.category === 'Mid').length,
    Good: relevantVisits.filter(v => v.category === 'Good').length
  };

  return (
    <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #400B8B 0%, #B07FF6 100%)', color: 'white' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUp sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Your {areaName} Stats
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

          {/* Favorite Category */}
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
              <LocationOn sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {favoriteCategory}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Favorite {categoryType === 'borough' ? 'Borough' : 'City'}
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
                  key={`${neighborhood.name}-${neighborhood.category}`}
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
                        {neighborhood.category}
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
              {areaName} Progress
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
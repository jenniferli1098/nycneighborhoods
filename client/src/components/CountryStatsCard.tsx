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
import type { Country } from '../services/countriesApi';

interface CountryStatsCardProps {
  visits: Visit[];
  countries: Country[];
  continents: string[];
}

const CountryStatsCard: React.FC<CountryStatsCardProps> = ({ visits, countries }) => {
  // Calculate total countries visited
  const totalVisited = visits.filter(v => v.visited).length;
  const totalCountries = countries.length;
  const completionPercentage = totalCountries > 0 ? (totalVisited / totalCountries) * 100 : 0;

  // Create country mapping
  const countryMap = new Map(countries.map(c => [c._id, c]));

  // Calculate favorite continent (highest average rating)
  const continentStats = new Map<string, { totalRating: number; count: number; name: string }>();
  
  visits
    .filter(v => v.visited && v.rating != null && v.countryId)
    .forEach(visit => {
      const country = countryMap.get(visit.countryId!);
      if (country && visit.rating !== null) {
        const continentName = country.continent;
        const current = continentStats.get(continentName) || { totalRating: 0, count: 0, name: continentName };
        current.totalRating += visit.rating;
        current.count += 1;
        continentStats.set(continentName, current);
      }
    });

  // Find favorite continent
  let favoriteContinent = 'None';
  let highestAvgRating = 0;

  continentStats.forEach((stats, continentName) => {
    const avgRating = stats.totalRating / stats.count;
    if (avgRating > highestAvgRating) {
      highestAvgRating = avgRating;
      favoriteContinent = continentName;
    }
  });

  // Calculate top 3 countries
  const ratedVisits = visits.filter(v => v.visited && v.rating != null && v.countryId);
  const topCountries = ratedVisits
    .map(visit => {
      const country = countryMap.get(visit.countryId!);
      return {
        name: country?.name || 'Unknown',
        continent: country?.continent || 'Unknown',
        rating: visit.rating!
      };
    })
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  // Calculate visited countries by continent
  const visitedByContinent: Record<string, number> = {};
  visits.filter(v => v.visited && v.countryId).forEach(visit => {
    const country = countryMap.get(visit.countryId!);
    if (country) {
      visitedByContinent[country.continent] = (visitedByContinent[country.continent] || 0) + 1;
    }
  });

  const categoryDistribution = {
    Bad: visits.filter(v => v.category === 'Bad').length,
    Mid: visits.filter(v => v.category === 'Mid').length,
    Good: visits.filter(v => v.category === 'Good').length
  };

  return (
    <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUp sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Your World Exploration Stats
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          {/* Total Visited */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              {totalVisited}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Countries Visited
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              out of {totalCountries}
            </Typography>
          </Box>

          {/* Favorite Continent */}
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
              <LocationOn sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {favoriteContinent}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Favorite Continent
            </Typography>
            {highestAvgRating > 0 && (
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {highestAvgRating.toFixed(1)}/10 avg rating
              </Typography>
            )}
          </Box>
        </Box>

        {/* Top 3 Countries */}
        {topCountries.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Star sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Top Countries
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {topCountries.map((country, index) => (
                <Box 
                  key={`${country.name}-${country.continent}`}
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
                        {country.name}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, lineHeight: 1 }}>
                        {country.continent}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={country.rating.toFixed(1)}
                    size="small"
                    sx={{ 
                      backgroundColor: index === 0 ? '#FEF504' : 'rgba(255,255,255,0.2)', 
                      color: index === 0 ? '#1e3c72' : 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Countries by Continent */}
        {Object.keys(visitedByContinent).length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Countries by Continent:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(visitedByContinent).map(([continent, count]) => (
                <Chip
                  key={continent}
                  label={`${continent}: ${count}`}
                  size="small"
                  sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              World Exploration Progress
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
                backgroundColor: '#4fc3f7',
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

export default CountryStatsCard;
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  useTheme
} from '@mui/material';
import { LocationOn, Star, Public } from '@mui/icons-material';
import type { UserStats } from '../../hooks/useUserStats';
import type { Country } from '../../services/countriesApi';
import type { Visit } from '../../services/visitsApi';

interface CountriesStatsCardProps {
  stats: UserStats;
  countries: Country[];
  formatVisitName: (visit: Visit, countries: Country[]) => string;
}

const CountriesStatsCard: React.FC<CountriesStatsCardProps> = ({ 
  stats, 
  countries, 
  formatVisitName 
}) => {
  const theme = useTheme();

  return (
    <Card sx={{ 
      background: theme.gradients.countriesCard, 
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
  );
};

export default CountriesStatsCard;
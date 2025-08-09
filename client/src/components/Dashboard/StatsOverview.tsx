import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import type { UserStats } from '../../hooks/useUserStats';

interface StatsOverviewProps {
  stats: UserStats;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const theme = useTheme();

  return (
    <Card sx={{ 
      background: theme.gradients.statsOverview,
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
  );
};

export default StatsOverview;
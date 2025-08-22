import React from 'react';
import { Box, Typography, Card, LinearProgress } from '@mui/material';

const StatsPreview: React.FC = () => {
  // Community stats data removed as it's unused

  const boroughProgress = [
    { name: 'Manhattan', progress: 78, neighborhoods: 28, color: '#EF4444' },
    { name: 'Brooklyn', progress: 45, neighborhoods: 23, color: '#3B82F6' },
    { name: 'Queens', progress: 32, neighborhoods: 25, color: '#10B981' },
    { name: 'Bronx', progress: 28, neighborhoods: 16, color: '#F59E0B' },
    { name: 'Staten Island', progress: 65, neighborhoods: 8, color: '#8B5CF6' }
  ];

  return (
    <Box>

      {/* Borough Progress */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: 3,
        p: { xs: 3, sm: 4, md: 6 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mx: { xs: 2, sm: 0 }
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 'bold', 
            textAlign: 'center',
            mb: 2,
            color: '#1e293b',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
          }}
        >
          Community Exploration Progress
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            textAlign: 'center', 
            mb: { xs: 4, sm: 5, md: 6 },
            maxWidth: { xs: '100%', sm: 450, md: 500 },
            fontSize: { xs: '0.9rem', sm: '1rem' },
            px: { xs: 2, sm: 0 }
          }}
        >
          See how much of each borough our community has explored together
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: { xs: 2, sm: 3, md: 4 }, maxWidth: 1000 }}>
            {boroughProgress.map((borough, index) => (
              <Box key={index}>
                <Card sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 1,
                      color: borough.color,
                      fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                    }}
                  >
                    {borough.name}
                  </Typography>
                  
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 2,
                      color: '#1e293b',
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                    }}
                  >
                    {borough.progress}%
                  </Typography>

                  <LinearProgress 
                    variant="determinate" 
                    value={borough.progress}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      mb: 2,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: borough.color,
                      },
                      backgroundColor: `${borough.color}20`
                    }}
                  />

                  <Typography variant="body2" color="text.secondary" sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    {borough.neighborhoods} neighborhoods
                  </Typography>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mt: { xs: 4, sm: 5, md: 6 }, px: { xs: 2, sm: 0 } }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              color: '#400B8B',
              mb: 1,
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
            }}
          >
            🎯 Community Goal: Explore Every NYC Neighborhood
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}>
            Help us reach 100% coverage across all five boroughs!
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default StatsPreview;
import React from 'react';
import { Box, Typography, Card, Grid, Chip, Rating } from '@mui/material';
import { LocationOn, CheckCircle } from '@mui/icons-material';

const DemoMapPreview: React.FC = () => {
  const sampleNeighborhoods = [
    {
      name: 'Greenwich Village',
      borough: 'Manhattan',
      visited: true,
      rating: 5,
      note: 'Amazing coffee shops and historic charm!',
      color: '#10B981'
    },
    {
      name: 'Williamsburg',
      borough: 'Brooklyn', 
      visited: true,
      rating: 4,
      note: 'Great nightlife and waterfront views',
      color: '#3B82F6'
    },
    {
      name: 'Astoria',
      borough: 'Queens',
      visited: false,
      rating: 0,
      note: '',
      color: '#6B7280'
    },
    {
      name: 'Park Slope',
      borough: 'Brooklyn',
      visited: true,
      rating: 5,
      note: 'Perfect for families, beautiful brownstones',
      color: '#8B5CF6'
    }
  ];

  return (
    <Box>
      {/* Section Header */}

      {/* Section Header */}
      <Box sx={{ textAlign: 'center', mb: 12 }}>
        <Typography 
          variant="h2" 
          sx={{ 
            fontWeight: 800, 
            mb: 3,
            fontSize: { xs: '2rem', md: '2.75rem' },
            color: '#1e293b',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Everything You Need to{' '}
          <Box
            component="span"
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Explore NYC
          </Box>
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#64748b', 
            maxWidth: 650, 
            mx: 'auto', 
            lineHeight: 1.6,
            fontWeight: 400,
            fontSize: { xs: '1.1rem', md: '1.25rem' },
          }}
        >
          From the bustling streets of Manhattan to the artistic enclaves of Brooklyn, 
          track your journey through America's greatest city
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Grid container spacing={4} alignItems="center" sx={{ maxWidth: 1200 }}>
          {/* Mock Map */}
          <Grid item xs={12} md={8}>
            <Card 
              sx={{ 
                p: 4,
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                border: '2px dashed rgba(100, 116, 139, 0.3)',
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
            {/* NYC Map Placeholder */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <LocationOn sx={{ fontSize: 60, color: '#400B8B', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#400B8B', mb: 1 }}>
                Interactive NYC Map
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Click neighborhoods to mark as visited
              </Typography>
            </Box>

            {/* Sample neighborhood dots */}
            <Box sx={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: 400, 
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Manhattan */}
              <Box sx={{ 
                position: 'absolute', 
                top: '20%', 
                left: '45%',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{ 
                  width: 16, 
                  height: 16, 
                  borderRadius: '50%', 
                  bgcolor: '#10B981',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }} />
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  Greenwich Village ✓
                </Typography>
              </Box>

              {/* Brooklyn */}
              <Box sx={{ 
                position: 'absolute', 
                bottom: '20%', 
                right: '30%',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{ 
                  width: 16, 
                  height: 16, 
                  borderRadius: '50%', 
                  bgcolor: '#3B82F6',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }} />
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  Williamsburg ✓
                </Typography>
              </Box>

              {/* Queens */}
              <Box sx={{ 
                position: 'absolute', 
                top: '30%', 
                right: '15%',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{ 
                  width: 16, 
                  height: 16, 
                  borderRadius: '50%', 
                  bgcolor: '#6B7280',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }} />
                <Typography variant="caption" color="text.secondary">
                  Astoria
                </Typography>
              </Box>
            </Box>

            {/* Progress indicator */}
            <Box sx={{ 
              mt: 4, 
              p: 2, 
              borderRadius: 2, 
              background: 'rgba(64, 11, 139, 0.1)',
              border: '1px solid rgba(64, 11, 139, 0.2)'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#400B8B' }}>
                🎉 You've explored 3 of 200+ NYC neighborhoods (1.5%)
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Neighborhood Cards */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sampleNeighborhoods.map((neighborhood, index) => (
              <Card 
                key={index}
                sx={{ 
                  p: 3,
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                  border: neighborhood.visited ? `2px solid ${neighborhood.color}` : '1px solid #e2e8f0'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {neighborhood.name}
                    </Typography>
                    <Chip 
                      label={neighborhood.borough} 
                      size="small" 
                      sx={{ 
                        bgcolor: `${neighborhood.color}20`,
                        color: neighborhood.color,
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  {neighborhood.visited && (
                    <CheckCircle sx={{ color: neighborhood.color, fontSize: 24 }} />
                  )}
                </Box>

                {neighborhood.visited && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Rating value={neighborhood.rating} size="small" readOnly />
                      <Typography variant="body2" color="text.secondary">
                        ({neighborhood.rating}/5)
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      "{neighborhood.note}"
                    </Typography>
                  </>
                )}

                {!neighborhood.visited && (
                  <Typography variant="body2" color="text.secondary">
                    Ready to explore? Click to mark as visited!
                  </Typography>
                )}
              </Card>
            ))}
          </Box>
        </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default DemoMapPreview;
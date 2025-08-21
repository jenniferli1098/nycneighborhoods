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
      <Box sx={{ textAlign: 'center', mb: { xs: 6, sm: 8, md: 12 }, px: { xs: 2, sm: 3, md: 0 } }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 'bold', 
            mb: { xs: 2, sm: 3 },
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.75rem' },
            color: '#1e293b'
          }}
        >
          See It In Action
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            maxWidth: { xs: '100%', sm: 500, md: 600 }, 
            mx: 'auto',
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
            px: { xs: 1, sm: 0 },
          }}
        >
          Here's what your neighborhood tracking experience looks like
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', px: { xs: 2, sm: 3, md: 0 } }}>
        <Grid container spacing={{ xs: 3, sm: 4 }} alignItems="center" sx={{ maxWidth: 1200 }}>
          {/* Mock Map */}
          <Grid item xs={12} md={8}>
            <Card 
              sx={{ 
                p: { xs: 2, sm: 3, md: 4 },
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                border: '2px dashed rgba(100, 116, 139, 0.3)',
                minHeight: { xs: 300, sm: 350, md: 400 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
            {/* NYC Map Placeholder */}
            <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
              <LocationOn sx={{ fontSize: { xs: 48, sm: 60 }, color: '#400B8B', mb: 2 }} />
              <Typography variant="h5" sx={{ 
                fontWeight: 'bold', 
                color: '#400B8B', 
                mb: 1,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}>
                Interactive NYC Map
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}>
                Click neighborhoods to mark as visited
              </Typography>
            </Box>

            {/* Sample neighborhood dots */}
            <Box sx={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: { xs: 280, sm: 350, md: 400 }, 
              height: { xs: 150, sm: 180, md: 200 },
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
                <Typography variant="caption" sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  display: { xs: 'none', sm: 'block' }
                }}>
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
                <Typography variant="caption" sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  display: { xs: 'none', sm: 'block' }
                }}>
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
                <Typography variant="caption" color="text.secondary" sx={{
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  display: { xs: 'none', sm: 'block' }
                }}>
                  Astoria
                </Typography>
              </Box>
            </Box>

            {/* Progress indicator */}
            <Box sx={{ 
              mt: { xs: 3, sm: 4 }, 
              p: { xs: 1.5, sm: 2 }, 
              borderRadius: 2, 
              background: 'rgba(64, 11, 139, 0.1)',
              border: '1px solid rgba(64, 11, 139, 0.2)'
            }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 'bold', 
                color: '#400B8B',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                textAlign: 'center'
              }}>
                🎉 You've explored 3 of 200+ NYC neighborhoods (1.5%)
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Neighborhood Cards */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
            {sampleNeighborhoods.map((neighborhood, index) => (
              <Card 
                key={index}
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                  border: neighborhood.visited ? `2px solid ${neighborhood.color}` : '1px solid #e2e8f0'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold', 
                      mb: 1,
                      fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}>
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
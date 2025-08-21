import React from 'react';
import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { ArrowForward, TravelExplore, LocationOn } from '@mui/icons-material';

interface CTASectionProps {
  onGetStarted: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onGetStarted }) => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 25%, #475569 50%, #64748b 100%)',
        py: { xs: 6, sm: 8, md: 12 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
          zIndex: 1,
        }
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(254, 245, 4, 0.1)',
          animation: 'float 8s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
            '50%': { transform: 'translateY(-20px) rotate(180deg)' },
          },
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          bottom: '30%',
          right: '15%',
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          animation: 'float 6s ease-in-out infinite 3s',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container alignItems="center" spacing={{ xs: 4, sm: 6, md: 8 }}>
          <Grid item xs={12} md={8}>
            <Box sx={{ color: 'white' }}>
              {/* Icon */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 4,
              }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}>
                  <TravelExplore sx={{ fontSize: 40, color: '#3b82f6', mr: 1 }} />
                  <LocationOn sx={{ fontSize: 32, color: '#eab308' }} />
                </Box>
              </Box>

              {/* Main CTA Text */}
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: { xs: 3, sm: 4 },
                  lineHeight: 1.1,
                  fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
                  letterSpacing: '-0.02em',
                  textAlign: { xs: 'center', md: 'left' }
                }}
              >
                Ready to Start Your{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'block',
                    mt: 1,
                  }}
                >
                  NYC Adventure?
                </Box>
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  mb: { xs: 4, sm: 5, md: 6 },
                  lineHeight: 1.6,
                  maxWidth: { xs: '100%', md: 550 },
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                  fontWeight: 400,
                  textAlign: { xs: 'center', md: 'left' },
                  px: { xs: 1, md: 0 }
                }}
              >
                Join thousands of explorers who are discovering NYC one neighborhood at a time. 
                Your next great adventure is just a click away.
              </Typography>

              {/* Benefits List */}
              <Box sx={{ mb: { xs: 4, sm: 5, md: 6 }, textAlign: { xs: 'left', md: 'left' } }}>
                {[
                  '✨ Track all 200+ NYC neighborhoods',
                  '📱 Works perfectly on mobile while exploring',
                  '⭐ Rate and remember your favorite spots',
                  '📊 See your exploration progress grow',
                  '🗺️ Beautiful interactive maps',
                ].map((benefit, index) => (
                  <Typography
                    key={index}
                    variant="body1"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      justifyContent: { xs: 'center', md: 'flex-start' }
                    }}
                  >
                    {benefit}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
              <Button
                variant="contained"
                size="large"
                onClick={onGetStarted}
                endIcon={<ArrowForward />}
                sx={{
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 4, sm: 6 },
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #FEF504 0%, #FBBF24 100%)',
                  color: '#1E40AF',
                  fontSize: { xs: '1.1rem', sm: '1.3rem' },
                  fontWeight: 'bold',
                  textTransform: 'none',
                  boxShadow: '0 12px 40px rgba(254, 245, 4, 0.3)',
                  width: { xs: '100%', sm: 'auto' },
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FDE047 0%, #F59E0B 100%)',
                    boxShadow: '0 16px 50px rgba(254, 245, 4, 0.4)',
                    transform: 'translateY(-3px)',
                  },
                  transition: 'all 0.3s ease',
                  mb: 3,
                }}
              >
                Start Exploring NYC
              </Button>

              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  mb: { xs: 3, sm: 4 },
                  fontSize: { xs: '0.875rem', sm: '0.875rem' }
                }}
              >
                Free to join • No credit card required
              </Typography>

              {/* Mini testimonial */}
              <Box
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  p: { xs: 2, sm: 3 },
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: { xs: 'none', md: 'block' }
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontStyle: 'italic',
                    mb: 2,
                  }}
                >
                  "This app completely changed how I explore NYC. I've discovered 
                  so many amazing neighborhoods I never would have visited!"
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 'bold',
                  }}
                >
                  - Sarah M., Brooklyn Explorer
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CTASection;
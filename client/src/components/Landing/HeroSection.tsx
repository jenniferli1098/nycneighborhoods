import React from 'react';
import { Box, Typography, Button, Container, useTheme, useMediaQuery } from '@mui/material';
import { TravelExplore, LocationOn, ArrowForward } from '@mui/icons-material';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        minHeight: { xs: '80vh', sm: '90vh', md: '100vh' },
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 25%, #475569 50%, #64748b 100%)',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 4, sm: 6, md: 0 },
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
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(254, 245, 4, 0.1)',
          animation: 'float 6s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' },
          },
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '5%',
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          animation: 'float 4s ease-in-out infinite 2s',
        }}
      />

      <Container maxWidth="lg" sx={{ zIndex: 2, position: 'relative', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 4, md: 8 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: { xs: 3, sm: 4, md: 6 } }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              {/* Logo/Icon */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: { xs: 'center', md: 'flex-start' }, 
                alignItems: 'center', 
                mb: 4 
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

              {/* Main heading */}
              <Typography
                variant={isMobile ? 'h3' : 'h1'}
                sx={{
                  fontWeight: 800,
                  color: '#fff',
                  mb: { xs: 2, sm: 3 },
                  lineHeight: 1.1,
                  fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3.5rem' },
                  letterSpacing: '-0.02em',
                }}
              >
                Discover NYC,{' '}
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
                  One Neighborhood at a Time
                </Box>
              </Typography>

              {/* Subtitle */}
              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  mb: { xs: 4, sm: 5, md: 6 },
                  fontWeight: 400,
                  lineHeight: 1.6,
                  fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
                  maxWidth: { xs: '100%', sm: 450, md: 500 },
                  mx: { xs: 'auto', md: 0 },
                  px: { xs: 1, sm: 0 },
                }}
              >
                Turn the Big Apple into your personal adventure map. Track where you've been, 
                rate your experiences, and never forget a neighborhood again.
              </Typography>

              {/* Stats row */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: { xs: 2, sm: 3 }, 
                mb: { xs: 6, sm: 7, md: 8 },
                maxWidth: { xs: '100%', sm: 400 },
                mx: { xs: 'auto', md: 0 },
                px: { xs: 1, sm: 0 },
              }}>
                <Box sx={{ 
                  textAlign: 'center',
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#3b82f6', mb: 0.5, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                    200+
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    Neighborhoods
                  </Typography>
                </Box>
                <Box sx={{ 
                  textAlign: 'center',
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#8b5cf6', mb: 0.5, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                    5
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    Boroughs
                  </Typography>
                </Box>
                <Box sx={{ 
                  textAlign: 'center',
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#ec4899', mb: 0.5, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                    ∞
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    Adventures
                  </Typography>
                </Box>
              </Box>

              {/* CTA Buttons */}
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 2, sm: 3 }, 
                justifyContent: { xs: 'center', md: 'flex-start' },
                flexDirection: { xs: 'column', sm: 'row' },
                px: { xs: 1, sm: 0 },
              }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={onGetStarted}
                  endIcon={<ArrowForward />}
                  sx={{
                    py: { xs: 1.5, sm: 2 },
                    px: { xs: 4, sm: 6 },
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    color: '#fff',
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    width: { xs: '100%', sm: 'auto' },
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      boxShadow: '0 15px 40px rgba(59, 130, 246, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  Start Your Journey
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    py: { xs: 1.5, sm: 2 },
                    px: { xs: 4, sm: 6 },
                    borderRadius: 4,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    color: '#fff',
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    fontWeight: 600,
                    textTransform: 'none',
                    width: { xs: '100%', sm: 'auto' },
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  See Demo
                </Button>
              </Box>
            </Box>
          </Box>

          <Box sx={{ flex: 1 }}>
            {/* Hero Image/Illustration */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: { xs: 300, md: 500 },
                position: 'relative',
              }}
            >
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection;
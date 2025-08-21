import React from 'react';
import { Box, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/Landing/HeroSection';
import DemoMapPreview from '../components/Landing/DemoMapPreview';
import StatsPreview from '../components/Landing/StatsPreview';
import CTASection from '../components/Landing/CTASection';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#ffffff' }}>
      <HeroSection onGetStarted={handleGetStarted} />

        <Box sx={{ 
       background: 'linear-gradient(135deg, #f8fafc 0%,  #f1f5f9 50%, #e2e8f0 100%)', 
           py: { xs: 6, sm: 8, md: 12 } 
      }}>
         <Container maxWidth="lg">
          <DemoMapPreview />
         </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, sm: 8, md: 12 } }}>
        <StatsPreview />
      </Container>

      <CTASection onGetStarted={handleGetStarted} />
    </Box>
  );
};

export default LandingPage;
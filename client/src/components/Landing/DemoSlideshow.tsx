import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import { Close, ChevronLeft, ChevronRight } from '@mui/icons-material';

interface DemoSlideshowProps {
  open: boolean;
  onClose: () => void;
}

const demoSlides = [
  {
    image: '/demo/01-dashboard.jpg',
    title: 'Your Personal Dashboard',
    description: 'Track your exploration progress across neighborhoods, cities, and countries',
  },
  {
    image: '/demo/02-settings-profile.jpg',
    title: 'Customize Your Profile',
    description: 'Set up your profile and personalize your exploration experience',
  },
  {
    image: '/demo/03-nyc-neighborhoods-map.jpg',
    title: 'Interactive NYC Map',
    description: 'Visualize all NYC neighborhoods with color-coded ratings and statistics',
  },
  {
    image: '/demo/04-add-visit-review.jpg',
    title: 'Log Your Visits',
    description: 'Add notes and reviews for each neighborhood you visit',
  },
  {
    image: '/demo/05-ranking-pairwise-comparison.jpg',
    title: 'Smart Ranking System',
    description: 'Compare neighborhoods pairwise to build accurate rankings',
  },
  {
    image: '/demo/06-ranking-categorize.jpg',
    title: 'Quick Categorization',
    description: 'Quickly categorize places to streamline your ranking process',
  },
  {
    image: '/demo/07-ranking-result.jpg',
    title: 'See Your Rankings',
    description: 'Get precise scores based on your preferences and comparisons',
  },
  {
    image: '/demo/08-world-map.jpg',
    title: 'Expand Worldwide',
    description: 'Track your travels beyond NYC with global exploration features',
  },
];

const DemoSlideshow: React.FC<DemoSlideshowProps> = ({ open, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % demoSlides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + demoSlides.length) % demoSlides.length);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      handleNext();
    } else if (event.key === 'ArrowLeft') {
      handlePrev();
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  const currentSlideData = demoSlides[currentSlide];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      onKeyDown={handleKeyDown}
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
          borderRadius: isMobile ? 0 : 3,
        },
      }}
    >
      {/* Close button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: '#fff',
          bgcolor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 10,
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <Close />
      </IconButton>

      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: isMobile ? '100vh' : 600,
          position: 'relative',
        }}
      >
        {/* Navigation buttons */}
        <IconButton
          onClick={handlePrev}
          sx={{
            position: 'absolute',
            left: { xs: 8, sm: 16 },
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#fff',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10,
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
        >
          <ChevronLeft sx={{ fontSize: 40 }} />
        </IconButton>

        <IconButton
          onClick={handleNext}
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 16 },
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#fff',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10,
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
        >
          <ChevronRight sx={{ fontSize: 40 }} />
        </IconButton>

        {/* Slide content */}
        <Fade in key={currentSlide} timeout={500}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              px: { xs: 2, sm: 4, md: 8 },
              py: { xs: 8, sm: 4 },
            }}
          >
            {/* Image */}
            <Box
              sx={{
                width: '100%',
                maxWidth: 900,
                mb: 3,
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              <img
                src={currentSlideData.image}
                alt={currentSlideData.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </Box>

            {/* Title and description */}
            <Box sx={{ textAlign: 'center', maxWidth: 600 }}>
              <Typography
                variant="h4"
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                  mb: 1,
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                }}
              >
                {currentSlideData.title}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: { xs: '0.95rem', sm: '1.1rem' },
                }}
              >
                {currentSlideData.description}
              </Typography>
            </Box>

            {/* Slide indicators */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mt: 4,
              }}
            >
              {demoSlides.map((_, index) => (
                <Box
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor:
                      index === currentSlide
                        ? '#3b82f6'
                        : 'rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      bgcolor:
                        index === currentSlide
                          ? '#3b82f6'
                          : 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                />
              ))}
            </Box>

            {/* Counter */}
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                mt: 2,
              }}
            >
              {currentSlide + 1} / {demoSlides.length}
            </Typography>
          </Box>
        </Fade>
      </DialogContent>
    </Dialog>
  );
};

export default DemoSlideshow;

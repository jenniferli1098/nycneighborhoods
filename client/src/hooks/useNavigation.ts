import { useState } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

export const useNavigation = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileNeighborhoodsOpen, setMobileNeighborhoodsOpen] = useState(false);

  const openMobileDrawer = () => setMobileDrawerOpen(true);
  const closeMobileDrawer = () => setMobileDrawerOpen(false);
  const toggleNeighborhoods = () => setMobileNeighborhoodsOpen(!mobileNeighborhoodsOpen);

  return {
    isMobile,
    mobileDrawerOpen,
    mobileNeighborhoodsOpen,
    openMobileDrawer,
    closeMobileDrawer,
    toggleNeighborhoods
  };
};
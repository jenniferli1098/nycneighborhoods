import React, { useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useUserStats } from '../hooks/useUserStats';
import { useMapData } from '../hooks/useMapData';
import UserDashboardHeader from '../components/Dashboard/UserDashboardHeader';
import StatsOverview from '../components/Dashboard/StatsOverview';
import MapStatsGrid from '../components/Dashboard/MapStatsGrid';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats, allVisits, countries, loading: statsLoading, error, loadUserStats, formatVisitName } = useUserStats();
  const { mapAreas, loading: mapLoading, loadAllMapData } = useMapData();
  
  const loading = statsLoading || mapLoading;

  useEffect(() => {
    if (user) {
      loadUserStats();
      loadAllMapData();
    }
  }, [user, loadUserStats, loadAllMapData]);

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-full">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="flex justify-center items-center h-full">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box className="flex justify-center items-center h-full">
        <Alert severity="info">No data available</Alert>
      </Box>
    );
  }

  return (
    <Box 
      className="h-full overflow-auto bg-gray-50" 
      sx={{ 
        width: '100vw', 
        maxWidth: 'none', 
        padding: '32px',
        margin: 0,
        boxSizing: 'border-box'
      }}
    >
      <UserDashboardHeader />
      <StatsOverview stats={stats} />
      <MapStatsGrid 
        stats={stats}
        allVisits={allVisits}
        countries={countries}
        mapAreas={mapAreas}
        formatVisitName={formatVisitName}
      />
    </Box>
  );
};

export default UserDashboard;
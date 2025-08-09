import React from 'react';
import { Box, Typography, Chip, useTheme } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const UserDashboardHeader: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();

  return (
    <Box sx={{ 
      textAlign: 'center', 
      mb: 6,
      background: theme.gradients.headerWelcome,
      borderRadius: 4,
      p: 4,
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background element */}
      <Box
        sx={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%'
        }}
      />
      
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, position: 'relative' }}>
        Welcome back, {user?.firstName && user?.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user?.username || 'User'}!
      </Typography>
      
      {user?.email && (
        <Chip 
          label={user.email}
          size="medium"
          sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontWeight: 500,
            position: 'relative'
          }}
        />
      )}
      
      <Typography variant="body1" sx={{ mt: 2, opacity: 0.9, position: 'relative' }}>
        Your exploration journey continues...
      </Typography>
    </Box>
  );
};

export default UserDashboardHeader;
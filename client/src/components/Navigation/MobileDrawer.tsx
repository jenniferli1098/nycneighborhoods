import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Collapse
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  neighborhoodsOpen: boolean;
  onToggleNeighborhoods: () => void;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  neighborhoodsOpen,
  onToggleNeighborhoods
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { settings, availableMaps } = useSettings();

  const handleNavSelect = (route: string) => {
    navigate(route);
    onClose();
  };

  const neighborhoodMaps = availableMaps.filter(map => 
    map.category === 'neighborhood' && settings.visibleMaps.includes(map.id)
  );
  const otherMaps = availableMaps.filter(map => 
    map.category === 'other' && settings.visibleMaps.includes(map.id)
  );

  const isNeighborhoodRoute = neighborhoodMaps.some(map => map.route === location.pathname);

  const getNavItemStyles = (isActive: boolean) => ({
    borderRadius: 2,
    mb: 1,
    backgroundColor: isActive ? '#E0E7FF' : 'transparent',
    '&:hover': { backgroundColor: '#F1F5F9' }
  });

  const getTextStyles = (isActive: boolean) => ({
    fontWeight: isActive ? 'bold' : 'normal'
  });

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          backgroundColor: '#f8fafc',
          paddingTop: 2
        }
      }}
    >
      <Box sx={{ padding: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1E40AF', mb: 3 }}>
          Travel Bucket List
        </Typography>
        <List>
          {/* Dashboard */}
          <ListItem sx={{ p: 0 }}>
            <ListItemButton
              onClick={() => handleNavSelect('/')}
              sx={getNavItemStyles(location.pathname === '/')}
            >
              <ListItemText 
                primary="Dashboard" 
                primaryTypographyProps={getTextStyles(location.pathname === '/')}
              />
            </ListItemButton>
          </ListItem>
          
          {/* Neighborhoods Section */}
          {neighborhoodMaps.length > 0 && (
            <>
              <ListItem sx={{ p: 0 }}>
                <ListItemButton
                  onClick={onToggleNeighborhoods}
                  sx={getNavItemStyles(isNeighborhoodRoute)}
                >
                  <ListItemText 
                    primary="Neighborhoods" 
                    primaryTypographyProps={getTextStyles(isNeighborhoodRoute)}
                  />
                  {neighborhoodsOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={neighborhoodsOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {neighborhoodMaps.map(map => (
                    <ListItem key={map.id} sx={{ p: 0 }}>
                      <ListItemButton
                        onClick={() => handleNavSelect(map.route)}
                        sx={{ 
                          pl: 4, 
                          borderRadius: 2, 
                          mb: 0.5,
                          backgroundColor: location.pathname === map.route ? '#DDD6FE' : 'transparent',
                          '&:hover': { backgroundColor: '#F1F5F9' }
                        }}
                      >
                        <ListItemText 
                          primary={map.name} 
                          primaryTypographyProps={{ 
                            fontSize: '0.9rem',
                            fontWeight: location.pathname === map.route ? 'bold' : 'normal'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </>
          )}
          
          {/* Other Maps */}
          {otherMaps.map(map => (
            <ListItem key={map.id} sx={{ p: 0 }}>
              <ListItemButton
                onClick={() => handleNavSelect(map.route)}
                sx={getNavItemStyles(location.pathname === map.route)}
              >
                <ListItemText 
                  primary={map.name} 
                  primaryTypographyProps={getTextStyles(location.pathname === map.route)}
                />
              </ListItemButton>
            </ListItem>
          ))}
          
          {/* Settings */}
          <ListItem sx={{ p: 0 }}>
            <ListItemButton
              onClick={() => handleNavSelect('/settings')}
              sx={getNavItemStyles(location.pathname === '/settings')}
            >
              <ListItemText 
                primary="Settings" 
                primaryTypographyProps={getTextStyles(location.pathname === '/settings')}
              />
            </ListItemButton>
          </ListItem>
        </List>
        
        {/* User Section */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #E2E8F0' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Welcome, {user?.username}!
          </Typography>
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={() => {
              logout();
              onClose();
            }}
            sx={{ 
              borderColor: '#EF4444',
              color: '#EF4444',
              '&:hover': {
                backgroundColor: '#FEF2F2',
                borderColor: '#DC2626'
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default MobileDrawer;
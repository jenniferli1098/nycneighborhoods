import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Tabs,
  Tab,
  Menu,
  MenuItem
} from '@mui/material';
import { useSettings } from '../../contexts/SettingsContext';

const DesktopTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, availableMaps } = useSettings();
  const [neighborhoodMenuAnchor, setNeighborhoodMenuAnchor] = useState<null | HTMLElement>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'neighborhoods-menu') {
      return; // Don't navigate for the dropdown trigger
    }
    navigate(newValue);
  };

  const handleNeighborhoodMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setNeighborhoodMenuAnchor(event.currentTarget);
  };

  const handleNeighborhoodMenuClose = () => {
    setNeighborhoodMenuAnchor(null);
  };

  const handleNeighborhoodSelect = (route: string) => {
    navigate(route);
    handleNeighborhoodMenuClose();
  };

  const neighborhoodMaps = availableMaps.filter(map => 
    map.category === 'neighborhood' && settings.visibleMaps.includes(map.id)
  );
  const otherMaps = availableMaps.filter(map => 
    map.category === 'other' && settings.visibleMaps.includes(map.id)
  );

  const isNeighborhoodRoute = neighborhoodMaps.some(map => map.route === location.pathname);
  const currentNeighborhoodValue = isNeighborhoodRoute ? 'neighborhoods-menu' : location.pathname;

  return (
    <>
      <Tabs 
        value={currentNeighborhoodValue} 
        onChange={handleTabChange}
        sx={{ 
          mr: 3,
          '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
          '& .Mui-selected': { color: 'white !important' },
          '& .MuiTabs-indicator': { backgroundColor: 'white' }
        }}
      >
        <Tab label="Dashboard" value="/dashboard" />
        
        {/* Neighborhoods Dropdown */}
        {neighborhoodMaps.length > 0 && (
          <Tab 
            label="Neighborhoods ▼" 
            value="neighborhoods-menu"
            onClick={handleNeighborhoodMenuClick}
          />
        )}
        
        {/* Other Maps */}
        {otherMaps.map(map => (
          <Tab key={map.id} label={map.name} value={map.route} />
        ))}
        
        <Tab label="Settings" value="/settings" />
      </Tabs>

      {/* Neighborhoods Dropdown Menu */}
      <Menu
        anchorEl={neighborhoodMenuAnchor}
        open={Boolean(neighborhoodMenuAnchor)}
        onClose={handleNeighborhoodMenuClose}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: 'white',
            boxShadow: 3
          }
        }}
      >
        {neighborhoodMaps.map(map => (
          <MenuItem 
            key={map.id} 
            onClick={() => handleNeighborhoodSelect(map.route)}
            selected={location.pathname === map.route}
          >
            {map.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default DesktopTabs;
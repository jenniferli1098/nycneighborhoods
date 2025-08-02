import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { useTheme, useMediaQuery, Fab, Box } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, MyLocation as MyLocationIcon } from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTouchInteractions, getDeviceType } from '../utils/deviceDetection';
import { getNeighborhoodColor } from '../utils/colorPalette';

interface Neighborhood {
  type: string;
  properties: {
    [key: string]: any; // Generic properties to handle different GeoJSON formats
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

interface MapConfig {
  center: [number, number];
  zoom: number;
  categoryType: string;
}

interface GenericMapProps {
  neighborhoods: Neighborhood[];
  visitedNeighborhoods: Set<string>;
  onNeighborhoodClick: (neighborhood: string, category: string) => void;
  onNeighborhoodQuickVisit?: (neighborhood: string, category: string) => void;
  mapConfig: MapConfig;
  isAuthenticated?: boolean;
}

const GenericMap: React.FC<GenericMapProps> = ({ 
  neighborhoods, 
  visitedNeighborhoods, 
  onNeighborhoodClick, 
  onNeighborhoodQuickVisit,
  mapConfig,
  isAuthenticated = false
}) => {
  
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [geoJsonKey, setGeoJsonKey] = useState(0);

  useEffect(() => {
    if (neighborhoods.length > 0) {
      console.log('🗺️ GenericMap: Setting GeoJSON data with', neighborhoods.length, 'neighborhoods');
      setGeoJsonData({
        type: 'FeatureCollection',
        features: neighborhoods
      });
    } else {
      console.log('🗺️ GenericMap: No neighborhoods data available');
    }
  }, [neighborhoods]);

  useEffect(() => {
    console.log('🎨 GenericMap: Visited neighborhoods changed, triggering map update:', visitedNeighborhoods.size);
    // Force GeoJSON component to re-render by changing its key
    setGeoJsonKey(prev => prev + 1);
  }, [visitedNeighborhoods]);

  const getColor = (feature: any): string => {
    const neighborhoodName = feature.properties.neighborhood;
    const categoryName = feature.properties[mapConfig.categoryType];
    const isVisited = visitedNeighborhoods.has(neighborhoodName);
        
    return getNeighborhoodColor(categoryName, isVisited);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const useTouchInteraction = useTouchInteractions();
  const [map, setMap] = useState<L.Map | null>(null);

  // Update map view when mapConfig changes (for switching between cities)
  useEffect(() => {
    if (map && mapConfig.center && mapConfig.zoom) {
      console.log('🗺️ GenericMap: MapConfig changed, updating map view to:', mapConfig.center, 'zoom:', mapConfig.zoom);
      map.setView(mapConfig.center, mapConfig.zoom);
    }
  }, [map, mapConfig.center, mapConfig.zoom]);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);

  // Log device detection for debugging
  useEffect(() => {
    console.log('🔍 Device Detection:', {
      deviceType: getDeviceType(),
      isMobile: isMobile,
      useTouchInteraction: useTouchInteraction,
      screenWidth: window.innerWidth
    });
  }, [isMobile, useTouchInteraction]);

  const style = (feature: any) => ({
    fillColor: getColor(feature),
    weight: isMobile ? 1.5 : 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: isMobile ? 0.8 : 0.7
  });

  const onEachFeature = (feature: any, layer: any) => {
    const neighborhoodName = feature.properties.neighborhood;
    const categoryName = feature.properties[mapConfig.categoryType];
    const isVisited = visitedNeighborhoods.has(neighborhoodName);
    
    
    // Removed popup to prevent thumbnail on left-click

    
    // Device-specific interaction handling
    const handleInteraction = (e: any, isLongPress = false) => {
      if (useTouchInteraction) {
        // Touch device behavior (phones/tablets)
        if (isLongPress) {
          // Long press on touch device - open detailed dialog
          onNeighborhoodClick(neighborhoodName, categoryName);
        } else {
          // Quick tap on touch device - mark as visited
          if (onNeighborhoodQuickVisit) {
            onNeighborhoodQuickVisit(neighborhoodName, categoryName);
          }
        }
      } else {
        // Desktop/laptop behavior (mouse interactions)
        if (e.originalEvent?.button === 2 || e.type === 'contextmenu') {
          // Right click on desktop - open detailed dialog
          e.originalEvent?.preventDefault();
          onNeighborhoodClick(neighborhoodName, categoryName);
        } else if (onNeighborhoodQuickVisit) {
          // Left click on desktop - mark as visited
          onNeighborhoodQuickVisit(neighborhoodName, categoryName);
        }
      }
    };

    layer.on({
      click: (e: any) => {
        handleInteraction(e);
      },
      contextmenu: (e: any) => {
        handleInteraction(e, true);
      },
      touchstart: (e: any) => {
        if (useTouchInteraction) {
          setTouchStart({
            x: e.originalEvent.touches[0].clientX,
            y: e.originalEvent.touches[0].clientY,
            time: Date.now()
          });
        }
      },
      touchend: (e: any) => {
        if (useTouchInteraction && touchStart) {
          const touchEnd = {
            x: e.originalEvent.changedTouches[0].clientX,
            y: e.originalEvent.changedTouches[0].clientY,
            time: Date.now()
          };
          
          const distance = Math.sqrt(
            Math.pow(touchEnd.x - touchStart.x, 2) + 
            Math.pow(touchEnd.y - touchStart.y, 2)
          );
          const duration = touchEnd.time - touchStart.time;
          
          // Long press detection (500ms+ and minimal movement)
          if (duration > 500 && distance < 10) {
            handleInteraction(e, true);
          } else if (duration < 500 && distance < 10) {
            handleInteraction(e);
          }
          
          setTouchStart(null);
        }
      },
      mouseover: (e: any) => {
        if (!useTouchInteraction) {
          // Only show hover effects on desktop/laptop with mouse
          const layer = e.target;
          layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.9
          });
        }
      },
      mouseout: (e: any) => {
        if (!useTouchInteraction) {
          // Only reset hover effects on desktop/laptop with mouse
          const layer = e.target;
          layer.setStyle(style(feature));
        }
      }
    });

    // Create tooltip with neighborhood name and visit status
    const tooltipContent = `
      <div style="text-align: center; font-size: 12px;">
        <strong>${neighborhoodName}</strong><br/>
        <span style="color: #666;">${categoryName}</span><br/>
        <span style="color: ${isVisited ? '#28a745' : '#dc3545'}; font-weight: bold;">
          ${isVisited ? '✓ Visited' : '✗ Not Visited'}
        </span><br/>
        <small style="color: #888;">
          ${isAuthenticated ? 'Left: Quick visit | Right: Details' : 'Login required to interact'}
        </small>
      </div>
    `;
    
    layer.bindTooltip(tooltipContent, {
      permanent: false,
      direction: 'top', // Position above the feature
      offset: [0, -10], // Move 10 pixels up from the default position
      opacity: 0.9,
      className: 'neighborhood-tooltip'
    });
  };

  if (!geoJsonData) {
    console.log('🗺️ GenericMap: No GeoJSON data, showing loading state');
    return (
      <div className="flex justify-center items-center h-full">
        <div>Loading map...</div>
      </div>
    );
  }


  // Custom zoom controls for mobile
  const handleZoomIn = () => {
    if (map) {
      map.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (map) {
      map.setView(mapConfig.center, mapConfig.zoom);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={mapConfig.center}
        zoom={mapConfig.zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={!isMobile}
        touchZoom={true}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        dragging={true}
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          key={geoJsonKey}
          data={geoJsonData}
          style={style}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
      
      {/* Mobile-optimized floating controls */}
      {isMobile && (
        <Box sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          <Fab
            size="small"
            color="primary"
            onClick={handleZoomIn}
            sx={{ 
              boxShadow: 3,
              backgroundColor: 'white',
              color: '#1976d2',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            <AddIcon />
          </Fab>
          <Fab
            size="small"
            color="primary"
            onClick={handleZoomOut}
            sx={{ 
              boxShadow: 3,
              backgroundColor: 'white',
              color: '#1976d2',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            <RemoveIcon />
          </Fab>
          <Fab
            size="small"
            color="primary"
            onClick={handleRecenter}
            sx={{ 
              boxShadow: 3,
              backgroundColor: 'white',
              color: '#1976d2',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            <MyLocationIcon />
          </Fab>
        </Box>
      )}
      
      {/* Device-specific instruction overlay */}
      {(isMobile || useTouchInteraction) && (
        <Box sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          color: 'white',
          padding: 1,
          borderRadius: 1,
          fontSize: '0.75rem',
          textAlign: 'center',
          zIndex: 1000,
          opacity: 0.8
        }}>
          {useTouchInteraction 
            ? 'Tap to mark visited • Long press for details'
            : 'Left click to mark visited • Right click for details'
          }
        </Box>
      )}
    </Box>
  );
};

export default GenericMap;
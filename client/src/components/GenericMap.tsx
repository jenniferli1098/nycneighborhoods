import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
  getCategoryFromFeature: (feature: any) => string;
  getNeighborhoodFromFeature: (feature: any) => string;
  categoryColors: { [key: string]: string };
  defaultColor?: string;
}

interface GenericMapProps {
  neighborhoods: Neighborhood[];
  visitedNeighborhoods: Set<string>;
  onNeighborhoodClick: (neighborhood: string, category: string) => void;
  onNeighborhoodQuickVisit?: (neighborhood: string, category: string) => void;
  mapConfig: MapConfig;
}

const GenericMap: React.FC<GenericMapProps> = ({ 
  neighborhoods, 
  visitedNeighborhoods, 
  onNeighborhoodClick, 
  onNeighborhoodQuickVisit,
  mapConfig
}) => {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [geoJsonKey, setGeoJsonKey] = useState(0);

  useEffect(() => {
    if (neighborhoods.length > 0) {
      setGeoJsonData({
        type: 'FeatureCollection',
        features: neighborhoods
      });
    }
  }, [neighborhoods]);

  useEffect(() => {
    console.log('🎨 GenericMap: Visited neighborhoods changed, triggering map update:', visitedNeighborhoods.size);
    // Force GeoJSON component to re-render by changing its key
    setGeoJsonKey(prev => prev + 1);
  }, [visitedNeighborhoods]);

  const getCategoryColor = (category: string): string => {
    return mapConfig.categoryColors[category] || mapConfig.defaultColor || '#E8E8E8';
  };

  const getColor = (feature: any): string => {
    const neighborhoodName = mapConfig.getNeighborhoodFromFeature(feature);
    const categoryName = mapConfig.getCategoryFromFeature(feature);
    
    if (visitedNeighborhoods.has(neighborhoodName)) {
      return getCategoryColor(categoryName);
    }
    return mapConfig.defaultColor || '#E8E8E8'; // Light gray for unvisited
  };

  const style = (feature: any) => ({
    fillColor: getColor(feature),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  });

  const onEachFeature = (feature: any, layer: any) => {
    const neighborhoodName = mapConfig.getNeighborhoodFromFeature(feature);
    const categoryName = mapConfig.getCategoryFromFeature(feature);
    const isVisited = visitedNeighborhoods.has(neighborhoodName);
    
    // Removed popup to prevent thumbnail on left-click

    layer.on({
      click: (e: any) => {
        // Left click - mark as visited quickly
        if (e.originalEvent.button === 0 && onNeighborhoodQuickVisit) {
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
          console.log('🖱️ Left click: Quick visit for', neighborhoodName, categoryName);
          onNeighborhoodQuickVisit(neighborhoodName, categoryName);
        }
      },
      contextmenu: (e: any) => {
        // Right click - open detailed dialog
        e.originalEvent.preventDefault(); // Prevent browser context menu
        console.log('🖱️ Right click: Opening dialog for', neighborhoodName, categoryName);
        onNeighborhoodClick(neighborhoodName, categoryName);
      },
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 5,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.9
        });
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle(style(feature));
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
        <small style="color: #888;">Left: Quick visit | Right: Details</small>
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
    return (
      <div className="flex justify-center items-center h-full">
        <div>Loading map...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <MapContainer
        center={mapConfig.center}
        zoom={mapConfig.zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
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
    </div>
  );
};

export default GenericMap;
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Neighborhood {
  type: string;
  properties: {
    neighborhood?: string;
    borough?: string;
    NAME?: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

interface MapProps {
  neighborhoods: Neighborhood[];
  visitedNeighborhoods: Set<string>;
  onNeighborhoodClick: (neighborhood: string, borough: string) => void;
  onNeighborhoodQuickVisit?: (neighborhood: string, borough: string) => void;
  center?: [number, number];
  zoom?: number;
}

const BostonMap: React.FC<MapProps> = ({ 
  neighborhoods, 
  visitedNeighborhoods, 
  onNeighborhoodClick, 
  onNeighborhoodQuickVisit,
  center = [42.3601, -71.0589], // Boston/Cambridge center
  zoom = 12
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
    console.log('🎨 BostonMap: Visited neighborhoods changed, triggering map update:', visitedNeighborhoods.size);
    // Force GeoJSON component to re-render by changing its key
    setGeoJsonKey(prev => prev + 1);
  }, [visitedNeighborhoods]);

  const getCityColor = (city: string) => {
    const cityColors: { [key: string]: string } = {
      'Boston': '#E74C3C',        // Red - Boston neighborhoods
      'Cambridge': '#3498DB',     // Blue - Cambridge neighborhoods
      'Somerville': '#2ECC71',    // Green - Somerville neighborhoods
    };
    return cityColors[city] || '#9B59B6'; // Purple fallback
  };

  const getNeighborhoodName = (feature: any) => {
    // Boston GeoJSON uses 'name' property
    return feature.properties.name || feature.properties.NAME || feature.properties.neighborhood || 'Unknown';
  };

  const getCityName = (feature: any) => {
    // Boston GeoJSON has 'city' property with "Boston" or "Cambridge"
    return feature.properties.city || 'Unknown';
  };

  const getColor = (feature: any) => {
    const neighborhoodName = getNeighborhoodName(feature);
    const cityName = getCityName(feature);
    
    if (visitedNeighborhoods.has(neighborhoodName)) {
      return getCityColor(cityName);
    }
    return '#E8E8E8'; // Light gray for unvisited
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
    const neighborhoodName = getNeighborhoodName(feature);
    const cityName = getCityName(feature);
    const isVisited = visitedNeighborhoods.has(neighborhoodName);
    
    // Removed popup to prevent thumbnail on left-click

    layer.on({
      click: (e: any) => {
        // Left click - mark as visited quickly
        if (e.originalEvent.button === 0 && onNeighborhoodQuickVisit) {
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
          console.log('🖱️ Left click: Quick visit for', neighborhoodName, cityName);
          onNeighborhoodQuickVisit(neighborhoodName, cityName);
        }
      },
      contextmenu: (e: any) => {
        // Right click - open detailed dialog
        e.originalEvent.preventDefault(); // Prevent browser context menu
        console.log('🖱️ Right click: Opening dialog for', neighborhoodName, cityName);
        onNeighborhoodClick(neighborhoodName, cityName);
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
  };

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {geoJsonData && (
          <GeoJSON
            key={geoJsonKey}
            data={geoJsonData}
            style={style}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default BostonMap;
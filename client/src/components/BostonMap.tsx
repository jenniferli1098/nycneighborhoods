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

  const getAreaColor = (area: string) => {
    const areaColors: { [key: string]: string } = {
      // Boston neighborhoods
      'Boston': '#FF6B6B',        // Red
      'Cambridge': '#4ECDC4',     // Teal
      'Somerville': '#45B7D1',    // Blue
      'Brookline': '#96CEB4',     // Green
      'Newton': '#FECA57',        // Yellow
      'Watertown': '#9B59B6',     // Purple
      'Belmont': '#F38BA8',       // Pink
      'Arlington': '#A8E6CF'      // Light green
    };
    return areaColors[area] || '#E74C3C'; // Red fallback
  };

  const getNeighborhoodName = (feature: any) => {
    // Boston GeoJSON uses 'NAME' property
    return feature.properties.NAME || feature.properties.neighborhood || 'Unknown';
  };

  const getBoroughName = (feature: any) => {
    // For Boston data, we'll use the city name or a default
    return feature.properties.borough || 'Boston Area';
  };

  const getColor = (feature: any) => {
    const neighborhoodName = getNeighborhoodName(feature);
    const boroughName = getBoroughName(feature);
    
    if (visitedNeighborhoods.has(neighborhoodName)) {
      return getAreaColor(boroughName);
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
    const boroughName = getBoroughName(feature);
    const isVisited = visitedNeighborhoods.has(neighborhoodName);
    
    layer.bindPopup(`
      <div>
        <h3>${neighborhoodName}</h3>
        <p><strong>Area:</strong> ${boroughName}</p>
        <p><strong>Status:</strong> ${isVisited ? 'Visited' : 'Not visited'}</p>
      </div>
    `);

    layer.on({
      click: (e: any) => {
        // Left click - mark as visited quickly
        if (e.originalEvent.button === 0 && onNeighborhoodQuickVisit) {
          console.log('🖱️ Left click: Quick visit for', neighborhoodName, boroughName);
          onNeighborhoodQuickVisit(neighborhoodName, boroughName);
        }
      },
      contextmenu: (e: any) => {
        // Right click - open detailed dialog
        e.originalEvent.preventDefault(); // Prevent browser context menu
        console.log('🖱️ Right click: Opening dialog for', neighborhoodName, boroughName);
        onNeighborhoodClick(neighborhoodName, boroughName);
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
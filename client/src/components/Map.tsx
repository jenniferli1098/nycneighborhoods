import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Neighborhood {
  type: string;
  properties: {
    neighborhood: string;
    borough: string;
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
}

const NYCMap: React.FC<MapProps> = ({ neighborhoods, visitedNeighborhoods, onNeighborhoodClick }) => {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);

  useEffect(() => {
    if (neighborhoods.length > 0) {
      setGeoJsonData({
        type: 'FeatureCollection',
        features: neighborhoods
      });
    }
  }, [neighborhoods]);

  const getColor = (neighborhood: string) => {
    return visitedNeighborhoods.has(neighborhood) ? '#4CAF50' : '#2196F3';
  };

  const style = (feature: any) => ({
    fillColor: getColor(feature.properties.neighborhood),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  });

  const onEachFeature = (feature: any, layer: any) => {
    const { neighborhood, borough } = feature.properties;
    const isVisited = visitedNeighborhoods.has(neighborhood);
    
    layer.bindPopup(`
      <div>
        <h3>${neighborhood}</h3>
        <p><strong>Borough:</strong> ${borough}</p>
        <p><strong>Status:</strong> ${isVisited ? 'Visited' : 'Not visited'}</p>
      </div>
    `);

    layer.on({
      click: () => {
        onNeighborhoodClick(neighborhood, borough);
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
        center={[ 40.8, -73.9]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {geoJsonData && (
          <GeoJSON
            data={geoJsonData}
            style={style}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default NYCMap;
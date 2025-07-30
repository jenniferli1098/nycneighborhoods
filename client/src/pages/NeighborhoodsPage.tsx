import React from 'react';
import { useParams } from 'react-router-dom';
import GenericNeighborhoodsPage from './GenericNeighborhoodsPage';
import { getMapConfig } from '../config/mapConfigs';

const NeighborhoodsPage: React.FC = () => {
  const { mapName } = useParams<{ mapName: string }>();
  
  // Map URL parameters to config names
  const mapConfigName = mapName === 'boston' ? 'Boston Greater Area' : 'New York';
  const mapConfig = getMapConfig(mapConfigName);
  
  return <GenericNeighborhoodsPage mapConfig={mapConfig} />;
};

export default NeighborhoodsPage;
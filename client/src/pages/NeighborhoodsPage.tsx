import React from 'react';
import GenericNeighborhoodsPage from './GenericNeighborhoodsPage';
import { getMapConfig } from '../config/mapConfigs';

const NeighborhoodsPage: React.FC = () => {
  const mapConfig = getMapConfig('New York');
  
  return <GenericNeighborhoodsPage mapConfig={mapConfig} />;
};

export default NeighborhoodsPage;
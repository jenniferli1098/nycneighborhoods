import React from 'react';
import GenericNeighborhoodsPage from './GenericNeighborhoodsPage';
import { getMapConfig } from '../config/mapConfigs';

const BostonNeighborhoodsPage: React.FC = () => {
  const mapConfig = getMapConfig('Boston Greater Area');
  
  return <GenericNeighborhoodsPage mapConfig={mapConfig} />;
};

export default BostonNeighborhoodsPage;
import { neighborhoodsApi } from '../services/neighborhoodsApi';
import type { MapConfig } from '../pages/GenericNeighborhoodsPage';

export type CategoryType = 'borough' | 'city';

export interface MapConfig {
  name: string;
  geoJsonEndpoint: () => Promise<any>;
  mapComponent: 'NYC' | 'Boston';
  center?: [number, number];
  zoom?: number;
  categoryType: CategoryType; // 'borough' or 'city'
  apiFilters?: {
    city?: string;
  };
  // How to extract category from GeoJSON features
  getCategoryFromFeature: (feature: any) => string;
  // How to extract neighborhood name from GeoJSON features  
  getNeighborhoodFromFeature: (feature: any) => string;
  // Whether neighborhoods exist in database or are GeoJSON-only
  hasDbNeighborhoods: boolean;
}

export const mapConfigs: { [key: string]: MapConfig } = {
  'New York': {
    name: 'New York',
    geoJsonEndpoint: neighborhoodsApi.getGeoJsonNeighborhoods,
    mapComponent: 'NYC',
    center: [40.8, -73.9],
    zoom: 11,
    categoryType: 'borough',
    getCategoryFromFeature: (feature) => feature.properties.borough,
    getNeighborhoodFromFeature: (feature) => feature.properties.neighborhood,
    hasDbNeighborhoods: true, // NYC neighborhoods exist in database
  },
  'Boston Greater Area': {
    name: 'Boston Greater Area',
    geoJsonEndpoint: neighborhoodsApi.getBostonGeoJsonNeighborhoods,
    mapComponent: 'Boston',
    center: [42.3601, -71.0589],
    zoom: 12,
    categoryType: 'city',
    apiFilters: {
      city: 'Boston' // This could be expanded to include multiple cities
    },
    getCategoryFromFeature: (feature) => feature.properties.city,
    getNeighborhoodFromFeature: (feature) => feature.properties.name,
    hasDbNeighborhoods: false, // Boston neighborhoods are GeoJSON-only for now
  }
};

export const getMapConfig = (mapName: string): MapConfig => {
  const config = mapConfigs[mapName];
  if (!config) {
    throw new Error(`Map configuration not found for: ${mapName}`);
  }
  return config;
};
import { neighborhoodsApi } from '../services/neighborhoodsApi';

export type CategoryType = 'borough' | 'city';

export interface MapConfig {
  name: string;
  geoJsonEndpoint: () => Promise<any>;
  mapComponent: 'NYC' | 'Boston';
  center: [number, number];
  zoom: number;
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
  // Map visualization config
  categoryColors: { [key: string]: string };
  defaultColor?: string;
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
    categoryColors: {
      'Manhattan': '#FF6B6B',      // Red
      'Brooklyn': '#4ECDC4',       // Teal
      'Queens': '#45B7D1',         // Blue
      'The Bronx': '#96CEB4',      // Green
      'Bronx': '#96CEB4',          // Green (alternative name)
      'Staten Island': '#FECA57'   // Yellow
    },
    defaultColor: '#E8E8E8'
  },
  'Boston Greater Area': {
    name: 'Boston Greater Area',
    geoJsonEndpoint: neighborhoodsApi.getBostonGeoJsonNeighborhoods,
    mapComponent: 'Boston',
    center: [42.3601, -71.0589],
    zoom: 12,
    categoryType: 'city',
    // No apiFilters - load all neighborhoods for Greater Boston Area
    getCategoryFromFeature: (feature) => feature.properties.city,
    getNeighborhoodFromFeature: (feature) => feature.properties.neighborhood,
    hasDbNeighborhoods: true, // Boston neighborhoods exist in database
    categoryColors: {
      'Boston': '#FF6B6B',         // Red
      'Cambridge': '#4ECDC4',      // Teal
      'Somerville': '#45B7D1'      // Blue
    },
    defaultColor: '#E8E8E8'
  }
};

export const getMapConfig = (mapName: string): MapConfig => {
  const config = mapConfigs[mapName];
  if (!config) {
    throw new Error(`Map configuration not found for: ${mapName}`);
  }
  return config;
};
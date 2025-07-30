import { neighborhoodsApi } from '../services/neighborhoodsApi';

export type CategoryType = 'borough' | 'city';

export interface MapConfig {
  name: string;
  slug: string;
  mapComponent: 'NYC' | 'Boston';
  center: [number, number];
  zoom: number;
  categoryType: CategoryType; // 'borough' or 'city'
  apiFilters?: {
    city?: string;
  };
  // Map visualization config
  categoryColors: { [key: string]: string };
  defaultColor?: string;
}

// Standard neighborhood extractor function (same for all maps)
export const getNeighborhoodFromFeature = (feature: any) => feature.properties.neighborhood;

export const mapConfigs: { [key: string]: MapConfig } = {
  'New York': {
    name: 'New York',
    slug: 'nyc',
    mapComponent: 'NYC',
    center: [40.8, -73.9],
    zoom: 11,
    categoryType: 'borough',
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
    slug: 'boston',
    mapComponent: 'Boston',
    center: [42.3601, -71.0589],
    zoom: 12,
    categoryType: 'city',
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
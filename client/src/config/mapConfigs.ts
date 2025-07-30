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
    categoryType: 'borough'
  },
  'Boston Greater Area': {
    name: 'Boston Greater Area',
    slug: 'boston',
    mapComponent: 'Boston',
    center: [42.3601, -71.0589],
    zoom: 12,
    categoryType: 'city'
  }
};

export const getMapConfig = (mapName: string): MapConfig => {
  const config = mapConfigs[mapName];
  if (!config) {
    throw new Error(`Map configuration not found for: ${mapName}`);
  }
  return config;
};
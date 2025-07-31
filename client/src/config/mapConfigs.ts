export type CategoryType = 'borough' | 'city';

export interface MapConfig {
  name: string;
  slug: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  zoom: number;
  categoryType: CategoryType; // 'borough' or 'city'
}

// Standard neighborhood extractor function (same for all maps)
export const getNeighborhoodFromFeature = (feature: any) => feature.properties.neighborhood;

export const mapConfigs: { [key: string]: MapConfig } = {
  'New York': {
    name: 'New York',
    slug: 'nyc',
    coordinates: {
      latitude: 40.8,
      longitude: -73.9
    },
    zoom: 11,
    categoryType: 'borough'
  },
  'Boston Greater Area': {
    name: 'Boston Greater Area',
    slug: 'boston',
    coordinates: {
      latitude: 42.3601,
      longitude: -71.0589
    },
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
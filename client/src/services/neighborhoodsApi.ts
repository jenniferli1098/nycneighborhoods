import api from '../config/api';

export interface Neighborhood {
  _id: string;
  name: string;
  boroughId?: string;
  cityId?: string;
  categoryType: 'borough' | 'city';
  description?: string;
  averageVisitRating?: number;
  totalVisits?: number;
  // Populated fields when using populate()
  borough?: {
    _id: string;
    name: string;
  };
  city?: {
    _id: string;
    name: string;
    state?: string;
  };
}

export const neighborhoodsApi = {
  // Get all neighborhoods
  getAllNeighborhoods: async (params?: {
    borough?: string;
    city?: string;
    categoryType?: 'borough' | 'city';
  }): Promise<Neighborhood[]> => {
    const response = await api.get('/api/neighborhoods', { params });
    return response.data;
  },

  // Get neighborhood by ID
  getNeighborhoodById: async (id: string): Promise<Neighborhood> => {
    const response = await api.get(`/api/neighborhoods/${id}`);
    return response.data;
  },

  // Get neighborhoods by city
  getNeighborhoodsByCity: async (cityName: string): Promise<Neighborhood[]> => {
    const response = await api.get(`/api/neighborhoods/city/${cityName}`);
    return response.data;
  },

  // Search neighborhoods
  searchNeighborhoods: async (query: string, params?: {
    city?: string;
    categoryType?: 'borough' | 'city';
  }): Promise<Neighborhood[]> => {
    const response = await api.get(`/api/neighborhoods/search/${query}`, { params });
    return response.data;
  },

  // Get GeoJSON neighborhoods for map
  getGeoJsonNeighborhoods: async () => {
    const response = await api.get('/api/maps/geojson/nyc');
    return response.data;
  },

  // Get Boston/Cambridge GeoJSON neighborhoods for map
  getBostonGeoJsonNeighborhoods: async () => {
    const response = await api.get('/api/maps/geojson/boston');
    return response.data;
  }
};
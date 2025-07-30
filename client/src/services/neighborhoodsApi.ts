import api from '../config/api';

export interface Neighborhood {
  _id: string;
  name: string;
  boroughId?: string;
  cityId?: string;
  categoryType: 'borough' | 'city';
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
  getGeoJsonNeighborhoods: async (slug: string) => {
    const response = await api.get(`/api/maps/geojson/${slug}`);
    return response.data;
  },
};
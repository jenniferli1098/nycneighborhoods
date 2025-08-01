import api from '../config/api';

export interface Neighborhood {
  _id: string;
  name: string;
  district: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields when using populate()
  districtData?: {
    _id: string;
    name: string;
    type: 'borough' | 'city';
    map?: string;
  };
}

export const neighborhoodsApi = {
  // Get all neighborhoods
  getAllNeighborhoods: async (params?: {
    district?: string;
  }): Promise<Neighborhood[]> => {
    const response = await api.get('/api/neighborhoods', { params });
    return response.data;
  },

  // Get neighborhood by ID
  getNeighborhoodById: async (id: string): Promise<Neighborhood> => {
    const response = await api.get(`/api/neighborhoods/${id}`);
    return response.data;
  },

  // Get neighborhoods by district
  getNeighborhoodsByDistrict: async (districtId: string): Promise<Neighborhood[]> => {
    const response = await api.get(`/api/neighborhoods/district/${districtId}`);
    return response.data;
  },

  // Search neighborhoods
  searchNeighborhoods: async (query: string, params?: {
    district?: string;
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
import api from '../config/api';

export interface District {
  _id: string;
  name: string;
  map?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields when using populate()
  mapData?: {
    _id: string;
    name: string;
    slug: string;
    type: 'borough' | 'city';
  };
}

export interface DistrictStats {
  totalNeighborhoods: number;
  totalVisits: number;
  uniqueVisitors: number;
  averageRating: number | null;
  visitedNeighborhoods: number;
  visitedPercentage: number;
}

export const districtsApi = {
  // Get all districts
  getAllDistricts: async (): Promise<District[]> => {
    const response = await api.get('/api/districts');
    return response.data;
  },

  // Get district by ID
  getDistrictById: async (id: string): Promise<District> => {
    const response = await api.get(`/api/districts/${id}`);
    return response.data;
  },

  // Get districts by map
  getDistrictsByMap: async (mapId: string): Promise<District[]> => {
    const response = await api.get(`/api/districts/map/${mapId}`);
    return response.data;
  },

  // Get district neighborhoods
  getDistrictNeighborhoods: async (id: string): Promise<any[]> => {
    const response = await api.get(`/api/districts/${id}/neighborhoods`);
    return response.data;
  },

  // Get district statistics
  getDistrictStats: async (id: string): Promise<DistrictStats> => {
    const response = await api.get(`/api/districts/${id}/stats`);
    return response.data;
  }
};
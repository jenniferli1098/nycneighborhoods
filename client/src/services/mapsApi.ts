import api from '../config/api';
import { type Neighborhood } from './neighborhoodsApi';
import { type District } from './districtsApi';

export interface Map {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  type: 'borough' | 'city';
  coordinates: {
    longitude: number;
    latitude: number;
  };
  zoom?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MapStats {
  totalNeighborhoods: number;
  totalVisits: number;
  uniqueVisitors: number;
  averageRating: number | null;
  visitedNeighborhoods: number;
  visitedPercentage: number;
}

export const mapsApi = {
  // Get all active maps
  getAllMaps: async (): Promise<Map[]> => {
    const response = await api.get('/api/maps');
    return response.data;
  },

  // Get a specific map by ID
  getMapById: async (id: string): Promise<Map> => {
    const response = await api.get(`/api/maps/${id}`);
    return response.data;
  },

  // Get a specific map by slug
  getMapBySlug: async (slug: string): Promise<Map> => {
    const response = await api.get(`/api/maps/slug/${slug}`);
    return response.data;
  },

  // Get neighborhoods for a specific map
  getMapNeighborhoods: async (id: string): Promise<Neighborhood[]> => {
    const response = await api.get(`/api/maps/${id}/neighborhoods`);
    return response.data;
  },

  // Get districts for a specific map
  getMapDistricts: async (id: string): Promise<District[]> => {
    const response = await api.get(`/api/maps/${id}/districts`);
    return response.data;
  },

  // Get statistics for a specific map
  getMapStats: async (id: string): Promise<MapStats> => {
    const response = await api.get(`/api/maps/${id}/stats`);
    return response.data;
  },

  // Find maps containing a specific district
  getMapsByDistrict: async (districtId: string): Promise<Map[]> => {
    const response = await api.get(`/api/maps/by-district/${districtId}`);
    return response.data;
  }
};
import api from '../config/api';
import { type Neighborhood } from './neighborhoodsApi';
import { type City } from './citiesApi';
import { type Borough } from './boroughsApi';

export interface Map {
  _id: string;
  name: string;
  description?: string;
  categoryType: 'borough' | 'city';
  cityIds: string[];
  boroughIds: string[];
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

  // Get maps by category type
  getMapsByCategory: async (categoryType: 'borough' | 'city'): Promise<Map[]> => {
    const response = await api.get(`/api/maps/category/${categoryType}`);
    return response.data;
  },

  // Get a specific map by ID
  getMapById: async (id: string): Promise<Map> => {
    const response = await api.get(`/api/maps/${id}`);
    return response.data;
  },

  // Get neighborhoods for a specific map
  getMapNeighborhoods: async (id: string): Promise<Neighborhood[]> => {
    const response = await api.get(`/api/maps/${id}/neighborhoods`);
    return response.data;
  },

  // Get cities for a specific map
  getMapCities: async (id: string): Promise<City[]> => {
    const response = await api.get(`/api/maps/${id}/cities`);
    return response.data;
  },

  // Get boroughs for a specific map
  getMapBoroughs: async (id: string): Promise<Borough[]> => {
    const response = await api.get(`/api/maps/${id}/boroughs`);
    return response.data;
  },

  // Get statistics for a specific map
  getMapStats: async (id: string): Promise<MapStats> => {
    const response = await api.get(`/api/maps/${id}/stats`);
    return response.data;
  },

  // Find maps containing a specific city
  getMapsByCity: async (cityId: string): Promise<Map[]> => {
    const response = await api.get(`/api/maps/by-city/${cityId}`);
    return response.data;
  },

  // Find maps containing a specific borough
  getMapsByBorough: async (boroughId: string): Promise<Map[]> => {
    const response = await api.get(`/api/maps/by-borough/${boroughId}`);
    return response.data;
  }
};
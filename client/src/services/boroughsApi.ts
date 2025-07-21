import api from '../config/api';

export interface Borough {
  _id: string;
  name: string;
  cityId: string;
  description?: string;
  // Populated fields when using populate()
  city?: {
    _id: string;
    name: string;
    state?: string;
  };
}

export const boroughsApi = {
  // Get all boroughs
  getAllBoroughs: async (params?: {
    city?: string;
  }): Promise<Borough[]> => {
    const response = await api.get('/api/boroughs', { params });
    return response.data;
  },

  // Get borough by ID
  getBoroughById: async (id: string): Promise<Borough> => {
    const response = await api.get(`/api/boroughs/${id}`);
    return response.data;
  },

  // Get boroughs by city
  getBoroughsByCity: async (cityName: string): Promise<Borough[]> => {
    const response = await api.get(`/api/boroughs/city/${cityName}`);
    return response.data;
  },

  // Get borough statistics
  getBoroughStats: async (id: string): Promise<any> => {
    const response = await api.get(`/api/boroughs/${id}/stats`);
    return response.data;
  }
};
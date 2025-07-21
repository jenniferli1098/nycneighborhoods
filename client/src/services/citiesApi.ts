import api from '../config/api';

export interface City {
  _id: string;
  name: string;
  state?: string;
  country: string;
  metropolitanArea?: string;
  createdAt: string;
  updatedAt: string;
}

export const citiesApi = {
  // Get all cities
  getAllCities: async (): Promise<City[]> => {
    const response = await api.get('/api/cities');
    return response.data;
  },

  // Get cities by state
  getCitiesByState: async (state: string): Promise<City[]> => {
    const response = await api.get(`/api/cities/state/${state}`);
    return response.data;
  },

  // Get a specific city by ID
  getCityById: async (cityId: string): Promise<City> => {
    const response = await api.get(`/api/cities/${cityId}`);
    return response.data;
  },

  // Create a new city
  createCity: async (cityData: {
    name: string;
    state?: string;
    country?: string;
    metropolitanArea?: string;
  }): Promise<City> => {
    const response = await api.post('/api/cities', cityData);
    return response.data;
  },

  // Update a city
  updateCity: async (cityId: string, cityData: {
    name?: string;
    state?: string;
    country?: string;
    metropolitanArea?: string;
  }): Promise<City> => {
    const response = await api.put(`/api/cities/${cityId}`, cityData);
    return response.data;
  },

  // Delete a city
  deleteCity: async (cityId: string): Promise<void> => {
    await api.delete(`/api/cities/${cityId}`);
  }
};
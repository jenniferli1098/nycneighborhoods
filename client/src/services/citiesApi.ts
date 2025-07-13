import axios from 'axios';

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
    const response = await axios.get('/api/cities');
    return response.data;
  },

  // Get cities by state
  getCitiesByState: async (state: string): Promise<City[]> => {
    const response = await axios.get(`/api/cities/state/${state}`);
    return response.data;
  },

  // Get a specific city by ID
  getCityById: async (cityId: string): Promise<City> => {
    const response = await axios.get(`/api/cities/${cityId}`);
    return response.data;
  },

  // Create a new city
  createCity: async (cityData: {
    name: string;
    state?: string;
    country?: string;
    metropolitanArea?: string;
  }): Promise<City> => {
    const response = await axios.post('/api/cities', cityData);
    return response.data;
  },

  // Update a city
  updateCity: async (cityId: string, cityData: {
    name?: string;
    state?: string;
    country?: string;
    metropolitanArea?: string;
  }): Promise<City> => {
    const response = await axios.put(`/api/cities/${cityId}`, cityData);
    return response.data;
  },

  // Delete a city
  deleteCity: async (cityId: string): Promise<void> => {
    await axios.delete(`/api/cities/${cityId}`);
  }
};
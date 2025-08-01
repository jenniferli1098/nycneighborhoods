import api from '../config/api';

export interface Country {
  _id: string;
  name: string;
  code: string;
  continent: string;
  createdAt: string;
  updatedAt: string;
}

export const countriesApi = {
  // Get all countries, optionally filtered by continent
  getAllCountries: async (continent?: string): Promise<Country[]> => {
    const params = continent ? { continent } : {};
    const response = await api.get('/api/countries', { params });
    return response.data;
  },

  // Search countries by name
  searchCountries: async (query: string): Promise<Country[]> => {
    const response = await api.get(`/api/countries/search/${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get countries by continent
  getCountriesByContinent: async (continent: string): Promise<Country[]> => {
    const response = await api.get(`/api/countries/continent/${encodeURIComponent(continent)}`);
    return response.data;
  },

  // Get list of all continents
  getContinents: async (): Promise<string[]> => {
    const response = await api.get('/api/countries/meta/continents');
    return response.data;
  },

  // Get country by ID
  getCountryById: async (country: string): Promise<Country> => {
    const response = await api.get(`/api/countries/${country}`);
    return response.data;
  },

  // Get GeoJSON countries for map
  getGeoJsonCountries: async () => {
    const response = await api.get('/api/maps/geojson/countries');
    return response.data;
  }
};
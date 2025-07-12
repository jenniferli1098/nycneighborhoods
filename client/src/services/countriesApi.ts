import axios from 'axios';

export interface Country {
  _id: string;
  name: string;
  code: string;
  continent: string;
  description: string;
  averageVisitRating?: number | null;
  totalVisits: number;
  createdAt: string;
  updatedAt: string;
}

export const countriesApi = {
  // Get all countries, optionally filtered by continent
  getAllCountries: async (continent?: string): Promise<Country[]> => {
    const params = continent ? { continent } : {};
    const response = await axios.get('/api/countries', { params });
    return response.data;
  },

  // Search countries by name
  searchCountries: async (query: string): Promise<Country[]> => {
    const response = await axios.get(`/api/countries/search/${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get countries by continent
  getCountriesByContinent: async (continent: string): Promise<Country[]> => {
    const response = await axios.get(`/api/countries/continent/${encodeURIComponent(continent)}`);
    return response.data;
  },

  // Get list of all continents
  getContinents: async (): Promise<string[]> => {
    const response = await axios.get('/api/countries/meta/continents');
    return response.data;
  },

  // Get country by ID
  getCountryById: async (countryId: string): Promise<Country> => {
    const response = await axios.get(`/api/countries/${countryId}`);
    return response.data;
  },

  // Get GeoJSON countries for map
  getGeoJsonCountries: async () => {
    const response = await fetch('/data/countries.geojson');
    return response.json();
  }
};
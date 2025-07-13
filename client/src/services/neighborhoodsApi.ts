import axios from 'axios';

export interface Neighborhood {
  _id: string;
  name: string;
  boroughId: string;
  description?: string;
  averageVisitRating?: number;
  totalVisits?: number;
}

export const neighborhoodsApi = {
  // Get all neighborhoods
  getAllNeighborhoods: async (): Promise<Neighborhood[]> => {
    const response = await axios.get('/api/neighborhoods');
    return response.data;
  },

  // Get GeoJSON neighborhoods for map
  getGeoJsonNeighborhoods: async () => {
    const response = await fetch('/data/nyc_neighborhoods_clean.geojson');
    return response.json();
  },

  // Get Boston/Cambridge GeoJSON neighborhoods for map
  getBostonGeoJsonNeighborhoods: async () => {
    const response = await fetch('/data/boston_cambridge_neighborhoods.geojson');
    return response.json();
  }
};
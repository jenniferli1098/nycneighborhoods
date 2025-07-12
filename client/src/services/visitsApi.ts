import axios from 'axios';

export interface Visit {
  _id: string;
  userId: string;
  visitType: 'neighborhood' | 'country';
  neighborhoodId?: string;
  countryId?: string;
  visited: boolean;
  notes: string;
  visitDate: string;
  rating: number | null;
  category: 'Bad' | 'Mid' | 'Good' | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNeighborhoodVisitData {
  neighborhoodName: string;
  boroughName: string;
  visited: boolean;
  notes?: string;
  visitDate?: Date;
  rating?: number | null;
  category?: 'Bad' | 'Mid' | 'Good' | null;
}

export interface CreateCountryVisitData {
  countryId: string;
  visited: boolean;
  notes?: string;
  visitDate?: Date;
  rating?: number | null;
  category?: 'Bad' | 'Mid' | 'Good' | null;
}

export const visitsApi = {
  // Get all visits for the authenticated user
  getAllVisits: async (): Promise<Visit[]> => {
    const response = await axios.get('/api/visits');
    return response.data;
  },

  // Get visits by type (neighborhood or country)
  getVisitsByType: async (visitType: 'neighborhood' | 'country'): Promise<Visit[]> => {
    const response = await axios.get(`/api/visits/type/${visitType}`);
    return response.data;
  },

  // Create a neighborhood visit
  createNeighborhoodVisit: async (visitData: CreateNeighborhoodVisitData): Promise<Visit> => {
    const response = await axios.post('/api/visits', {
      visitType: 'neighborhood',
      ...visitData
    });
    return response.data;
  },

  // Create a country visit
  createCountryVisit: async (visitData: CreateCountryVisitData): Promise<Visit> => {
    const response = await axios.post('/api/visits', {
      visitType: 'country',
      ...visitData
    });
    return response.data;
  },

  // Update a visit
  updateVisit: async (visitId: string, updateData: Partial<Visit>): Promise<Visit> => {
    const response = await axios.put(`/api/visits/${visitId}`, updateData);
    return response.data;
  },

  // Delete a visit
  deleteVisit: async (visitId: string): Promise<void> => {
    await axios.delete(`/api/visits/${visitId}`);
  }
};
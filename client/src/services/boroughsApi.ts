import axios from 'axios';

export interface Borough {
  _id: string;
  name: string;
  description?: string;
}

export const boroughsApi = {
  // Get all boroughs
  getAllBoroughs: async (): Promise<Borough[]> => {
    const response = await axios.get('/api/boroughs');
    return response.data;
  }
};
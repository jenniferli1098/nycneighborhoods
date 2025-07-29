import api from '../config/api';

export interface PairwiseSessionRequest {
  visitType: 'neighborhood' | 'country';
  neighborhoodName?: string;
  boroughName?: string;
  countryName?: string;
  visited?: boolean;
  notes?: string;
  visitDate?: string;
}

export interface PairwiseComparison {
  sessionId: string;
  newLocation: {
    visitType: string;
    neighborhoodName?: string;
    boroughName?: string;
    countryName?: string;
  };
  compareVisit: {
    _id: string;
    neighborhoodId?: any;
    countryId?: any;
    rating: number;
    category: string;
    notes?: string;
  };
  progress: {
    current: number;
    total: number;
  };
}

export interface PairwiseResult {
  score: number;
  category: 'Good' | 'Mid' | 'Bad';
}

export interface PairwiseSessionResponse {
  isComplete: boolean;
  comparison?: PairwiseComparison;
  result?: PairwiseResult;
  message?: string;
}

export interface PairwiseCompareRequest {
  sessionId: string;
  newLocationBetter: boolean;
}

export interface PairwiseCompareResponse {
  isComplete: boolean;
  comparison?: PairwiseComparison;
  result?: PairwiseResult;
  sessionId?: string;
}

export interface RankingsResponse {
  Good: any[];
  Mid: any[];
  Bad: any[];
}

export interface RebalanceRequest {
  category: 'Good' | 'Mid' | 'Bad';
}

export interface RebalanceResponse {
  message: string;
  affectedCount: number;
}

export interface CreateVisitRequest {
  sessionId: string;
}

export interface SessionDetailsResponse {
  sessionId: string;
  isComplete: boolean;
  newLocationData: any;
  progress: {
    current: number;
    total: number;
  };
  finalResult?: {
    score: number;
    category: string;
  };
}

class PairwiseApi {
  /**
   * Start a new pairwise ranking session
   */
  async startSession(request: PairwiseSessionRequest): Promise<PairwiseSessionResponse> {
    const response = await api.post('/api/pairwise/start', request);
    return response.data;
  }

  /**
   * Submit a comparison result
   */
  async submitComparison(request: PairwiseCompareRequest): Promise<PairwiseCompareResponse> {
    const response = await api.post('/api/pairwise/compare', request);
    return response.data;
  }

  /**
   * Create a visit from completed pairwise ranking
   */
  async createVisit(request: CreateVisitRequest): Promise<any> {
    const response = await api.post('/api/pairwise/create-visit', request);
    return response.data;
  }

  /**
   * Get user's rankings by category and visit type
   */
  async getRankings(visitType?: string, category?: string): Promise<RankingsResponse> {
    const params = new URLSearchParams();
    if (visitType) params.append('visitType', visitType);
    if (category) params.append('category', category);
    
    const response = await api.get(`/api/pairwise/rankings?${params.toString()}`);
    return response.data;
  }

  /**
   * Rebalance scores for a category
   */
  async rebalanceCategory(request: RebalanceRequest): Promise<RebalanceResponse> {
    const response = await api.post('/api/pairwise/rebalance', request);
    return response.data;
  }

  /**
   * Get comparison session details
   */
  async getSessionDetails(sessionId: string): Promise<SessionDetailsResponse> {
    const response = await api.get(`/api/pairwise/session/${sessionId}`);
    return response.data;
  }
}

export const pairwiseApi = new PairwiseApi();
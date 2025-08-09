import { useState, useCallback } from 'react';
import { visitsApi, type Visit } from '../services/visitsApi';
import { countriesApi, type Country } from '../services/countriesApi';

export interface UserStats {
  totalVisits: number;
  totalNeighborhoods: number;
  totalCountries: number;
  averageRating: number | null;
  boroughsVisited: number;
  continentsVisited: number;
  visitsByCategory: {
    Good: number;
    Mid: number;
    Bad: number;
  };
  recentNeighborhoods: Visit[];
  recentCountries: Visit[];
  topRatedNeighborhoods: Visit[];
  topRatedCountries: Visit[];
}

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateUserStats = useCallback((visits: Visit[], countries: Country[]): UserStats => {
    const visitedVisits = visits.filter(v => v.visited);
    const neighborhoodVisits = visitedVisits.filter(v => v.visitType === 'neighborhood');
    const countryVisits = visitedVisits.filter(v => v.visitType === 'country');
    
    // Calculate ratings
    const ratedVisits = visitedVisits.filter(v => v.rating !== null && v.rating !== undefined);
    const averageRating = ratedVisits.length > 0 
      ? ratedVisits.reduce((sum, v) => sum + v.rating!, 0) / ratedVisits.length 
      : null;
    
    // Calculate categories
    const visitsByCategory = {
      Good: visitedVisits.filter(v => v.category === 'Good').length,
      Mid: visitedVisits.filter(v => v.category === 'Mid').length,
      Bad: visitedVisits.filter(v => v.category === 'Bad').length,
    };
    
    // Calculate unique continents
    const visitedCountryIds = countryVisits.map(v => v.country).filter(Boolean);
    const visitedCountries = countries.filter(c => visitedCountryIds.includes(c._id));
    const continentsVisited = new Set(visitedCountries.map(c => c.continent)).size;
    
    // Get recent visits (last 5 each)
    const recentNeighborhoods = [...neighborhoodVisits]
      .sort((a, b) => new Date(b.visitDate || b.updatedAt || '').getTime() - new Date(a.visitDate || a.updatedAt || '').getTime())
      .slice(0, 5);
    
    const recentCountries = [...countryVisits]
      .sort((a, b) => new Date(b.visitDate || b.updatedAt || '').getTime() - new Date(a.visitDate || a.updatedAt || '').getTime())
      .slice(0, 5);
    
    // Get top rated visits (top 5 each)
    const ratedNeighborhoods = ratedVisits.filter(v => v.visitType === 'neighborhood');
    const topRatedNeighborhoods = [...ratedNeighborhoods]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
    
    const ratedCountries = ratedVisits.filter(v => v.visitType === 'country');
    const topRatedCountries = [...ratedCountries]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
    
    return {
      totalVisits: visitedVisits.length,
      totalNeighborhoods: neighborhoodVisits.length,
      totalCountries: countryVisits.length,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      boroughsVisited: 0,
      continentsVisited,
      visitsByCategory,
      recentNeighborhoods,
      recentCountries,
      topRatedNeighborhoods,
      topRatedCountries
    };
  }, []);

  const loadUserStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all visits and countries
      const [neighborhoodVisits, countryVisits, countriesData] = await Promise.all([
        visitsApi.getVisitsByType('neighborhood'),
        visitsApi.getVisitsByType('country'),
        countriesApi.getAllCountries()
      ]);
      
      const visits = [...neighborhoodVisits, ...countryVisits];
      setAllVisits(visits);
      setCountries(countriesData);
      
      // Calculate statistics
      const userStats = calculateUserStats(visits, countriesData);
      setStats(userStats);
      
    } catch (err: unknown) {
      console.error('❌ Error loading stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [calculateUserStats]);

  const formatVisitName = useCallback((visit: Visit, countries: Country[] = []) => {
    if (visit.visitType === 'neighborhood') {
      return `Neighborhood ${visit.neighborhood || 'Unknown'}`;
    } else {
      // Handle both populated and string ID cases for country
      let countryId: string | undefined;
      let countryData: any = null;
      
      if (typeof visit.country === 'string') {
        countryId = visit.country;
        countryData = countries.find(c => c._id === countryId);
      } else if (visit.country && typeof visit.country === 'object') {
        countryData = visit.country;
        countryId = (visit.country as any)?._id;
        
        if (!countryData.name && countryId) {
          countryData = countries.find(c => c._id === countryId);
        }
      }
      
      return countryData?.name ? `${countryData.name}, ${countryData.continent || 'Unknown'}` : 'Unknown Country';
    }
  }, []);

  return {
    stats,
    allVisits,
    countries,
    loading,
    error,
    loadUserStats,
    formatVisitName
  };
};
import React, { createContext, useContext, useEffect, useState } from 'react';
import { neighborhoodCache } from '../services/neighborhoodCache';

interface CacheContextType {
  isPreloaded: boolean;
  preloadError: string | null;
  refreshCache: (city?: string) => Promise<void>;
  getCacheStats: () => any;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

interface CacheProviderProps {
  children: React.ReactNode;
}

export const CacheProvider: React.FC<CacheProviderProps> = ({ children }) => {
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [preloadError, setPreloadError] = useState<string | null>(null);

  useEffect(() => {
    // Preload cache data when app starts
    preloadData();
  }, []);

  const preloadData = async () => {
    try {
      console.log('🚀 CacheProvider: Starting data preload...');
      setPreloadError(null);
      
      // Preload data for common cities
      await neighborhoodCache.preloadData(['NYC', 'Boston']);
      
      setIsPreloaded(true);
      console.log('✅ CacheProvider: Data preload complete');
    } catch (error) {
      console.error('❌ CacheProvider: Preload failed:', error);
      setPreloadError(error instanceof Error ? error.message : 'Unknown error');
      setIsPreloaded(false);
    }
  };

  const refreshCache = async (city?: string) => {
    try {
      console.log(`🔄 CacheProvider: Refreshing cache for ${city || 'all cities'}...`);
      setPreloadError(null);
      
      // Clear existing cache
      neighborhoodCache.clearCache(city);
      
      // Reload data
      if (city) {
        await Promise.all([
          neighborhoodCache.getNeighborhoods(city, true),
          neighborhoodCache.getBoroughs(city, true)
        ]);
      } else {
        await neighborhoodCache.preloadData(['NYC', 'Boston']);
      }
      
      console.log('✅ CacheProvider: Cache refresh complete');
    } catch (error) {
      console.error('❌ CacheProvider: Cache refresh failed:', error);
      setPreloadError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const getCacheStats = () => {
    return neighborhoodCache.getCacheStats();
  };

  const value: CacheContextType = {
    isPreloaded,
    preloadError,
    refreshCache,
    getCacheStats
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = (): CacheContextType => {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};
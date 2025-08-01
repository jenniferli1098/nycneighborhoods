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
      console.log('🚀 CacheProvider: Skipping cache preload (using direct API calls)');
      setPreloadError(null);
      
      // Skip cache preloading since we now load data directly from maps API
      
      setIsPreloaded(true);
      console.log('✅ CacheProvider: Preload complete (no-op)');
    } catch (error) {
      console.error('❌ CacheProvider: Preload failed:', error);
      setPreloadError(error instanceof Error ? error.message : 'Unknown error');
      setIsPreloaded(false);
    }
  };

  const refreshCache = async (city?: string) => {
    try {
      console.log(`🔄 CacheProvider: Skipping cache refresh (using direct API calls)`);
      setPreloadError(null);
      
      // Skip cache operations since we now load data directly from maps API
      
      console.log('✅ CacheProvider: Cache refresh complete (no-op)');
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
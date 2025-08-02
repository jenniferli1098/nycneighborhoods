import React, { createContext, useContext, useEffect, useState } from 'react';
import { referenceDataService } from '../services/referenceDataService';

interface CacheContextType {
  isPreloaded: boolean;
  preloadError: string | null;
  refreshCache: () => Promise<void>;
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
      console.log('🚀 CacheProvider: ReferenceDataService initialized (populated by individual pages)');
      setPreloadError(null);
      
      // No preloading needed - data is populated by pages when they load from APIs
      
      setIsPreloaded(true);
      console.log('✅ CacheProvider: Ready (reference data populated on-demand)');
    } catch (error) {
      console.error('❌ CacheProvider: Initialization failed:', error);
      setPreloadError(error instanceof Error ? error.message : 'Unknown error');
      setIsPreloaded(false);
    }
  };

  const refreshCache = async () => {
    try {
      console.log('🔄 CacheProvider: Clearing reference data');
      setPreloadError(null);
      
      // Clear the reference data - it will be repopulated when pages load fresh data
      referenceDataService.clear();
      
      console.log('✅ CacheProvider: Reference data cleared');
    } catch (error) {
      console.error('❌ CacheProvider: Clear failed:', error);
      setPreloadError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const getCacheStats = () => {
    return referenceDataService.getStats();
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
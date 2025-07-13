import { neighborhoodsApi, type Neighborhood } from './neighborhoodsApi';
import { boroughsApi, type Borough } from './boroughsApi';

interface CachedNeighborhood {
  id: string;
  name: string;
  boroughId: string;
  boroughName: string;
  city: string;
}

interface CachedBorough {
  id: string;
  name: string;
  city: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class NeighborhoodCache {
  private static instance: NeighborhoodCache;
  private neighborhoodCache = new Map<string, CacheEntry<CachedNeighborhood[]>>();
  private boroughCache = new Map<string, CacheEntry<CachedBorough[]>>();
  private neighborhoodIdMap = new Map<string, CachedNeighborhood>();
  private boroughIdMap = new Map<string, CachedBorough>();
  
  // Cache for 5 minutes by default
  private defaultTTL = 5 * 60 * 1000;
  
  static getInstance(): NeighborhoodCache {
    if (!NeighborhoodCache.instance) {
      NeighborhoodCache.instance = new NeighborhoodCache();
    }
    return NeighborhoodCache.instance;
  }

  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiry;
  }

  private createCacheEntry<T>(data: T, ttl: number = this.defaultTTL): CacheEntry<T> {
    return {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };
  }

  async getNeighborhoods(city?: string, forceRefresh = false): Promise<CachedNeighborhood[]> {
    const cacheKey = city || 'all';
    
    // Check cache first
    if (!forceRefresh && this.neighborhoodCache.has(cacheKey)) {
      const entry = this.neighborhoodCache.get(cacheKey)!;
      if (!this.isExpired(entry)) {
        console.log(`📋 NeighborhoodCache: Using cached neighborhoods for ${cacheKey}`);
        return entry.data;
      }
    }

    console.log(`📡 NeighborhoodCache: Fetching neighborhoods for ${cacheKey}`);
    
    try {
      // Fetch fresh data
      let neighborhoods: Neighborhood[];
      let boroughs: Borough[];

      if (city) {
        // Fetch by city
        const [neighborhoodsResponse, boroughsResponse] = await Promise.all([
          fetch(`/api/neighborhoods?city=${city}`),
          fetch(`/api/boroughs?city=${city}`)
        ]);
        neighborhoods = await neighborhoodsResponse.json();
        boroughs = await boroughsResponse.json();
      } else {
        // Fetch all
        [neighborhoods, boroughs] = await Promise.all([
          neighborhoodsApi.getAllNeighborhoods(),
          boroughsApi.getAllBoroughs()
        ]);
      }

      // Create borough lookup map
      const boroughMap = new Map<string, Borough>();
      boroughs.forEach(borough => {
        boroughMap.set(borough._id, borough);
        // Update borough ID map
        this.boroughIdMap.set(borough._id, {
          id: borough._id,
          name: borough.name,
          city: borough.city || 'NYC'
        });
      });

      // Transform neighborhoods with borough info
      const cachedNeighborhoods: CachedNeighborhood[] = neighborhoods.map(neighborhood => {
        const borough = boroughMap.get(neighborhood.boroughId);
        const cached: CachedNeighborhood = {
          id: neighborhood._id,
          name: neighborhood.name,
          boroughId: neighborhood.boroughId,
          boroughName: borough?.name || 'Unknown',
          city: neighborhood.city || borough?.city || 'NYC'
        };
        
        // Update neighborhood ID map
        this.neighborhoodIdMap.set(neighborhood._id, cached);
        
        return cached;
      });

      // Cache the results
      this.neighborhoodCache.set(cacheKey, this.createCacheEntry(cachedNeighborhoods));
      
      console.log(`✅ NeighborhoodCache: Cached ${cachedNeighborhoods.length} neighborhoods for ${cacheKey}`);
      return cachedNeighborhoods;
      
    } catch (error) {
      console.error(`❌ NeighborhoodCache: Failed to fetch neighborhoods for ${cacheKey}:`, error);
      throw error;
    }
  }

  async getBoroughs(city?: string, forceRefresh = false): Promise<CachedBorough[]> {
    const cacheKey = city || 'all';
    
    // Check cache first
    if (!forceRefresh && this.boroughCache.has(cacheKey)) {
      const entry = this.boroughCache.get(cacheKey)!;
      if (!this.isExpired(entry)) {
        console.log(`📋 NeighborhoodCache: Using cached boroughs for ${cacheKey}`);
        return entry.data;
      }
    }

    console.log(`📡 NeighborhoodCache: Fetching boroughs for ${cacheKey}`);
    
    try {
      // Fetch fresh data
      let boroughs: Borough[];

      if (city) {
        const response = await fetch(`/api/boroughs?city=${city}`);
        boroughs = await response.json();
      } else {
        boroughs = await boroughsApi.getAllBoroughs();
      }

      // Transform boroughs
      const cachedBoroughs: CachedBorough[] = boroughs.map(borough => {
        const cached: CachedBorough = {
          id: borough._id,
          name: borough.name,
          city: borough.city || 'NYC'
        };
        
        // Update borough ID map
        this.boroughIdMap.set(borough._id, cached);
        
        return cached;
      });

      // Cache the results
      this.boroughCache.set(cacheKey, this.createCacheEntry(cachedBoroughs));
      
      console.log(`✅ NeighborhoodCache: Cached ${cachedBoroughs.length} boroughs for ${cacheKey}`);
      return cachedBoroughs;
      
    } catch (error) {
      console.error(`❌ NeighborhoodCache: Failed to fetch boroughs for ${cacheKey}:`, error);
      throw error;
    }
  }

  // Quick lookup methods
  getNeighborhoodById(id: string): CachedNeighborhood | undefined {
    return this.neighborhoodIdMap.get(id);
  }

  getBoroughById(id: string): CachedBorough | undefined {
    return this.boroughIdMap.get(id);
  }

  getNeighborhoodName(id: string): string {
    const neighborhood = this.neighborhoodIdMap.get(id);
    return neighborhood?.name || 'Unknown';
  }

  getBoroughName(id: string): string {
    const borough = this.boroughIdMap.get(id);
    return borough?.name || 'Unknown';
  }

  // Get full neighborhood info including borough
  getNeighborhoodWithBorough(id: string): { neighborhood: string; borough: string; city: string } | null {
    const neighborhood = this.neighborhoodIdMap.get(id);
    if (!neighborhood) return null;

    return {
      neighborhood: neighborhood.name,
      borough: neighborhood.boroughName,
      city: neighborhood.city
    };
  }

  // Clear specific cache
  clearCache(city?: string) {
    const cacheKey = city || 'all';
    this.neighborhoodCache.delete(cacheKey);
    this.boroughCache.delete(cacheKey);
    
    if (!city) {
      // Clear all caches if no specific city
      this.neighborhoodCache.clear();
      this.boroughCache.clear();
      this.neighborhoodIdMap.clear();
      this.boroughIdMap.clear();
    }
    
    console.log(`🗑️ NeighborhoodCache: Cleared cache for ${cacheKey}`);
  }

  // Preload data for better UX
  async preloadData(cities: string[] = []): Promise<void> {
    console.log('🚀 NeighborhoodCache: Preloading data...');
    
    try {
      // Load all data if no specific cities
      if (cities.length === 0) {
        await Promise.all([
          this.getNeighborhoods(),
          this.getBoroughs()
        ]);
      } else {
        // Load specific cities
        const promises = cities.flatMap(city => [
          this.getNeighborhoods(city),
          this.getBoroughs(city)
        ]);
        await Promise.all(promises);
      }
      
      console.log('✅ NeighborhoodCache: Preload complete');
    } catch (error) {
      console.error('❌ NeighborhoodCache: Preload failed:', error);
    }
  }

  // Get cache stats
  getCacheStats() {
    return {
      neighborhoods: {
        cacheKeys: Array.from(this.neighborhoodCache.keys()),
        idMapSize: this.neighborhoodIdMap.size
      },
      boroughs: {
        cacheKeys: Array.from(this.boroughCache.keys()),
        idMapSize: this.boroughIdMap.size
      }
    };
  }
}

export const neighborhoodCache = NeighborhoodCache.getInstance();
export type { CachedNeighborhood, CachedBorough };
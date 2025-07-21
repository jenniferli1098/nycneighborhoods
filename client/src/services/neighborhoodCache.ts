import { neighborhoodsApi, type Neighborhood } from './neighborhoodsApi';
import { boroughsApi, type Borough } from './boroughsApi';
import { citiesApi, type City } from './citiesApi';

interface CachedNeighborhood {
  id: string;
  name: string;
  boroughId?: string;
  boroughName?: string;
  cityId?: string;
  cityName?: string;
  categoryType: 'borough' | 'city';
  city: string; // For backward compatibility
}

interface CachedBorough {
  id: string;
  name: string;
  cityId: string;
  cityName?: string;
  city: string; // For backward compatibility
}

interface CachedCity {
  id: string;
  name: string;
  state?: string;
  country: string;
  metropolitanArea?: string;
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
  private cityCache = new Map<string, CacheEntry<CachedCity[]>>();
  private neighborhoodIdMap = new Map<string, CachedNeighborhood>();
  private boroughIdMap = new Map<string, CachedBorough>();
  private cityIdMap = new Map<string, CachedCity>();
  
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
      let boroughs: Borough[] = [];
      let cities: City[] = [];

      if (city) {
        // Fetch by city
        const [neighborhoodsResponse, boroughsResponse, citiesResponse] = await Promise.all([
          fetch(`/api/neighborhoods?city=${city}`),
          fetch(`/api/boroughs?city=${city}`),
          citiesApi.getAllCities()
        ]);
        neighborhoods = await neighborhoodsResponse.json();
        boroughs = await boroughsResponse.json();
        cities = citiesResponse;
      } else {
        // Fetch all
        [neighborhoods, boroughs, cities] = await Promise.all([
          neighborhoodsApi.getAllNeighborhoods(),
          boroughsApi.getAllBoroughs(),
          citiesApi.getAllCities()
        ]);
      }

      // Create lookup maps
      const boroughMap = new Map<string, Borough>();
      const cityMap = new Map<string, City>();

      boroughs.forEach(borough => {
        boroughMap.set(borough._id, borough);
        // Update borough ID map
        const cityInfo = borough.city || (borough.cityId ? cityMap.get(borough.cityId) : null);
        this.boroughIdMap.set(borough._id, {
          id: borough._id,
          name: borough.name,
          cityId: borough.cityId,
          cityName: cityInfo?.name,
          city: cityInfo?.name || 'NYC'
        });
      });

      cities.forEach(city => {
        cityMap.set(city._id, city);
        // Update city ID map
        this.cityIdMap.set(city._id, {
          id: city._id,
          name: city.name,
          state: city.state,
          country: city.country,
          metropolitanArea: city.metropolitanArea
        });
      });

      // Transform neighborhoods with borough/city info
      const cachedNeighborhoods: CachedNeighborhood[] = neighborhoods.map(neighborhood => {
        if (neighborhood.categoryType === 'borough' && neighborhood.boroughId) {
          // Borough-based neighborhood (NYC)
          const borough = boroughMap.get(neighborhood.boroughId);
          const city = borough?.cityId ? cityMap.get(borough.cityId) : null;
          return {
            id: neighborhood._id,
            name: neighborhood.name,
            boroughId: neighborhood.boroughId,
            boroughName: borough?.name || 'Unknown',
            categoryType: 'borough',
            city: city?.name || 'NYC'
          };
        } else if (neighborhood.categoryType === 'city' && neighborhood.cityId) {
          // City-based neighborhood (Boston, etc.)
          const city = cityMap.get(neighborhood.cityId);
          return {
            id: neighborhood._id,
            name: neighborhood.name,
            cityId: neighborhood.cityId,
            cityName: city?.name || 'Unknown',
            categoryType: 'city',
            city: city?.name || 'Unknown'
          };
        } else {
          // Fallback for legacy data
          return {
            id: neighborhood._id,
            name: neighborhood.name,
            categoryType: neighborhood.categoryType || 'borough',
            city: 'Unknown'
          };
        }
      });

      // Update neighborhood ID maps
      cachedNeighborhoods.forEach(cached => {
        this.neighborhoodIdMap.set(cached.id, cached);
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
      let cities: City[] = [];

      if (city) {
        const [boroughsResponse, citiesResponse] = await Promise.all([
          fetch(`/api/boroughs?city=${city}`),
          citiesApi.getAllCities()
        ]);
        boroughs = await boroughsResponse.json();
        cities = citiesResponse;
      } else {
        [boroughs, cities] = await Promise.all([
          boroughsApi.getAllBoroughs(),
          citiesApi.getAllCities()
        ]);
      }

      // Create city lookup map
      const cityMap = new Map<string, City>();
      cities.forEach(city => {
        cityMap.set(city._id, city);
      });

      // Transform boroughs
      const cachedBoroughs: CachedBorough[] = boroughs.map(borough => {
        const city = borough.city || (borough.cityId ? cityMap.get(borough.cityId) : null);
        const cached: CachedBorough = {
          id: borough._id,
          name: borough.name,
          cityId: borough.cityId,
          cityName: city?.name,
          city: city?.name || 'NYC'
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

  async getCities(state?: string, forceRefresh = false): Promise<CachedCity[]> {
    const cacheKey = state || 'all';
    
    // Check cache first
    if (!forceRefresh && this.cityCache.has(cacheKey)) {
      const entry = this.cityCache.get(cacheKey)!;
      if (!this.isExpired(entry)) {
        console.log(`📋 NeighborhoodCache: Using cached cities for ${cacheKey}`);
        return entry.data;
      }
    }

    console.log(`📡 NeighborhoodCache: Fetching cities for ${cacheKey}`);
    
    try {
      // Fetch fresh data
      let cities: City[];

      if (state) {
        cities = await citiesApi.getCitiesByState(state);
      } else {
        cities = await citiesApi.getAllCities();
      }

      // Transform cities
      const cachedCities: CachedCity[] = cities.map(city => {
        const cached: CachedCity = {
          id: city._id,
          name: city.name,
          state: city.state,
          country: city.country,
          metropolitanArea: city.metropolitanArea
        };
        
        // Update city ID map
        this.cityIdMap.set(city._id, cached);
        
        return cached;
      });

      // Cache the results
      this.cityCache.set(cacheKey, this.createCacheEntry(cachedCities));
      
      console.log(`✅ NeighborhoodCache: Cached ${cachedCities.length} cities for ${cacheKey}`);
      return cachedCities;
      
    } catch (error) {
      console.error(`❌ NeighborhoodCache: Failed to fetch cities for ${cacheKey}:`, error);
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

  getCityById(id: string): CachedCity | undefined {
    return this.cityIdMap.get(id);
  }

  getNeighborhoodName(id: string): string {
    const neighborhood = this.neighborhoodIdMap.get(id);
    return neighborhood?.name || 'Unknown';
  }

  getBoroughName(id: string): string {
    const borough = this.boroughIdMap.get(id);
    return borough?.name || 'Unknown';
  }

  getCityName(id: string): string {
    const city = this.cityIdMap.get(id);
    return city?.name || 'Unknown';
  }

  // Get full neighborhood info including borough
  getNeighborhoodWithBorough(id: string): { neighborhood: string; borough: string; city: string } | null {
    const neighborhood = this.neighborhoodIdMap.get(id);
    if (!neighborhood) return null;

    return {
      neighborhood: neighborhood.name,
      borough: neighborhood.boroughName || '',
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
export type { CachedNeighborhood, CachedBorough, CachedCity };
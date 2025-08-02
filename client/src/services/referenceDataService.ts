import { type Neighborhood } from './neighborhoodsApi';
import { type District } from './districtsApi';

// Clean interface definitions aligned with current data model
export interface CachedNeighborhood {
  id: string;
  name: string;
  districtId: string;
  districtName?: string;
}

export interface CachedDistrict {
  id: string;
  name: string;
  type: 'borough' | 'city';
}

// For backward compatibility with existing code
export interface CachedBorough {
  id: string;
  name: string;
  cityId?: string;
  cityName?: string;
  city: string;
}

export interface CachedCity {
  id: string;
  name: string;
  state?: string;
  country?: string;
  metropolitanArea?: string;
}

/**
 * Simple reference data service for fast ID→name lookups
 * Replaces the complex NeighborhoodCache with a simpler approach
 */
class ReferenceDataService {
  private static instance: ReferenceDataService;
  
  // Simple lookup maps for fast access
  private neighborhoods = new Map<string, CachedNeighborhood>();
  private districts = new Map<string, CachedDistrict>();
  
  static getInstance(): ReferenceDataService {
    if (!ReferenceDataService.instance) {
      ReferenceDataService.instance = new ReferenceDataService();
    }
    return ReferenceDataService.instance;
  }

  /**
   * Populate the service with neighborhood and district data
   * Call this after loading data from APIs
   */
  populate(neighborhoods: Neighborhood[], districts: District[]): void {
    // Clear existing data
    this.neighborhoods.clear();
    this.districts.clear();
    
    // Create district lookup map first
    const districtMap = new Map<string, District>();
    districts.forEach(district => {
      districtMap.set(district._id, district);
      
      // Store in districts map with type information from mapData
      this.districts.set(district._id, {
        id: district._id,
        name: district.name,
        type: district.mapData?.type || 'borough' // Get type from populated mapData or default to borough
      });
    });
    
    // Transform and store neighborhoods
    neighborhoods.forEach(neighborhood => {
      const district = districtMap.get(neighborhood.district);
      
      const cachedNeighborhood: CachedNeighborhood = {
        id: neighborhood._id,
        name: neighborhood.name,
        districtId: neighborhood.district,
        districtName: district?.name
      };
      
      this.neighborhoods.set(neighborhood._id, cachedNeighborhood);
    });
    
    console.log(`✅ ReferenceDataService: Populated ${this.neighborhoods.size} neighborhoods and ${this.districts.size} districts`);
  }

  /**
   * Quick lookup methods - the main value of this service
   */
  getNeighborhoodById(id: string): CachedNeighborhood | undefined {
    return this.neighborhoods.get(id);
  }

  getDistrictById(id: string): CachedDistrict | undefined {
    return this.districts.get(id);
  }

  getNeighborhoodName(id: string): string {
    const neighborhood = this.neighborhoods.get(id);
    return neighborhood?.name || 'Unknown';
  }

  getDistrictName(id: string): string {
    const district = this.districts.get(id);
    return district?.name || 'Unknown';
  }

  /**
   * Get neighborhood with district info
   */
  getNeighborhoodWithDistrict(id: string): { neighborhood: string; district: string } | null {
    const neighborhood = this.neighborhoods.get(id);
    if (!neighborhood) return null;

    return {
      neighborhood: neighborhood.name,
      district: neighborhood.districtName || 'Unknown'
    };
  }

  /**
   * Get all neighborhoods for current session
   */
  getAllNeighborhoods(): CachedNeighborhood[] {
    return Array.from(this.neighborhoods.values());
  }

  /**
   * Get all districts for current session
   */
  getAllDistricts(): CachedDistrict[] {
    return Array.from(this.districts.values());
  }

  /**
   * Filter neighborhoods by district
   */
  getNeighborhoodsByDistrict(districtId: string): CachedNeighborhood[] {
    return Array.from(this.neighborhoods.values())
      .filter(n => n.districtId === districtId);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.neighborhoods.clear();
    this.districts.clear();
    console.log('🗑️ ReferenceDataService: Cleared all data');
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      neighborhoods: this.neighborhoods.size,
      districts: this.districts.size,
      memoryUsage: {
        neighborhoods: `${this.neighborhoods.size} entries`,
        districts: `${this.districts.size} entries`
      }
    };
  }

  // Backward compatibility methods for existing code
  getBoroughById(id: string): CachedBorough | undefined {
    const district = this.districts.get(id);
    if (!district) return undefined;
    
    return {
      id: district.id,
      name: district.name,
      city: district.name, // Simplified mapping
      cityId: district.id,
      cityName: district.name
    };
  }

  getBoroughName(id: string): string {
    return this.getDistrictName(id);
  }

  getCityById(id: string): CachedCity | undefined {
    const district = this.districts.get(id);
    if (!district || district.type !== 'city') return undefined;
    
    return {
      id: district.id,
      name: district.name,
      country: 'US' // Default assumption
    };
  }

  getCityName(id: string): string {
    return this.getDistrictName(id);
  }
}

export const referenceDataService = ReferenceDataService.getInstance();
export default referenceDataService;
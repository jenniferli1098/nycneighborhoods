// DEPRECATED: This file is replaced by referenceDataService.ts
// Keeping for backward compatibility during transition

import { referenceDataService } from './referenceDataService';

export { 
  referenceDataService as neighborhoodCache,
  type CachedNeighborhood,
  type CachedBorough, 
  type CachedCity,
  type CachedDistrict
} from './referenceDataService';

// Re-export for any existing imports
export default referenceDataService;
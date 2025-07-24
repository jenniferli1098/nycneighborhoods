// Elo-based ranking system utilities
// Maintains user-friendly categories while using sophisticated Elo ratings within each category

export type CategoryType = 'Bad' | 'Mid' | 'Good';

// Elo configuration
export const ELO_CONFIG = {
  K_FACTOR: 32,           // Sensitivity to new comparisons
  BASE_RATING: 1500,      // Starting rating for new items
  MIN_RATING: 800,        // Floor rating
  MAX_RATING: 2200,       // Ceiling rating
  
  // Category ranges (for display and migration purposes)
  CATEGORY_RANGES: {
    Bad: { min: 800, max: 1200, display: '0.0 - 2.5' },
    Mid: { min: 1201, max: 1800, display: '2.6 - 6.0' },
    Good: { min: 1801, max: 2200, display: '6.1 - 10.0' }
  }
} as const;

export interface EloRatingUpdate {
  visitId: string;
  entityId: string;
  oldRating: number;
  newRating: number;
  category: CategoryType;
}

export interface RankableItem {
  _id: string;
  name: string;
  location: string;
  rating: number;
  category: CategoryType;
  notes?: string;
}

/**
 * Calculate Elo rating change based on comparison outcome
 */
export function calculateEloChange(
  ratingA: number, 
  ratingB: number, 
  didAWin: boolean
): number {
  const expectedScoreA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const actualScore = didAWin ? 1 : 0;
  return Math.round(ELO_CONFIG.K_FACTOR * (actualScore - expectedScoreA));
}

/**
 * Get the base rating for a new item in a category
 */
export function getBaseCategoryRating(category: CategoryType): number {
  const range = ELO_CONFIG.CATEGORY_RANGES[category];
  return Math.floor((range.min + range.max) / 2);
}

/**
 * Ensure rating stays within category bounds
 */
export function clampRatingToCategory(rating: number, category: CategoryType): number {
  const range = ELO_CONFIG.CATEGORY_RANGES[category];
  return Math.max(range.min, Math.min(range.max, rating));
}

/**
 * Convert legacy rating (0-10 scale) to Elo rating within category
 */
export function convertLegacyRatingToElo(legacyRating: number, category: CategoryType): number {
  const range = ELO_CONFIG.CATEGORY_RANGES[category];
  const categorySpan = range.max - range.min;
  
  // Map legacy rating to position within category
  let normalizedPosition: number;
  switch (category) {
    case 'Bad':
      normalizedPosition = legacyRating / 2.5; // 0-2.5 -> 0-1
      break;
    case 'Mid':
      normalizedPosition = (legacyRating - 2.6) / (6.0 - 2.6); // 2.6-6.0 -> 0-1
      break;
    case 'Good':
      normalizedPosition = (legacyRating - 6.1) / (10.0 - 6.1); // 6.1-10.0 -> 0-1
      break;
  }
  
  normalizedPosition = Math.max(0, Math.min(1, normalizedPosition));
  return Math.round(range.min + (normalizedPosition * categorySpan));
}

/**
 * Convert Elo rating back to legacy scale for display
 */
export function convertEloToDisplayRating(eloRating: number, category: CategoryType): number {
  const range = ELO_CONFIG.CATEGORY_RANGES[category];
  const normalizedPosition = (eloRating - range.min) / (range.max - range.min);
  
  switch (category) {
    case 'Bad':
      return normalizedPosition * 2.5;
    case 'Mid':
      return 2.6 + (normalizedPosition * (6.0 - 2.6));
    case 'Good':
      return 6.1 + (normalizedPosition * (10.0 - 6.1));
  }
}

/**
 * Select optimal opponents for comparisons using uncertainty-based selection
 * Prioritizes items with ratings close to estimated position
 */
export function selectOptimalOpponents(
  existingItems: RankableItem[],
  estimatedRating: number,
  maxComparisons: number = 4
): RankableItem[] {
  if (existingItems.length === 0) return [];
  
  // Sort by distance from estimated rating
  const sortedByDistance = existingItems
    .map(item => ({
      item,
      distance: Math.abs(item.rating - estimatedRating)
    }))
    .sort((a, b) => a.distance - b.distance);
  
  // Take closest items, but ensure we get good spread
  const selected: RankableItem[] = [];
  const maxDistance = Math.max(...sortedByDistance.map(s => s.distance));
  
  for (let i = 0; i < Math.min(maxComparisons, sortedByDistance.length); i++) {
    const candidate = sortedByDistance[i];
    
    // Always include the closest item
    if (i === 0) {
      selected.push(candidate.item);
      continue;
    }
    
    // For subsequent items, prefer some diversity
    const minDistanceFromSelected = Math.min(
      ...selected.map(s => Math.abs(s.rating - candidate.item.rating))
    );
    
    // Include if it's reasonably close to estimate AND diverse from already selected
    if (candidate.distance <= maxDistance * 0.3 || minDistanceFromSelected >= 50) {
      selected.push(candidate.item);
    }
  }
  
  return selected.slice(0, maxComparisons);
}

/**
 * Calculate the optimal number of comparisons needed
 */
export function getOptimalComparisonCount(existingItemCount: number): number {
  if (existingItemCount === 0) return 0;
  if (existingItemCount <= 3) return existingItemCount;
  
  // Use log₂(n) + 1 as a baseline, capped at 5 comparisons
  return Math.min(5, Math.ceil(Math.log2(existingItemCount)) + 1);
}

/**
 * Process pairwise comparison and update ratings
 */
export function processComparison(
  newItemRating: number,
  opponentItem: RankableItem,
  newItemWon: boolean,
  category: CategoryType
): { newItemNewRating: number; opponentUpdate: EloRatingUpdate | null } {
  const ratingChange = calculateEloChange(newItemRating, opponentItem.rating, newItemWon);
  
  const newItemNewRating = clampRatingToCategory(newItemRating + ratingChange, category);
  const opponentNewRating = clampRatingToCategory(opponentItem.rating - ratingChange, category);
  
  // Only create update if rating actually changed
  const opponentUpdate = opponentNewRating !== opponentItem.rating ? {
    visitId: '', // Will be filled in by the component
    entityId: opponentItem._id,
    oldRating: opponentItem.rating,
    newRating: opponentNewRating,
    category: category
  } : null;
  
  return {
    newItemNewRating,
    opponentUpdate
  };
}